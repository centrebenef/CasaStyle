import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { db, enrichProducts, getSettingsMap, hashPassword, initSchema, verifyPassword } from './server/db.ts';
import { seedDatabase } from './server/seed.ts';

initSchema();
seedDatabase();

const app = express();
const PORT = 3000;
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const uploadsDir = isServerless ? '/tmp/casastyle-uploads' : path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seules les images sont autorisées.'));
  },
});

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));
app.use('/src/assets/images', express.static(path.join(process.cwd(), 'src/assets/images')));

function parseCookies(req: express.Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const result: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const k = part.slice(0, idx).trim();
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      result[k] = v;
    }
  }
  return result;
}

function getSessionUser(req: express.Request) {
  const cookies = parseCookies(req);
  const token = cookies.casa_session;
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.username, u.email, u.role, u.full_name, u.is_active
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now') AND u.is_active = 1`
    )
    .get(token) as any;
  if (!row) return null;

  const customer = db
    .prepare('SELECT id, phone, city, address, postal_code, is_active FROM customers WHERE user_id = ?')
    .get(row.id) as any;

  if (customer && customer.is_active === 0) return null;

  return {
    ...row,
    customer_id: customer?.id ?? null,
    phone: customer?.phone ?? '',
    city: customer?.city ?? 'Casablanca',
    address: customer?.address ?? '',
    postal_code: customer?.postal_code ?? '',
  };
}

