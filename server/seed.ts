import { db, hashPassword } from './db.ts';

const IMG = {
  hero: '/src/assets/images/hero_casa_style_1794761387075.jpg',
  robeChampagne: '/src/assets/images/femme_robe_champagne_1794761387519.jpg',
  blazerNoir: '/src/assets/images/femme_blazer_noir_1794761388257.jpg',
  trenchSable: '/src/assets/images/femme_trench_sable_1794761388147.jpg',
  blouseIvoire: '/src/assets/images/femme_blouse_ivoire_1794761389116.jpg',
  mailleCamel: '/src/assets/images/femme_ensemble_maille_1794761389170.jpg',
  costumeNoir: '/src/assets/images/homme_costume_noir_1794761389543.jpg',
  chemiseLin: '/src/assets/images/homme_chemise_lin_1794761390356.jpg',
  pullCamel: '/src/assets/images/homme_pull_camel_1794761390779.jpg',
  accessoires: '/src/assets/images/accessoires_atelier_1794761391155.jpg',
};

export function seedDatabase(): void {
  const existingUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (existingUsers.cnt > 0) {
    ensureCommunitySeeded();
    return;
  }

  const runSeed = db.transaction(() => {
    // 1. Settings
    const defaultSettings: Array<[string, string]> = [
      ['store_name', 'CASA STYLE'],
      ['slogan', 'Votre style, votre identité.'],
      ['logo_text', 'CASA STYLE'],
      ['address', '24 Boulevard Massira Al Khadra, Triangle d’Or, Casablanca 20100, Maroc'],
      ['phone', '+212 522 98 44 10'],
      ['email', 'bonjour@casastyle.ma'],
      ['shipping_casablanca_mad', '30'],
      ['shipping_other_mad', '45'],
      ['free_shipping_threshold_mad', '1200'],
      ['instagram_url', 'https://instagram.com/casastyle.ma'],
      ['facebook_url', 'https://facebook.com/casastyle.ma'],
      ['tiktok_url', 'https://tiktok.com/@casastyle.ma'],
      ['footer_text', 'Maison de prêt-à-porter contemporain née à Casablanca. Coupes architecturales, étoffes nobles et allure intemporelle.'],
    ];
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of defaultSettings) {
      insertSetting.run(k, v);
    }

    // 2. Users (Admin + Demo Customer)
    const insertUser = db.prepare(
      'INSERT INTO users (username, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?)'
    );
    insertUser.run('admin', 'admin@casastyle.ma', hashPassword('123456789'), 'admin', 'Administrateur CASA STYLE');
    const demoUserRes = insertUser.run(
      'sara.bennani',
      'sara.bennani@casastyle.ma',
      hashPassword('Client2026!'),
      'customer',
      'Sara Bennani'
    );

    // 3. Categories (16 categories: 8 Femme + 8 Homme)
    const categoriesData = [
      // Femme
      { name: 'Robes', slug: 'femme-robes', gender: 'femme', desc: 'Silhouettes fluides en soie, crêpe et satin pour le jour et le soir.', img: IMG.robeChampagne, sort: 1 },
      { name: 'Chemises et Blouses', slug: 'femme-chemises-blouses', gender: 'femme', desc: 'Popeline croquante et blouses plissées aux finitions couture.', img: IMG.blouseIvoire, sort: 2 },
      { name: 'Pantalons', slug: 'femme-pantalons', gender: 'femme', desc: 'Coupes larges taille haute et tailleurs structurés.', img: IMG.blazerNoir, sort: 3 },
      { name: 'Jeans', slug: 'femme-jeans', gender: 'femme', desc: 'Denim brut japonais et coupes droites intemporelles.', img: IMG.trenchSable, sort: 4 },
      { name: 'Jupes', slug: 'femme-jupes', gender: 'femme', desc: 'Jupes midi évasées et coupes crayon architecturales.', img: IMG.blouseIvoire, sort: 5 },
      { name: 'Vestes et Manteaux', slug: 'femme-vestes-manteaux', gender: 'femme', desc: 'Blazers croisés, trenchs gabardine et manteaux en laine.', img: IMG.trenchSable, sort: 6 },
      { name: 'T-shirts', slug: 'femme-t-shirts', gender: 'femme', desc: 'Essentiels en coton Pima peigné et jersey lourd.', img: IMG.mailleCamel, sort: 7 },
      { name: 'Accessoires', slug: 'femme-accessoires', gender: 'femme', desc: 'Maroquinerie en cuir pleine fleur, foulards cachemire et solaires.', img: IMG.accessoires, sort: 8 },
      // Homme
      { name: 'T-shirts et Polos', slug: 'homme-t-shirts-polos', gender: 'homme', desc: 'Polos en maille fine et t-shirts structurés haute densité.', img: IMG.pullCamel, sort: 9 },
      { name: 'Chemises', slug: 'homme-chemises', gender: 'homme', desc: 'Lin méditerranéen et popeline italienne respirante.', img: IMG.chemiseLin, sort: 10 },
      { name: 'Pantalons', slug: 'homme-pantalons', gender: 'homme', desc: 'Chinos taillés et pantalons à pinces en laine froide.', img: IMG.chemiseLin, sort: 11 },
      { name: 'Jeans', slug: 'homme-jeans', gender: 'homme', desc: 'Denim selvedge teinture indigo et coupes ajustées.', img: IMG.costumeNoir, sort: 12 },
      { name: 'Vestes', slug: 'homme-vestes', gender: 'homme', desc: 'Blazers déstructurés, surchemises et vestes de ville.', img: IMG.costumeNoir, sort: 13 },
      { name: 'Sweats et Pulls', slug: 'homme-sweats-pulls', gender: 'homme', desc: 'Mailles mérinos extra-fines et pulls cols roulés.', img: IMG.pullCamel, sort: 14 },
      { name: 'Shorts', slug: 'homme-shorts', gender: 'homme', desc: 'Shorts tailleur en lin et coton sergé pour la belle saison.', img: IMG.chemiseLin, sort: 15 },
      { name: 'Accessoires Homme', slug: 'homme-accessoires', gender: 'homme', desc: 'Ceintures en cuir grainé, petite maroquinerie et solaires.', img: IMG.accessoires, sort: 16 },
    ];

    const catMap: Record<string, number> = {};
    const insertCat = db.prepare(
      'INSERT INTO categories (name, slug, gender, description, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const c of categoriesData) {
      const res = insertCat.run(c.name, c.slug, c.gender, c.desc, c.img, c.sort);
      catMap[c.slug] = Number(res.lastInsertRowid);
    }

    // 4. Products (12 Femme + 12 Homme = 24 Demo Products)
    interface SeedProduct {
      catSlug: string;
      name: string;
      slug: string;
      gender: 'femme' | 'homme';
      desc: string;
      price: number;
      oldPrice: number | null;
      isNew: number;
      isBest: number;
      isPromo: number;
      images: string[];
      sizes: string[];
      colors: Array<[string, string]>;
      stockPerVariant: number;
    }

    const productsData: SeedProduct[] = [
      // === 12 FEMME ===
      {
        catSlug: 'femme-robes',
        name: 'Robe Midi Soie Champagne Anfa',
        slug: 'robe-midi-soie-champagne-anfa',
        gender: 'femme',
        desc: 'Robe midi coupée en biais dans une soie satinée fluide au tombé nacré. Encolure drapée délicate et finitions invisibles confectionnées pour les soirées casablancaises.',
        price: 1490,
        oldPrice: 1850,
        isNew: 1,
        isBest: 1,
        isPromo: 1,
        images: [IMG.robeChampagne, IMG.blouseIvoire],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: [['Champagne', '#E5D3B3'], ['Noir Obsidienne', '#111111']],
        stockPerVariant: 8,
      },
      {
        catSlug: 'femme-vestes-manteaux',
        name: 'Blazer Croisé Laine Vierge Massira',
        slug: 'blazer-croise-laine-vierge-massira',
        gender: 'femme',
        desc: 'Blazer structuré à double boutonnage en laine vierge légère. Épaules nettes, revers en pointe et doublure en viscose respirante.',
        price: 1890,
        oldPrice: null,
        isNew: 1,
        isBest: 1,
        isPromo: 0,
        images: [IMG.blazerNoir, IMG.hero],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        colors: [['Noir', '#111111'], ['Ivoire', '#F5F2EB']],
        stockPerVariant: 10,
      },
      {
        catSlug: 'femme-vestes-manteaux',
        name: 'Trench-Coat Gabardine Corniche',
        slug: 'trench-coat-gabardine-corniche',
        gender: 'femme',
        desc: 'Trench intemporel en gabardine de coton déperlante tissée serrée. Ceinture à boucle travaillée, bavolets structurés et coupe fluide.',
        price: 2190,
        oldPrice: 2590,
        isNew: 0,
        isBest: 1,
        isPromo: 1,
        images: [IMG.trenchSable, IMG.mailleCamel],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: [['Sable', '#D5C3A5'], ['Noir', '#111111']],
        stockPerVariant: 6,
      },
      {
        catSlug: 'femme-chemises-blouses',
        name: 'Blouse Plissée Satin Gauthier',
        slug: 'blouse-plissee-satin-gauthier',
        gender: 'femme',
        desc: 'Blouse à plis soleil permanents en satin mat, col officier épuré et manchettes boutonnées. Une pièce maîtresse du vestiaire urbain.',
        price: 790,
        oldPrice: null,
        isNew: 1,
        isBest: 0,
        isPromo: 0,
        images: [IMG.blouseIvoire, IMG.robeChampagne],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: [['Ivoire', '#F6F3EC'], ['Champagne', '#DFC9A6']],
        stockPerVariant: 12,
      },
      {
        catSlug: 'femme-pantalons',
        name: 'Pantalon Tailleur Large Dar El Beida',
        slug: 'pantalon-tailleur-large-dar-el-beida',
        gender: 'femme',
        desc: 'Pantalon fluide à taille haute soulignée de doubles pinces avant. Allonge la silhouette avec élégance du bureau au dîner.',
        price: 890,
        oldPrice: null,
        isNew: 0,
        isBest: 1,
        isPromo: 0,
        images: [IMG.blazerNoir, IMG.mailleCamel],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: [['Crème', '#EFEAE0'], ['Noir', '#111111']],
        stockPerVariant: 9,
      },
      {
        catSlug: 'femme-jeans',
        name: 'Jean Droit Indigo Brut Racine',
        slug: 'jean-droit-indigo-brut-racine',
        gender: 'femme',
        desc: 'Denim 13 oz en coton biologique sans délavage excessif. Taille haute confortable, jambe droite nette et surpiqûres ton sur ton.',
        price: 750,
        oldPrice: 890,
        isNew: 0,
        isBest: 0,
        isPromo: 1,
        images: [IMG.trenchSable, IMG.blazerNoir],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: [['Indigo Brut', '#1F2D46'], ['Noir Délavé', '#2A2A2D']],
        stockPerVariant: 7,
      },
      {
        catSlug: 'femme-jupes',
        name: 'Jupe Midi Trapèze Crêpe Ciel',
        slug: 'jupe-midi-trapeze-crepe-ciel',
        gender: 'femme',
        desc: 'Jupe longueur midi taille haute en crêpe lourd au mouvement souple. Fermeture zippée invisible au dos.',
        price: 690,
        oldPrice: null,
        isNew: 1,
        isBest: 0,
        isPromo: 0,
        images: [IMG.blouseIvoire, IMG.robeChampagne],
        sizes: ['XS', 'S', 'M', 'L'],
        colors: [['Noir', '#111111'], ['Beige Pierre', '#D8CFC2']],
        stockPerVariant: 2, // Intentionally low stock for admin alerts!
      },
      {
        catSlug: 'femme-t-shirts',
        name: 'T-Shirt Coton Pima Col Rond Essaouira',
        slug: 't-shirt-coton-pima-essaouira',
        gender: 'femme',
        desc: 'Jersey lourd 220g en coton Pima peigné à toucher soyeux. Coupe droite nette pensée pour être portée seule ou sous un blazer.',
        price: 340,
        oldPrice: null,
        isNew: 0,
        isBest: 1,
        isPromo: 0,
        images: [IMG.mailleCamel, IMG.blouseIvoire],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        colors: [['Écru', '#F4EFE6'], ['Noir', '#111111'], ['Camel', '#B68F62']],
        stockPerVariant: 15,
      },
      {
        catSlug: 'femme-accessoires',
        name: 'Sac Structuré Cuir Grainé Atlas',
        slug: 'sac-structure-cuir-graine-atlas',
        gender: 'femme',
        desc: 'Sac à main trapèze en cuir de veau grainé pleine fleur, fermoir architectural en laiton doré brossé et bandoulière amovible.',
        price: 1650,
        oldPrice: null,
        isNew: 1,
        isBest: 1,
        isPromo: 0,
        images: [IMG.accessoires, IMG.blazerNoir],
        sizes: ['M'],
        colors: [['Noir', '#111111'], ['Cognac', '#7A4928']],
        stockPerVariant: 5,
      },
      {
        catSlug: 'femme-pantalons',
        name: 'Ensemble Maille Mérinos Casablanca',
        slug: 'ensemble-maille-merinos-casablanca',
        gender: 'femme',
        desc: 'Cardigan long et pantalon fluide coordonnés en pure laine mérinos extra-fine. Douceur incomparable et ligne minimaliste.',
        price: 1390,
        oldPrice: 1690,
        isNew: 1,
        isBest: 0,
        isPromo: 1,
        images: [IMG.mailleCamel, IMG.trenchSable],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: [['Camel', '#C09A6B'], ['Gris Perle', '#D6D4CF']],
        stockPerVariant: 8,
      },
      {
        catSlug: 'femme-chemises-blouses',
        name: 'Chemise Popeline Croquante Habous',
        slug: 'chemise-popeline-croquante-habous',
        gender: 'femme',
        desc: 'Chemise coupe légèrement oversize en popeline de coton égyptien. Boutons en nacre véritable et poignets allongés.',
        price: 650,
        oldPrice: null,
        isNew: 0,
        isBest: 0,
        isPromo: 0,
        images: [IMG.trenchSable, IMG.blouseIvoire],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: [['Blanc Optique', '#FFFFFF'], ['Bleu Ciel', '#C9D8E6']],
        stockPerVariant: 11,
      },
      {
        catSlug: 'femme-robes',
        name: 'Robe Blazer Structurée Palmier',
        slug: 'robe-blazer-structuree-palmier',
        gender: 'femme',
        desc: 'Robe tailleur mi-longue inspirée du smoking féminin, taille cintrée et boutons recouverts ton sur ton.',
        price: 1590,
        oldPrice: null,
        isNew: 0,
        isBest: 0,
        isPromo: 0,
        images: [IMG.hero, IMG.blazerNoir],
        sizes: ['XS', 'S', 'M', 'L'],
        colors: [['Ivoire', '#F5F2EB'], ['Noir', '#111111']],
        stockPerVariant: 0, // Intentionally out of stock for admin rupture alert!
      },

      // === 12 HOMME ===
      {
        catSlug: 'homme-vestes',
        name: 'Blazer Lin & Laine Obsidienne',
        slug: 'blazer-lin-laine-obsidienne',
        gender: 'homme',
        desc: 'Veste deux boutons semi-entoilée en mélange laine froide et lin respirant, idéale pour le climat tempéré de Casablanca.',
        price: 1950,
        oldPrice: null,
        isNew: 1,
        isBest: 1,
        isPromo: 0,
        images: [IMG.costumeNoir, IMG.hero],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [['Noir Obsidienne', '#111111'], ['Marine Nuit', '#1B2436']],
        stockPerVariant: 9,
      },
      {
        catSlug: 'homme-chemises',
        name: 'Chemise Lin Méditerranéen Sable',
        slug: 'chemise-lin-mediterraneen-sable',
        gender: 'homme',
        desc: 'Chemise en pur lin lavé européen à col boutonné souple. Respirabilité naturelle et allure décontractée maîtrisée.',
        price: 680,
        oldPrice: 820,
        isNew: 1,
        isBest: 1,
        isPromo: 1,
        images: [IMG.chemiseLin, IMG.pullCamel],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [['Sable', '#DFD3BE'], ['Blanc Craie', '#F7F5F0']],
        stockPerVariant: 14,
      },
      {
        catSlug: 'homme-t-shirts-polos',
        name: 'Polo Maille Fine Mérinos Camel',
        slug: 'polo-maille-fine-merinos-camel',
        gender: 'homme',
        desc: 'Polo manches longues tricoté en jauge fine 16GG. Col structuré sans boutons apparents et bords-côtes resserrés.',
        price: 890,
        oldPrice: null,
        isNew: 1,
        isBest: 1,
        isPromo: 0,
        images: [IMG.pullCamel, IMG.chemiseLin],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [['Camel', '#BA9163'], ['Anthracite', '#2E3136']],
        stockPerVariant: 10,
      },
      {
        catSlug: 'homme-pantalons',
        name: 'Pantalon Chino Ajusté Pierre',
        slug: 'pantalon-chino-ajuste-pierre',
        gender: 'homme',
        desc: 'Chino en sergé de coton élasthanne brossé, pattes de serrage latérales façon tailleur et coupe fuselée nette.',
        price: 720,
        oldPrice: null,
        isNew: 0,
        isBest: 1,
        isPromo: 0,
        images: [IMG.chemiseLin, IMG.pullCamel],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [['Gris Pierre', '#8D8E8A'], ['Beige', '#D9CCB8'], ['Noir', '#111111']],
        stockPerVariant: 11,
      },
      {
        catSlug: 'homme-vestes',
        name: 'Costume Croisé Anfa Laine Froide',
        slug: 'costume-croise-anfa-laine-froide',
        gender: 'homme',
        desc: 'Ensemble veste et pantalon à pinces taillé dans un drap de laine Super 120s. Tombé irréprochable pour vos rendez-vous.',
        price: 3290,
        oldPrice: 3890,
        isNew: 0,
        isBest: 1,
        isPromo: 1,
        images: [IMG.hero, IMG.costumeNoir],
        sizes: ['M', 'L', 'XL', 'XXL'],
        colors: [['Noir', '#111111'], ['Bleu Nuit', '#1B2333']],
        stockPerVariant: 4,
      },
      {
        catSlug: 'homme-jeans',
        name: 'Jean Selvedge Brut Beldi',
        slug: 'jean-selvedge-brut-beldi',
        gender: 'homme',
        desc: 'Denim selvedge 14 oz tissé sur métier ancien. Coupe droite contemporaine et finitions rivets cuivre brossé.',
        price: 850,
        oldPrice: null,
        isNew: 0,
        isBest: 0,
        isPromo: 0,
        images: [IMG.costumeNoir, IMG.chemiseLin],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [['Indigo Brut', '#1B253B'], ['Noir', '#151517']],
        stockPerVariant: 8,
      },
      {
        catSlug: 'homme-sweats-pulls',
        name: 'Pull Col Roulé Mérinos Zellige',
        slug: 'pull-col-roule-merinos-zellige',
        gender: 'homme',
        desc: 'Tricot en laine mérinos extrafine anti-boulochage, idéal sous un blazer ou porté seul en soirée fraîche.',
        price: 780,
        oldPrice: 950,
        isNew: 1,
        isBest: 0,
        isPromo: 1,
        images: [IMG.hero, IMG.pullCamel],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: [['Noir', '#111111'], ['Camel', '#BA9163']],
        stockPerVariant: 7,
      },
      {
        catSlug: 'homme-t-shirts-polos',
        name: 'T-Shirt Coton Supima Lourd Maarif',
        slug: 't-shirt-coton-supima-maarif',
        gender: 'homme',
        desc: 'T-shirt essentiel 240g en coton Supima, col rond indéformable et coutures épaules renforcées.',
        price: 360,
        oldPrice: null,
        isNew: 0,
        isBest: 1,
        isPromo: 0,
        images: [IMG.costumeNoir, IMG.chemiseLin],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        colors: [['Blanc Optique', '#FFFFFF'], ['Noir', '#111111'], ['Sable', '#DDD0BC']],
        stockPerVariant: 18,
      },
      {
        catSlug: 'homme-pantalons',
        name: 'Pantalon Flannelle à Pinces Bourgogne',
        slug: 'pantalon-flannelle-pinces-bourgogne',
        gender: 'homme',
        desc: 'Pantalon habillé en flanelle de laine peignée avec taille ajustable et revers bas de jambe de 4 cm.',
        price: 980,
        oldPrice: null,
        isNew: 1,
        isBest: 0,
        isPromo: 0,
        images: [IMG.pullCamel, IMG.costumeNoir],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: [['Anthracite', '#2C2E33'], ['Noir', '#111111']],
        stockPerVariant: 2, // Low stock alert
      },
      {
        catSlug: 'homme-shorts',
        name: 'Short Tailleur Lin Naturel Ain Diab',
        slug: 'short-tailleur-lin-ain-diab',
        gender: 'homme',
        desc: 'Short élégant en lin et coton avec pinces discrètes, poches italiennes et longueur mi-cuisse.',
        price: 540,
        oldPrice: 640,
        isNew: 0,
        isBest: 0,
        isPromo: 1,
        images: [IMG.chemiseLin, IMG.pullCamel],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: [['Beige Sable', '#DDD1BE'], ['Marine', '#1D293F']],
        stockPerVariant: 10,
      },
      {
        catSlug: 'homme-chemises',
        name: 'Chemise Popeline Col Italien Tanger',
        slug: 'chemise-popeline-col-italien-tanger',
        gender: 'homme',
        desc: 'Chemise habillée en coton double retors infroissable, coupe cintrée contemporaine et boutons en nacre.',
        price: 720,
        oldPrice: null,
        isNew: 0,
        isBest: 0,
        isPromo: 0,
        images: [IMG.chemiseLin, IMG.hero],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [['Blanc', '#FFFFFF'], ['Bleu Glacier', '#DAE5EE']],
        stockPerVariant: 12,
      },
      {
        catSlug: 'homme-accessoires',
        name: 'Ceinture Cuir Pleine Fleur Boucle Dorée',
        slug: 'ceinture-cuir-boucle-doree',
        gender: 'homme',
        desc: 'Ceinture artisanale en cuir de veau lisse brun foncé avec boucle ovale en laiton doré brossé et coffret inclus.',
        price: 590,
        oldPrice: null,
        isNew: 1,
        isBest: 1,
        isPromo: 0,
        images: [IMG.accessoires, IMG.pullCamel],
        sizes: ['M', 'L', 'XL'],
        colors: [['Marron Chocolat', '#3B2820'], ['Noir', '#111111']],
        stockPerVariant: 9,
      },
    ];

    const insertProduct = db.prepare(`
      INSERT INTO products (category_id, name, slug, gender, description, price_mad, old_price_mad, is_new, is_bestseller, is_promo, is_active, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    `);
    const insertImg = db.prepare('INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)');
    const insertSize = db.prepare('INSERT INTO product_sizes (product_id, size) VALUES (?, ?)');
    const insertColor = db.prepare('INSERT INTO product_colors (product_id, color_name, color_hex) VALUES (?, ?, ?)');
    const insertInv = db.prepare('INSERT INTO inventory (product_id, size, color_name, quantity, low_stock_threshold) VALUES (?, ?, ?, ?, 5)');
    const insertMove = db.prepare(
      'INSERT INTO inventory_movements (product_id, size, color_name, type, quantity_delta, reason) VALUES (?, ?, ?, ?, ?, ?)'
    );

    const seededProductIds: Record<string, number> = {};

    for (const p of productsData) {
      const res = insertProduct.run(
        catMap[p.catSlug],
        p.name,
        p.slug,
        p.gender,
        p.desc,
        p.price,
        p.oldPrice,
        p.isNew,
        p.isBest,
        p.isPromo
      );
      const pid = Number(res.lastInsertRowid);
      seededProductIds[p.slug] = pid;

      p.images.forEach((imgUrl, idx) => {
        insertImg.run(pid, imgUrl, idx, idx === 0 ? 1 : 0);
      });
      for (const s of p.sizes) {
        insertSize.run(pid, s);
      }
      for (const [cName, cHex] of p.colors) {
        insertColor.run(pid, cName, cHex);
      }
      for (const s of p.sizes) {
        for (const [cName] of p.colors) {
          insertInv.run(pid, s, cName, p.stockPerVariant);
        }
      }
      insertMove.run(pid, p.sizes[0], p.colors[0][0], 'in', p.stockPerVariant * p.sizes.length * p.colors.length, 'Stock initial collection Casablanca');
    }

    // 5. Promotions
    const insertPromo = db.prepare(
      'INSERT INTO promotions (title, description, product_id, discount_percent, promo_price_mad, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
    );
    insertPromo.run('Édition Soirée Anfa -20%', 'Remise privilège sur la robe en soie champagne.', seededProductIds['robe-midi-soie-champagne-anfa'], 20, 1490, '2026-10-01', '2026-12-31');
    insertPromo.run('Trench Signature -15%', 'Offre mi-saison sur le trench gabardine Corniche.', seededProductIds['trench-coat-gabardine-corniche'], 15, 2190, '2026-10-15', '2026-12-20');
    insertPromo.run('Semaine du Lin -17%', 'Prix doux sur la chemise lin méditerranéen.', seededProductIds['chemise-lin-mediterraneen-sable'], 17, 680, '2026-11-01', '2026-12-31');
    insertPromo.run('Tailoring Homme -15%', 'Offre sur le costume croisé Anfa en laine froide.', seededProductIds['costume-croise-anfa-laine-froide'], 15, 3290, '2026-11-01', '2026-12-31');

    // 6. Demo Customers
    const insertCust = db.prepare(
      'INSERT INTO customers (user_id, full_name, email, phone, city, address, postal_code, is_active, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)'
    );
    const saraCustId = Number(
      insertCust.run(Number(demoUserRes.lastInsertRowid), 'Sara Bennani', 'sara.bennani@casastyle.ma', '+212 661 24 88 90', 'Casablanca', '18 Rue Jean Jaurès, Gautier', '20000', 1).lastInsertRowid
    );
    const c2 = Number(insertCust.run(null, 'Youssef Tazi', 'youssef.tazi@exemple.ma', '+212 662 45 12 33', 'Rabat', '42 Avenue Fal Ould Oumeir, Agdal', '10090', 1).lastInsertRowid);
    const c3 = Number(insertCust.run(null, 'Nadia El Fassi', 'nadia.elfassi@exemple.ma', '+212 663 78 90 12', 'Marrakech', '9 Rue de la Liberté, Guéliz', '40000', 1).lastInsertRowid);
    const c4 = Number(insertCust.run(null, 'Karim Alaoui', 'karim.alaoui@exemple.ma', '+212 664 11 22 33', 'Tanger', '14 Boulevard Pasteur', '90000', 1).lastInsertRowid);
    const c5 = Number(insertCust.run(null, 'Salma Chraibi', 'salma.chraibi@exemple.ma', '+212 665 88 77 66', 'Casablanca', '55 Boulevard d’Anfa', '20250', 1).lastInsertRowid);

    // 7. Demo Orders (Clearly marked is_demo = 1)
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_number, customer_id, customer_name, customer_phone, customer_email,
        city, address, postal_code, notes, payment_method, payment_status,
        status, subtotal_mad, shipping_fee_mad, total_mad, is_demo, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_image, size, color_name, quantity, unit_price_mad, line_total_mad)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPayment = db.prepare(`
      INSERT INTO payments (order_id, method, amount_mad, status, transaction_ref, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const demoOrders = [
      {
        num: 'CS-DEMO-1001',
        custId: saraCustId,
        name: 'Sara Bennani',
        phone: '+212 661 24 88 90',
        email: 'sara.bennani@casastyle.ma',
        city: 'Casablanca',
        addr: '18 Rue Jean Jaurès, Gautier',
        zip: '20000',
        method: 'cod',
        pStatus: 'Payé à la livraison',
        status: 'Livrée',
        sub: 1490,
        ship: 0,
        tot: 1490,
        date: '2026-08-14 11:20:00',
        pid: seededProductIds['robe-midi-soie-champagne-anfa'],
        pName: 'Robe Midi Soie Champagne Anfa',
        pImg: IMG.robeChampagne,
        size: 'S',
        color: 'Champagne',
        qty: 1,
        unit: 1490,
      },
      {
        num: 'CS-DEMO-1002',
        custId: c2,
        name: 'Youssef Tazi',
        phone: '+212 662 45 12 33',
        email: 'youssef.tazi@exemple.ma',
        city: 'Rabat',
        addr: '42 Avenue Fal Ould Oumeir, Agdal',
        zip: '10090',
        method: 'cod',
        pStatus: 'Payé à la livraison',
        status: 'Livrée',
        sub: 1950,
        ship: 0,
        tot: 1950,
        date: '2026-09-04 15:45:00',
        pid: seededProductIds['blazer-lin-laine-obsidienne'],
        pName: 'Blazer Lin & Laine Obsidienne',
        pImg: IMG.costumeNoir,
        size: 'L',
        color: 'Noir Obsidienne',
        qty: 1,
        unit: 1950,
      },
      {
        num: 'CS-DEMO-1003',
        custId: c3,
        name: 'Nadia El Fassi',
        phone: '+212 663 78 90 12',
        email: 'nadia.elfassi@exemple.ma',
        city: 'Marrakech',
        addr: '9 Rue de la Liberté, Guéliz',
        zip: '40000',
        method: 'cod',
        pStatus: 'Payé à la livraison',
        status: 'Livrée',
        sub: 2190,
        ship: 0,
        tot: 2190,
        date: '2026-09-22 10:10:00',
        pid: seededProductIds['trench-coat-gabardine-corniche'],
        pName: 'Trench-Coat Gabardine Corniche',
        pImg: IMG.trenchSable,
        size: 'M',
        color: 'Sable',
        qty: 1,
        unit: 2190,
      },
      {
        num: 'CS-DEMO-1004',
        custId: c4,
        name: 'Karim Alaoui',
        phone: '+212 664 11 22 33',
        email: 'karim.alaoui@exemple.ma',
        city: 'Tanger',
        addr: '14 Boulevard Pasteur',
        zip: '90000',
        method: 'cod',
        pStatus: 'En attente',
        status: 'Expédiée',
        sub: 890,
        ship: 45,
        tot: 935,
        date: '2026-10-18 14:30:00',
        pid: seededProductIds['polo-maille-fine-merinos-camel'],
        pName: 'Polo Maille Fine Mérinos Camel',
        pImg: IMG.pullCamel,
        size: 'M',
        color: 'Camel',
        qty: 1,
        unit: 890,
      },
      {
        num: 'CS-DEMO-1005',
        custId: c5,
        name: 'Salma Chraibi',
        phone: '+212 665 88 77 66',
        email: 'salma.chraibi@exemple.ma',
        city: 'Casablanca',
        addr: '55 Boulevard d’Anfa',
        zip: '20250',
        method: 'cod',
        pStatus: 'En attente',
        status: 'En préparation',
        sub: 1650,
        ship: 0,
        tot: 1650,
        date: '2026-11-05 17:05:00',
        pid: seededProductIds['sac-structure-cuir-graine-atlas'],
        pName: 'Sac Structuré Cuir Grainé Atlas',
        pImg: IMG.accessoires,
        size: 'M',
        color: 'Noir',
        qty: 1,
        unit: 1650,
      },
      {
        num: 'CS-DEMO-1006',
        custId: saraCustId,
        name: 'Sara Bennani',
        phone: '+212 661 24 88 90',
        email: 'sara.bennani@casastyle.ma',
        city: 'Casablanca',
        addr: '18 Rue Jean Jaurès, Gautier',
        zip: '20000',
        method: 'cod',
        pStatus: 'En attente',
        status: 'En attente',
        sub: 790,
        ship: 30,
        tot: 820,
        date: '2026-11-12 09:40:00',
        pid: seededProductIds['blouse-plissee-satin-gauthier'],
        pName: 'Blouse Plissée Satin Gauthier',
        pImg: IMG.blouseIvoire,
        size: 'S',
        color: 'Ivoire',
        qty: 1,
        unit: 790,
      },
    ];

    for (const o of demoOrders) {
      const oRes = insertOrder.run(
        o.num, o.custId, o.name, o.phone, o.email, o.city, o.addr, o.zip,
        'Commande de démonstration', o.method, o.pStatus, o.status,
        o.sub, o.ship, o.tot, o.date
      );
      const oid = Number(oRes.lastInsertRowid);
      insertOrderItem.run(oid, o.pid, o.pName, o.pImg, o.size, o.color, o.qty, o.unit, o.unit * o.qty);
      insertPayment.run(oid, o.method, o.tot, o.pStatus, `TXN-${o.num}`, o.date);
    }
  });

  runSeed();
  ensureCommunitySeeded();
}

function ensureCommunitySeeded(): void {
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM community_posts').get() as { cnt: number };
  if (countRow.cnt > 0) return;

  const getProdId = db.prepare('SELECT id FROM products WHERE slug = ? LIMIT 1');
  const findId = (slug: string) => (getProdId.get(slug) as { id: number } | undefined)?.id ?? null;

  const insertPost = db.prepare(`
    INSERT INTO community_posts (customer_name, city, product_id, image_url, rating, comment, likes_count, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const posts = [
    {
      name: 'Salma Benjelloun',
      city: 'Casablanca',
      slug: 'trench-coat-gabardine-corniche',
      img: '/src/assets/images/community_casablanca_cafe_1794762573105.jpg',
      rating: 5,
      comment: 'Le trench gabardine Corniche a une coupe impeccable. La matière est légère mais structurée, parfaite pour les matinées fraîches en terrasse à Gautier. Livré le lendemain matin à Casablanca.',
      likes: 42,
    },
    {
      name: 'Kenza El Fassi',
      city: 'Marrakech',
      slug: 'robe-midi-soie-champagne-anfa',
      img: '/src/assets/images/community_marrakech_courtyard_1794762574760.jpg',
      rating: 5,
      comment: 'Tombé fluide exceptionnel ! J’ai porté la robe en soie champagne pour un dîner à Marrakech, la couleur lumineuse et les finitions sont d’un niveau maison de couture.',
      likes: 64,
    },
    {
      name: 'Amine Chraibi',
      city: 'Casablanca',
      slug: 'blazer-lin-laine-obsidienne',
      img: '/src/assets/images/community_homme_anfa_1794762573219.jpg',
      rating: 5,
      comment: 'Veste légère et respirante même en fin d’après-midi sur le boulevard d’Anfa. Les épaules tombent juste comme il faut sans être rigides.',
      likes: 37,
    },
    {
      name: 'Mehdi Berrada',
      city: 'Rabat',
      slug: 'chemise-lin-mediterraneen-sable',
      img: '/src/assets/images/community_homme_rabat_1794762573986.jpg',
      rating: 5,
      comment: 'Le lin est d’une douceur rare dès le premier port et ne froisse pas excessivement. Associée au chino pierre, c’est ma tenue préférée pour le week-end.',
      likes: 29,
    },
    {
      name: 'Ines Lazrak',
      city: 'Tanger',
      slug: 'blazer-croise-laine-vierge-massira',
      img: '/src/assets/images/femme_blazer_noir_1794761388257.jpg',
      rating: 5,
      comment: 'Très satisfaite de ma première commande sur CASA STYLE. Le blazer croisé Massira structure immédiatement la silhouette, avec un paiement à la livraison simple et fiable.',
      likes: 31,
    },
    {
      name: 'Yassine Tazi',
      city: 'Casablanca',
      slug: 'polo-maille-fine-merinos-camel',
      img: '/src/assets/images/homme_pull_camel_1794761390779.jpg',
      rating: 4,
      comment: 'Maille mérinos très fine et agréable sur la peau. La teinte camel est fidèle aux photos du site et le col garde parfaitement sa tenue.',
      likes: 24,
    },
  ];

  const tx = db.transaction(() => {
    for (const p of posts) {
      insertPost.run(p.name, p.city, findId(p.slug), p.img, p.rating, p.comment, p.likes);
    }
  });
  tx();
}