function setSessionCookie(res: express.Response, userId: number) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(
    token,
    userId
  );
  res.setHeader(
    'Set-Cookie',
    `casa_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
  );
}

function clearSessionCookie(req: express.Request, res: express.Response) {
  const cookies = parseCookies(req);
  if (cookies.casa_session) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(cookies.casa_session);
  }
  res.setHeader('Set-Cookie', 'casa_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentification requise.' });
    return;
  }
  (req as any).user = user;
  next();
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Accès administrateur requis.' });
    return;
  }
  (req as any).user = user;
  next();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// ==================== AUTH ROUTES ====================

app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    res.status(400).json({ error: 'Identifiant et mot de passe requis.' });
    return;
  }

  const user = db
    .prepare('SELECT * FROM users WHERE (username = ? OR email = ?) LIMIT 1')
    .get(String(identifier).trim(), String(identifier).trim()) as any;

  if (!user || !verifyPassword(String(password), user.password_hash)) {
    res.status(401).json({ error: 'Identifiants invalides.' });
    return;
  }

  if (user.is_active === 0) {
    res.status(403).json({ error: 'Ce compte a été désactivé.' });
    return;
  }

  if (user.role === 'customer') {
    const cust = db.prepare('SELECT is_active FROM customers WHERE user_id = ?').get(user.id) as any;
    if (cust && cust.is_active === 0) {
      res.status(403).json({ error: 'Ce compte client est désactivé.' });
      return;
    }
  }

  setSessionCookie(res, user.id);
  const fullUser = db
    .prepare('SELECT id, username, email, role, full_name FROM users WHERE id = ?')
    .get(user.id) as any;
  const customer = db
    .prepare('SELECT phone, city, address, postal_code FROM customers WHERE user_id = ?')
    .get(user.id) as any;

  res.json({
    user: {
      ...fullUser,
      phone: customer?.phone ?? '',
      city: customer?.city ?? 'Casablanca',
      address: customer?.address ?? '',
      postal_code: customer?.postal_code ?? '',
    },
  });
});

app.post('/api/auth/register', (req, res) => {
  const { full_name, email, password, phone, city, address, postal_code } = req.body || {};
  if (!full_name || !email || !password || !phone) {
    res.status(400).json({ error: 'Nom complet, e-mail, téléphone et mot de passe sont obligatoires.' });
    return;
  }
  if (String(password).length < 6) {
    res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    res.status(409).json({ error: 'Un compte existe déjà avec cette adresse e-mail.' });
    return;
  }

  const username = `${slugify(full_name).slice(0, 18) || 'client'}-${crypto.randomBytes(2).toString('hex')}`;

  const createTx = db.transaction(() => {
    const uRes = db
      .prepare('INSERT INTO users (username, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?)')
      .run(username, cleanEmail, hashPassword(String(password)), 'customer', String(full_name).trim());
    const userId = Number(uRes.lastInsertRowid);

    db.prepare(
      'INSERT INTO customers (user_id, full_name, email, phone, city, address, postal_code, is_active, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)'
    ).run(
      userId,
      String(full_name).trim(),
      cleanEmail,
      String(phone).trim(),
      String(city || 'Casablanca'),
      String(address || ''),
      String(postal_code || '')
    );

    return userId;
  });

  const userId = createTx();
  setSessionCookie(res, userId);

  res.status(201).json({
    user: {
      id: userId,
      username,
      email: cleanEmail,
      role: 'customer',
      full_name: String(full_name).trim(),
      phone: String(phone).trim(),
      city: String(city || 'Casablanca'),
      address: String(address || ''),
      postal_code: String(postal_code || ''),
    },
  });
});

app.post('/api/auth/logout', (req, res) => {
  clearSessionCookie(req, res);
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const user = getSessionUser(req);
  res.json({ user });
});

// ==================== STOREFRONT PUBLIC ROUTES ====================

app.get('/api/settings', (_req, res) => {
  res.json(getSettingsMap());
});

app.get('/api/categories', (req, res) => {
  const { gender } = req.query;
  let sql = `
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
    WHERE c.is_active = 1
  `;
  const params: any[] = [];
  if (gender && (gender === 'femme' || gender === 'homme')) {
    sql += ' AND c.gender = ?';
    params.push(gender);
  }
  sql += ' GROUP BY c.id ORDER BY c.sort_order ASC, c.id ASC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.get('/api/products', (req, res) => {
  const {
    gender,
    category,
    search,
    minPrice,
    maxPrice,
    size,
    color,
    isNew,
    isBestseller,
    isPromo,
    sort,
  } = req.query;

  let sql = `
    SELECT DISTINCT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = 1 AND c.is_active = 1
  `;
  const params: any[] = [];

  if (gender && (gender === 'femme' || gender === 'homme')) {
    sql += ' AND p.gender = ?';
    params.push(gender);
  }
  if (category) {
    sql += ' AND (c.slug = ? OR c.name = ? OR p.category_id = ?)';
    params.push(category, category, Number(category) || -1);
  }
  if (search) {
    const q = `%${String(search).trim()}%`;
    sql += ' AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)';
    params.push(q, q, q);
  }
  if (minPrice !== undefined && minPrice !== '') {
    sql += ' AND p.price_mad >= ?';
    params.push(Number(minPrice));
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    sql += ' AND p.price_mad <= ?';
    params.push(Number(maxPrice));
  }
  if (isNew === '1' || isNew === 'true') {
    sql += ' AND p.is_new = 1';
  }
  if (isBestseller === '1' || isBestseller === 'true') {
    sql += ' AND p.is_bestseller = 1';
  }
  if (isPromo === '1' || isPromo === 'true') {
    sql += ' AND (p.is_promo = 1 OR p.old_price_mad IS NOT NULL)';
  }
  if (size) {
    sql += ' AND EXISTS (SELECT 1 FROM product_sizes ps WHERE ps.product_id = p.id AND ps.size = ?)';
    params.push(size);
  }
  if (color) {
    sql += ' AND EXISTS (SELECT 1 FROM product_colors pc WHERE pc.product_id = p.id AND LOWER(pc.color_name) LIKE LOWER(?))';
    params.push(`%${color}%`);
  }

  switch (sort) {
    case 'price_asc':
      sql += ' ORDER BY p.price_mad ASC, p.id DESC';
      break;
    case 'price_desc':
      sql += ' ORDER BY p.price_mad DESC, p.id DESC';
      break;
    case 'bestsellers':
      sql += ' ORDER BY p.is_bestseller DESC, p.id DESC';
      break;
    case 'newest':
    default:
      sql += ' ORDER BY p.is_new DESC, p.created_at DESC, p.id DESC';
      break;
  }

  const raw = db.prepare(sql).all(...params);
  res.json(enrichProducts(raw));
});

app.get('/api/products/:slug', (req, res) => {
  const raw = db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.is_active = 1`
    )
    .get(req.params.slug) as any;

  if (!raw) {
    res.status(404).json({ error: 'Produit introuvable.' });
    return;
  }

  const [product] = enrichProducts([raw]);
  const relatedRaw = db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = 1 AND p.id != ? AND (p.category_id = ? OR p.gender = ?)
       ORDER BY (CASE WHEN p.category_id = ? THEN 0 ELSE 1 END), p.is_bestseller DESC
       LIMIT 4`
    )
    .all(raw.id, raw.category_id, raw.gender, raw.category_id);

  res.json({ product, related: enrichProducts(relatedRaw) });
});

app.get('/api/promotions', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT pr.*, p.name as product_name, p.slug as product_slug
       FROM promotions pr
       LEFT JOIN products p ON p.id = pr.product_id
       WHERE pr.is_active = 1
       ORDER BY pr.id DESC`
    )
    .all();
  res.json(rows);
});

app.post('/api/orders', (req, res) => {
  const {
    customer_name,
    customer_phone,
    customer_email,
    city,
    address,
    postal_code,
    notes,
    payment_method,
    items,
  } = req.body || {};

  if (!customer_name || !customer_phone || !customer_email || !city || !address) {
    res.status(400).json({ error: 'Veuillez renseigner tous les champs obligatoires de livraison.' });
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Votre panier est vide.' });
    return;
  }

  const sessionUser = getSessionUser(req);
  const settings = getSettingsMap();
  const casaFee = Number(settings.shipping_casablanca_mad || 30);
  const otherFee = Number(settings.shipping_other_mad || 45);
  const freeThreshold = Number(settings.free_shipping_threshold_mad || 1200);

  try {
    const result = db.transaction(() => {
      let subtotal = 0;
      const verifiedItems: Array<{
        productId: number;
        name: string;
        image: string;
        size: string;
        color: string;
        qty: number;
        unitPrice: number;
        lineTotal: number;
      }> = [];

      for (const item of items) {
        const pid = Number(item.productId);
        const qty = Math.max(1, Number(item.quantity) || 1);
        const size = String(item.size || '');
        const color = String(item.color_name || '');

        if (!size || !color) {
          throw new Error('Veuillez sélectionner la taille et la couleur pour chaque article.');
        }

        const prod = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(pid) as any;
        if (!prod) {
          throw new Error(`Un produit de votre panier n'est plus disponible.`);
        }

        const inv = db
          .prepare('SELECT * FROM inventory WHERE product_id = ? AND size = ? AND color_name = ?')
          .get(pid, size, color) as any;

        if (!inv || inv.quantity < qty) {
          throw new Error(`Stock insuffisant pour "${prod.name}" (${size}, ${color}).`);
        }

        const primaryImg = db
          .prepare('SELECT image_url FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC LIMIT 1')
          .get(pid) as any;

        const lineTotal = prod.price_mad * qty;
        subtotal += lineTotal;

        verifiedItems.push({
          productId: pid,
          name: prod.name,
          image: primaryImg?.image_url || '',
          size,
          color,
          qty,
          unitPrice: prod.price_mad,
          lineTotal,
        });
      }

      const cleanCity = String(city).trim();
      const baseShipping = cleanCity.toLowerCase() === 'casablanca' ? casaFee : otherFee;
      const shippingFee = subtotal >= freeThreshold ? 0 : baseShipping;
      const total = subtotal + shippingFee;

      let customerId: number | null = sessionUser?.customer_id ?? null;
      if (!customerId) {
        const existingCust = db
          .prepare('SELECT id FROM customers WHERE LOWER(email) = LOWER(?) LIMIT 1')
          .get(String(customer_email).trim()) as any;
        if (existingCust) {
          customerId = existingCust.id;
        } else {
          const cRes = db
            .prepare(
              'INSERT INTO customers (user_id, full_name, email, phone, city, address, postal_code, is_active, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)'
            )
            .run(
              sessionUser?.id ?? null,
              String(customer_name).trim(),
              String(customer_email).trim(),
              String(customer_phone).trim(),
              cleanCity,
              String(address).trim(),
              String(postal_code || '').trim()
            );
          customerId = Number(cRes.lastInsertRowid);
        }
      }

      const uniqueCode = `CS-${new Date().getFullYear()}-${crypto.randomInt(1000, 9999)}`;
      const method = payment_method === 'online_card' ? 'online_card' : 'cod';
      const pStatus = method === 'online_card' ? 'Pré-autorisé (Simulation CMI)' : 'À régler à la livraison';

      const oRes = db
        .prepare(
          `INSERT INTO orders (
            order_number, customer_id, customer_name, customer_phone, customer_email,
            city, address, postal_code, notes, payment_method, payment_status,
            status, subtotal_mad, shipping_fee_mad, total_mad, is_demo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'En attente', ?, ?, ?, 0)`
        )
        .run(
          uniqueCode,
          customerId,
          String(customer_name).trim(),
          String(customer_phone).trim(),
          String(customer_email).trim(),
          cleanCity,
          String(address).trim(),
          String(postal_code || '').trim(),
          String(notes || '').trim(),
          method,
          pStatus,
          subtotal,
          shippingFee,
          total
        );
      const orderId = Number(oRes.lastInsertRowid);

      const insItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, product_image, size, color_name, quantity, unit_price_mad, line_total_mad)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const decInv = db.prepare(
        "UPDATE inventory SET quantity = quantity - ?, updated_at = datetime('now') WHERE product_id = ? AND size = ? AND color_name = ?"
      );
      const insMove = db.prepare(
        "INSERT INTO inventory_movements (product_id, size, color_name, type, quantity_delta, reason) VALUES (?, ?, ?, 'out', ?, ?)"
      );

      for (const vi of verifiedItems) {
        insItem.run(orderId, vi.productId, vi.name, vi.image, vi.size, vi.color, vi.qty, vi.unitPrice, vi.lineTotal);
        decInv.run(vi.qty, vi.productId, vi.size, vi.color);
        insMove.run(vi.productId, vi.size, vi.color, -vi.qty, `Commande ${uniqueCode}`);
      }

      db.prepare('INSERT INTO payments (order_id, method, amount_mad, status, transaction_ref) VALUES (?, ?, ?, ?, ?)').run(
        orderId,
        method,
        total,
        pStatus,
        `PAY-${uniqueCode}`
      );

      return { order_number: uniqueCode, order_id: orderId };
    })();

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.order_id) as any;
    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(result.order_id);
    res.status(201).json({ ...order, items: orderItems });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Impossible de valider la commande.' });
  }
});

app.get('/api/orders/:orderNumber', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(req.params.orderNumber) as any;
  if (!order) {
    res.status(404).json({ error: 'Commande introuvable.' });
    return;
  }
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

app.post('/api/newsletter', (req, res) => {
  const { email } = req.body || {};
  if (!email || !String(email).includes('@')) {
    res.status(400).json({ error: 'Adresse e-mail invalide.' });
    return;
  }
  try {
    db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)').run(String(email).trim().toLowerCase());
    res.status(201).json({ ok: true, message: 'Merci ! Vous êtes inscrit(e) à la newsletter CASA STYLE.' });
  } catch {
    res.status(500).json({ error: 'Erreur lors de l’inscription.' });
  }
});

app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body || {};
  if (!name || !email || !subject || !message) {
    res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires.' });
    return;
  }
  db.prepare('INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)').run(
    String(name).trim(),
    String(email).trim(),
    String(phone || '').trim(),
    String(subject).trim(),
    String(message).trim()
  );
  res.status(201).json({ ok: true, message: 'Votre message a bien été envoyé à notre équipe à Casablanca.' });
});

// ==================== CASA STYLE COMMUNITY ROUTES ====================

app.get('/api/community', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT cp.*,
              p.name as product_name,
              p.slug as product_slug,
              p.price_mad as product_price_mad,
              p.gender as product_gender
       FROM community_posts cp
       LEFT JOIN products p ON p.id = cp.product_id
       WHERE cp.is_published = 1
       ORDER BY cp.created_at DESC, cp.id DESC`
    )
    .all();
  res.json(rows);
});

app.post('/api/community/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Aucune image reçue.' });
    return;
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.post('/api/community', (req, res) => {
  const { customer_name, city, product_id, image_url, rating, comment } = req.body || {};
  if (!customer_name || !comment || !image_url) {
    res.status(400).json({ error: 'Votre nom, une photo et votre commentaire sont requis.' });
    return;
  }
  const cleanRating = Math.min(5, Math.max(1, Number(rating) || 5));
  const r = db
    .prepare(
      'INSERT INTO community_posts (customer_name, city, product_id, image_url, rating, comment, likes_count, is_published) VALUES (?, ?, ?, ?, ?, ?, 1, 1)'
    )
    .run(
      String(customer_name).trim(),
      String(city || 'Casablanca').trim(),
      product_id ? Number(product_id) : null,
      String(image_url).trim(),
      cleanRating,
      String(comment).trim()
    );

  const created = db
    .prepare(
      `SELECT cp.*,
              p.name as product_name,
              p.slug as product_slug,
              p.price_mad as product_price_mad,
              p.gender as product_gender
       FROM community_posts cp
       LEFT JOIN products p ON p.id = cp.product_id
       WHERE cp.id = ?`
    )
    .get(r.lastInsertRowid);

  res.status(201).json(created);
});

app.post('/api/community/:id/like', (req, res) => {
  const id = Number(req.params.id);
  db.prepare('UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ?').run(id);
  const row = db.prepare('SELECT id, likes_count FROM community_posts WHERE id = ?').get(id);
  if (!row) {
    res.status(404).json({ error: 'Publication introuvable.' });
    return;
  }
  res.json(row);
});

// ==================== CUSTOMER ACCOUNT ROUTES ====================

app.put('/api/account/profile', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { full_name, phone, city, address, postal_code } = req.body || {};
  if (!full_name) {
    res.status(400).json({ error: 'Le nom complet est requis.' });
    return;
  }
  db.transaction(() => {
    db.prepare('UPDATE users SET full_name = ? WHERE id = ?').run(String(full_name).trim(), user.id);
    const existingCust = db.prepare('SELECT id FROM customers WHERE user_id = ?').get(user.id) as any;
    if (existingCust) {
      db.prepare('UPDATE customers SET full_name = ?, phone = ?, city = ?, address = ?, postal_code = ? WHERE user_id = ?').run(
        String(full_name).trim(),
        String(phone || '').trim(),
        String(city || 'Casablanca'),
        String(address || '').trim(),
        String(postal_code || '').trim(),
        user.id
      );
    } else {
      db.prepare(
        'INSERT INTO customers (user_id, full_name, email, phone, city, address, postal_code, is_active, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)'
      ).run(
        user.id,
        String(full_name).trim(),
        user.email,
        String(phone || '').trim(),
        String(city || 'Casablanca'),
        String(address || '').trim(),
        String(postal_code || '').trim()
      );
    }
  })();

  res.json({ user: getSessionUser(req) });
});

app.get('/api/account/orders', requireAuth, (req, res) => {
  const user = (req as any).user;
  const orders = db
    .prepare(
      `SELECT o.* FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       WHERE c.user_id = ? OR LOWER(o.customer_email) = LOWER(?)
       ORDER BY o.created_at DESC, o.id DESC`
    )
    .all(user.id, user.email) as any[];

  const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  const enriched = orders.map((o) => ({ ...o, items: getItems.all(o.id) }));
  res.json(enriched);
});

app.get('/api/account/favorites', requireAuth, (req, res) => {
  const user = (req as any).user;
  const raw = db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM favorites f
       JOIN products p ON p.id = f.product_id
       JOIN categories c ON c.id = p.category_id
       WHERE f.user_id = ? AND p.is_active = 1
       ORDER BY f.created_at DESC`
    )
    .all(user.id);
  res.json(enrichProducts(raw));
});

app.post('/api/account/favorites/:productId', requireAuth, (req, res) => {
  const user = (req as any).user;
  const productId = Number(req.params.productId);
  const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?').get(user.id, productId) as any;
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
    res.json({ favorited: false });
  } else {
    db.prepare('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)').run(user.id, productId);
    res.json({ favorited: true });
  }
});

// ==================== ADMIN ROUTES ====================

app.post('/api/admin/upload', requireAdmin, upload.array('images', 8), (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const urls = files.map((f) => `/uploads/${f.filename}`);
  res.json({ urls });
});

app.get('/api/admin/dashboard', requireAdmin, (req, res) => {
  const mode = req.query.mode === 'real' ? 'real' : 'all';
  const demoFilter = mode === 'real' ? 'AND is_demo = 0' : '';

  const totalProducts = (db.prepare('SELECT COUNT(*) as cnt FROM products').get() as any).cnt;
  const totalOrders = (db.prepare(`SELECT COUNT(*) as cnt FROM orders WHERE 1=1 ${demoFilter}`).get() as any).cnt;
  const totalCustomers = (db.prepare(`SELECT COUNT(*) as cnt FROM customers WHERE 1=1 ${demoFilter}`).get() as any).cnt;
  const revenueRow = db
    .prepare(`SELECT COALESCE(SUM(total_mad), 0) as rev FROM orders WHERE status != 'Annulée' ${demoFilter}`)
    .get() as any;
  const pendingOrders = (
    db.prepare(`SELECT COUNT(*) as cnt FROM orders WHERE status = 'En attente' ${demoFilter}`).get() as any
  ).cnt;
  const outOfStockProducts = (
    db
      .prepare(
        `SELECT COUNT(*) as cnt FROM (
           SELECT p.id, COALESCE(SUM(i.quantity), 0) as total_qty
           FROM products p
           LEFT JOIN inventory i ON i.product_id = p.id
           GROUP BY p.id
           HAVING total_qty <= 0
         )`
      )
      .get() as any
  ).cnt;

  const monthlySales = db
    .prepare(
      `SELECT strftime('%Y-%m', created_at) as month,
              COALESCE(SUM(CASE WHEN status != 'Annulée' THEN total_mad ELSE 0 END), 0) as revenue,
              COUNT(*) as orders_count
       FROM orders
       WHERE 1=1 ${demoFilter}
       GROUP BY strftime('%Y-%m', created_at)
       ORDER BY month ASC
       LIMIT 12`
    )
    .all();

  const ordersByStatus = db
    .prepare(
      `SELECT status, COUNT(*) as count
       FROM orders
       WHERE 1=1 ${demoFilter}
       GROUP BY status`
    )
    .all();

  const topProducts = db
    .prepare(
      `SELECT oi.product_id, oi.product_name, oi.product_image,
              SUM(oi.quantity) as units_sold,
              SUM(oi.line_total_mad) as total_revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status != 'Annulée' ${mode === 'real' ? 'AND o.is_demo = 0' : ''}
       GROUP BY oi.product_id, oi.product_name
       ORDER BY units_sold DESC
       LIMIT 5`
    )
    .all();

  const latestOrders = db
    .prepare(`SELECT * FROM orders WHERE 1=1 ${demoFilter} ORDER BY created_at DESC, id DESC LIMIT 6`)
    .all();

  const recentActivity = db
    .prepare(
      `SELECT im.*, p.name as product_name
       FROM inventory_movements im
       JOIN products p ON p.id = im.product_id
       ORDER BY im.created_at DESC, im.id DESC
       LIMIT 8`
    )
    .all();

  res.json({
    kpis: {
      totalProducts,
      totalOrders,
      totalCustomers,
      revenueMad: revenueRow.rev,
      pendingOrders,
      outOfStockProducts,
    },
    monthlySales,
    ordersByStatus,
    topProducts,
    latestOrders,
    recentActivity,
  });
});

// Admin Products CRUD
app.get('/api/admin/products', requireAdmin, (_req, res) => {
  const raw = db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.id DESC`
    )
    .all();
  res.json(enrichProducts(raw));
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const {
    category_id,
    name,
    gender,
    description,
    price_mad,
    old_price_mad,
    is_new,
    is_bestseller,
    is_promo,
    is_active,
    images,
    sizes,
    colors,
    initial_stock,
  } = req.body || {};

  if (!name || !category_id || !gender || !price_mad) {
    res.status(400).json({ error: 'Nom, catégorie, genre et prix sont requis.' });
    return;
  }

  const baseSlug = slugify(String(name));
  const slug = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;
  const validSizes: string[] = Array.isArray(sizes) && sizes.length > 0 ? sizes : ['M'];
  const validColors: Array<{ color_name: string; color_hex: string }> =
    Array.isArray(colors) && colors.length > 0 ? colors : [{ color_name: 'Noir', color_hex: '#111111' }];
  const validImages: string[] = Array.isArray(images) && images.length > 0 ? images : ['/src/assets/images/femme_blazer_noir_1794761388257.jpg'];
  const qty = Math.max(0, Number(initial_stock ?? 10));

  const newId = db.transaction(() => {
    const pRes = db
      .prepare(
        `INSERT INTO products (category_id, name, slug, gender, description, price_mad, old_price_mad, is_new, is_bestseller, is_promo, is_active, is_demo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
      )
      .run(
        Number(category_id),
        String(name).trim(),
        slug,
        gender,
        String(description || '').trim(),
        Number(price_mad),
        old_price_mad ? Number(old_price_mad) : null,
        is_new ? 1 : 0,
        is_bestseller ? 1 : 0,
        is_promo ? 1 : 0,
        is_active === 0 ? 0 : 1
      );
    const pid = Number(pRes.lastInsertRowid);

    const insImg = db.prepare('INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)');
    validImages.forEach((url, idx) => insImg.run(pid, url, idx, idx === 0 ? 1 : 0));

    const insSize = db.prepare('INSERT INTO product_sizes (product_id, size) VALUES (?, ?)');
    for (const s of validSizes) insSize.run(pid, s);

    const insColor = db.prepare('INSERT INTO product_colors (product_id, color_name, color_hex) VALUES (?, ?, ?)');
    for (const c of validColors) insColor.run(pid, c.color_name, c.color_hex);

    const insInv = db.prepare('INSERT INTO inventory (product_id, size, color_name, quantity, low_stock_threshold) VALUES (?, ?, ?, ?, 5)');
    for (const s of validSizes) {
      for (const c of validColors) {
        insInv.run(pid, s, c.color_name, qty);
      }
    }

    db.prepare(
      "INSERT INTO inventory_movements (product_id, size, color_name, type, quantity_delta, reason) VALUES (?, ?, ?, 'in', ?, 'Création produit')"
    ).run(pid, validSizes[0], validColors[0].color_name, qty * validSizes.length * validColors.length);

    return pid;
  })();

  const [created] = enrichProducts([
    db
      .prepare('SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?')
      .get(newId),
  ]);
  res.status(201).json(created);
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const pid = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(pid) as any;
  if (!existing) {
    res.status(404).json({ error: 'Produit introuvable.' });
    return;
  }

  const {
    category_id,
    name,
    gender,
    description,
    price_mad,
    old_price_mad,
    is_new,
    is_bestseller,
    is_promo,
    is_active,
    images,
    sizes,
    colors,
    stock_override,
  } = req.body || {};

  db.transaction(() => {
    db.prepare(
      `UPDATE products
       SET category_id = ?, name = ?, gender = ?, description = ?, price_mad = ?, old_price_mad = ?,
           is_new = ?, is_bestseller = ?, is_promo = ?, is_active = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      Number(category_id ?? existing.category_id),
      String(name ?? existing.name).trim(),
      gender ?? existing.gender,
      String(description ?? existing.description).trim(),
      Number(price_mad ?? existing.price_mad),
      old_price_mad ? Number(old_price_mad) : null,
      is_new ? 1 : 0,
      is_bestseller ? 1 : 0,
      is_promo ? 1 : 0,
      is_active === 0 ? 0 : 1,
      pid
    );

    if (Array.isArray(images) && images.length > 0) {
      db.prepare('DELETE FROM product_images WHERE product_id = ?').run(pid);
      const insImg = db.prepare('INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)');
      images.forEach((url: string, idx: number) => insImg.run(pid, url, idx, idx === 0 ? 1 : 0));
    }

    if (Array.isArray(sizes) && sizes.length > 0) {
      db.prepare('DELETE FROM product_sizes WHERE product_id = ?').run(pid);
      const insSize = db.prepare('INSERT INTO product_sizes (product_id, size) VALUES (?, ?)');
      for (const s of sizes) insSize.run(pid, s);
    }

    if (Array.isArray(colors) && colors.length > 0) {
      db.prepare('DELETE FROM product_colors WHERE product_id = ?').run(pid);
      const insColor = db.prepare('INSERT INTO product_colors (product_id, color_name, color_hex) VALUES (?, ?, ?)');
      for (const c of colors) insColor.run(pid, c.color_name, c.color_hex);
    }

    // Ensure inventory matrix matches sizes x colors
    const currentSizes = (db.prepare('SELECT size FROM product_sizes WHERE product_id = ?').all(pid) as any[]).map((x) => x.size);
    const currentColors = db.prepare('SELECT color_name FROM product_colors WHERE product_id = ?').all(pid) as any[];

    for (const s of currentSizes) {
      for (const c of currentColors) {
        const inv = db
          .prepare('SELECT id, quantity FROM inventory WHERE product_id = ? AND size = ? AND color_name = ?')
          .get(pid, s, c.color_name) as any;
        if (!inv) {
          db.prepare('INSERT INTO inventory (product_id, size, color_name, quantity, low_stock_threshold) VALUES (?, ?, ?, ?, 5)').run(
            pid,
            s,
            c.color_name,
            stock_override !== undefined && stock_override !== '' ? Math.max(0, Number(stock_override)) : 8
          );
        } else if (stock_override !== undefined && stock_override !== '') {
          db.prepare("UPDATE inventory SET quantity = ?, updated_at = datetime('now') WHERE id = ?").run(
            Math.max(0, Number(stock_override)),
            inv.id
          );
        }
      }
    }
  })();

  const [updated] = enrichProducts([
    db
      .prepare('SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?')
      .get(pid),
  ]);
  res.json(updated);
});

app.patch('/api/admin/products/:id/toggle', requireAdmin, (req, res) => {
  const pid = Number(req.params.id);
  const { field } = req.body || {};
  if (!['is_active', 'is_new', 'is_promo', 'is_bestseller'].includes(field)) {
    res.status(400).json({ error: 'Champ invalide.' });
    return;
  }
  db.prepare(`UPDATE products SET ${field} = CASE WHEN ${field} = 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?`).run(pid);
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(pid);
  res.json(row);
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const pid = Number(req.params.id);
  db.prepare('DELETE FROM products WHERE id = ?').run(pid);
  res.json({ ok: true });
});

// Admin Categories CRUD
app.get('/api/admin/categories', requireAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.id ASC`
    )
    .all();
  res.json(rows);
});

app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { name, gender, description, image_url, sort_order, is_active } = req.body || {};
  if (!name || !gender) {
    res.status(400).json({ error: 'Nom et genre requis.' });
    return;
  }
  const slug = `${gender}-${slugify(String(name))}-${crypto.randomBytes(2).toString('hex')}`;
  const r = db
    .prepare('INSERT INTO categories (name, slug, gender, description, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(
      String(name).trim(),
      slug,
      gender,
      String(description || ''),
      String(image_url || '/src/assets/images/accessoires_atelier_1794761391155.jpg'),
      Number(sort_order || 0),
      is_active === 0 ? 0 : 1
    );
  res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(r.lastInsertRowid));
});

app.put('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { name, gender, description, image_url, sort_order, is_active } = req.body || {};
  db.prepare('UPDATE categories SET name = ?, gender = ?, description = ?, image_url = ?, sort_order = ?, is_active = ? WHERE id = ?').run(
    String(name).trim(),
    gender,
    String(description || ''),
    String(image_url || ''),
    Number(sort_order || 0),
    is_active === 0 ? 0 : 1,
    id
  );
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(id));
});

app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const count = (db.prepare('SELECT COUNT(*) as cnt FROM products WHERE category_id = ?').get(id) as any).cnt;
  if (count > 0) {
    res.status(400).json({ error: 'Impossible de supprimer une catégorie contenant encore des produits.' });
    return;
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ ok: true });
});

// Admin Orders
app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const { status, type } = req.query;
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params: any[] = [];
  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (type === 'real') sql += ' AND is_demo = 0';
  if (type === 'demo') sql += ' AND is_demo = 1';
  sql += ' ORDER BY created_at DESC, id DESC';

  const orders = db.prepare(sql).all(...params) as any[];
  const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  res.json(orders.map((o) => ({ ...o, items: getItems.all(o.id) })));
});

app.patch('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  const allowed = ['En attente', 'Confirmée', 'En préparation', 'Expédiée', 'Livrée', 'Annulée'];
  if (!allowed.includes(status)) {
    res.status(400).json({ error: 'Statut de commande invalide.' });
    return;
  }

  db.transaction(() => {
    db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
    if (status === 'Livrée') {
      db.prepare("UPDATE orders SET payment_status = 'Payé' WHERE id = ?").run(id);
      db.prepare("UPDATE payments SET status = 'Payé' WHERE order_id = ?").run(id);
    }
  })();

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  res.json({ ...updated, items });
});

// Admin Customers
app.get('/api/admin/customers', requireAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*,
              COUNT(o.id) as orders_count,
              COALESCE(SUM(CASE WHEN o.status != 'Annulée' THEN o.total_mad ELSE 0 END), 0) as total_spent_mad
       FROM customers c
       LEFT JOIN orders o ON o.customer_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC, c.id DESC`
    )
    .all();
  res.json(rows);
});

app.get('/api/admin/customers/:id/orders', requireAdmin, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC').all(Number(req.params.id)) as any[];
  const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  res.json(orders.map((o) => ({ ...o, items: getItems.all(o.id) })));
});

app.patch('/api/admin/customers/:id/toggle', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  db.transaction(() => {
    db.prepare('UPDATE customers SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
    const cust = db.prepare('SELECT user_id, is_active FROM customers WHERE id = ?').get(id) as any;
    if (cust?.user_id) {
      db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(cust.is_active, cust.user_id);
    }
  })();
  res.json(db.prepare('SELECT * FROM customers WHERE id = ?').get(id));
});

// Admin Inventory
app.get('/api/admin/inventory', requireAdmin, (_req, res) => {
  const items = db
    .prepare(
      `SELECT i.*, p.name as product_name, p.gender, p.price_mad,
              (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as product_image
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       ORDER BY i.quantity ASC, p.name ASC`
    )
    .all();

  const movements = db
    .prepare(
      `SELECT im.*, p.name as product_name
       FROM inventory_movements im
       JOIN products p ON p.id = im.product_id
       ORDER BY im.created_at DESC, im.id DESC
       LIMIT 50`
    )
    .all();

  res.json({ items, movements });
});

app.patch('/api/admin/inventory/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { quantity, reason } = req.body || {};
  const existing = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Ligne de stock introuvable.' });
    return;
  }
  const newQty = Math.max(0, Number(quantity));
  const delta = newQty - existing.quantity;
  const moveType = delta > 0 ? 'in' : delta < 0 ? 'out' : 'adjustment';

  db.transaction(() => {
    db.prepare("UPDATE inventory SET quantity = ?, updated_at = datetime('now') WHERE id = ?").run(newQty, id);
    if (delta !== 0) {
      db.prepare(
        'INSERT INTO inventory_movements (product_id, size, color_name, type, quantity_delta, reason) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(existing.product_id, existing.size, existing.color_name, moveType, delta, String(reason || 'Ajustement manuel administrateur'));
    }
  })();

  res.json(db.prepare('SELECT * FROM inventory WHERE id = ?').get(id));
});

// Admin Promotions
app.get('/api/admin/promotions', requireAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT pr.*, p.name as product_name
       FROM promotions pr
       LEFT JOIN products p ON p.id = pr.product_id
       ORDER BY pr.id DESC`
    )
    .all();
  res.json(rows);
});

app.post('/api/admin/promotions', requireAdmin, (req, res) => {
  const { title, description, product_id, discount_percent, promo_price_mad, start_date, end_date, is_active } = req.body || {};
  if (!title || !start_date || !end_date) {
    res.status(400).json({ error: 'Titre et dates de promotion requis.' });
    return;
  }

  const promoId = db.transaction(() => {
    const r = db
      .prepare(
        'INSERT INTO promotions (title, description, product_id, discount_percent, promo_price_mad, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        String(title).trim(),
        String(description || '').trim(),
        product_id ? Number(product_id) : null,
        Number(discount_percent || 0),
        promo_price_mad ? Number(promo_price_mad) : null,
        String(start_date),
        String(end_date),
        is_active === 0 ? 0 : 1
      );

    if (product_id && is_active !== 0) {
      const prod = db.prepare('SELECT price_mad, old_price_mad FROM products WHERE id = ?').get(Number(product_id)) as any;
      if (prod) {
        const origPrice = prod.old_price_mad || prod.price_mad;
        const nextPrice = promo_price_mad
          ? Number(promo_price_mad)
          : Math.round(origPrice * (1 - Number(discount_percent || 0) / 100));
        db.prepare('UPDATE products SET old_price_mad = ?, price_mad = ?, is_promo = 1 WHERE id = ?').run(
          origPrice,
          nextPrice,
          Number(product_id)
        );
      }
    }

    return Number(r.lastInsertRowid);
  })();

  res.status(201).json(db.prepare('SELECT * FROM promotions WHERE id = ?').get(promoId));
});

app.put('/api/admin/promotions/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { title, description, product_id, discount_percent, promo_price_mad, start_date, end_date, is_active } = req.body || {};
  db.transaction(() => {
    db.prepare(
      'UPDATE promotions SET title = ?, description = ?, product_id = ?, discount_percent = ?, promo_price_mad = ?, start_date = ?, end_date = ?, is_active = ? WHERE id = ?'
    ).run(
      String(title).trim(),
      String(description || '').trim(),
      product_id ? Number(product_id) : null,
      Number(discount_percent || 0),
      promo_price_mad ? Number(promo_price_mad) : null,
      String(start_date),
      String(end_date),
      is_active === 0 ? 0 : 1,
      id
    );

    if (product_id) {
      const prod = db.prepare('SELECT price_mad, old_price_mad FROM products WHERE id = ?').get(Number(product_id)) as any;
      if (prod) {
        if (is_active) {
          const origPrice = prod.old_price_mad || prod.price_mad;
          const nextPrice = promo_price_mad
            ? Number(promo_price_mad)
            : Math.round(origPrice * (1 - Number(discount_percent || 0) / 100));
          db.prepare('UPDATE products SET old_price_mad = ?, price_mad = ?, is_promo = 1 WHERE id = ?').run(
            origPrice,
            nextPrice,
            Number(product_id)
          );
        } else if (prod.old_price_mad) {
          db.prepare('UPDATE products SET price_mad = ?, old_price_mad = NULL, is_promo = 0 WHERE id = ?').run(
            prod.old_price_mad,
            Number(product_id)
          );
        }
      }
    }
  })();

  res.json(db.prepare('SELECT * FROM promotions WHERE id = ?').get(id));
});

app.delete('/api/admin/promotions/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const promo = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id) as any;
  db.transaction(() => {
    if (promo?.product_id) {
      const prod = db.prepare('SELECT old_price_mad FROM products WHERE id = ?').get(promo.product_id) as any;
      if (prod?.old_price_mad) {
        db.prepare('UPDATE products SET price_mad = ?, old_price_mad = NULL, is_promo = 0 WHERE id = ?').run(
          prod.old_price_mad,
          promo.product_id
        );
      }
    }
    db.prepare('DELETE FROM promotions WHERE id = ?').run(id);
  })();
  res.json({ ok: true });
});

// Admin Settings
app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const payload = req.body || {};
  const upsert = db.prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')");
  db.transaction(() => {
    for (const [k, v] of Object.entries(payload)) {
      upsert.run(k, String(v ?? ''));
    }
  })();
  res.json(getSettingsMap());
});

// ==================== VITE / STATIC SERVING ====================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CASA STYLE server running at http://localhost:${PORT}`);
  });
}

if (!isServerless) {
  startServer();
}

export default app;
