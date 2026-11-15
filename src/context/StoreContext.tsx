import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { AuthUser, CartItem, Product, SiteSettings } from '../types';

interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface StoreContextValue {
  settings: SiteSettings;
  refreshSettings: () => Promise<void>;
  user: AuthUser | null;
  authLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  addToCart: (product: Product, size: string, colorName: string, colorHex: string, quantity: number) => void;
  updateCartQuantity: (productId: number, size: string, colorName: string, quantity: number) => void;
  removeFromCart: (productId: number, size: string, colorName: string) => void;
  clearCart: () => void;
  favoriteIds: number[];
  toggleFavorite: (productId: number) => Promise<void>;
  notify: (text: string, type?: 'success' | 'error' | 'info') => void;
  calculateShipping: (city: string, subtotal: number) => number;
}

const DEFAULT_SETTINGS: SiteSettings = {
  store_name: 'CASA STYLE',
  slogan: 'Votre style, votre identité.',
  logo_text: 'CASA STYLE',
  address: '24 Boulevard Massira Al Khadra, Triangle d’Or, Casablanca 20100, Maroc',
  phone: '+212 522 98 44 10',
  email: 'bonjour@casastyle.ma',
  shipping_casablanca_mad: '30',
  shipping_other_mad: '45',
  free_shipping_threshold_mad: '1200',
  instagram_url: 'https://instagram.com/casastyle.ma',
  facebook_url: 'https://facebook.com/casastyle.ma',
  tiktok_url: 'https://tiktok.com/@casastyle.ma',
  footer_text: 'Maison de prêt-à-porter contemporain née à Casablanca.',
};

const CART_STORAGE_KEY = 'casa_style_cart_v1';
const LOCAL_FAV_KEY = 'casa_style_favs_v1';

const StoreContext = createContext<StoreContextValue | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_FAV_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await apiFetch<SiteSettings>('/api/settings');
      setSettings((prev) => ({ ...prev, ...data }));
    } catch {
      // keep defaults
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setAuthLoading(true);
    try {
      const data = await apiFetch<{ user: AuthUser | null }>('/api/auth/me');
      setUser(data.user);
      if (data.user && data.user.role === 'customer') {
        const favs = await apiFetch<Product[]>('/api/account/favorites').catch(() => []);
        setFavoriteIds(favs.map((f) => f.id));
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
    refreshUser();
  }, [refreshSettings, refreshUser]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage failure
    }
  }, [cart]);

  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem(LOCAL_FAV_KEY, JSON.stringify(favoriteIds));
      } catch {
        // ignore
      }
    }
  }, [favoriteIds, user]);

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    notify('Vous êtes déconnecté(e).', 'info');
  }, [notify]);

  const addToCart = useCallback(
    (product: Product, size: string, colorName: string, colorHex: string, quantity: number) => {
      const inv = product.inventory?.find((i) => i.size === size && i.color_name === colorName);
      const maxStock = inv ? inv.quantity : product.total_stock;
      if (maxStock <= 0) {
        notify('Ce modèle est actuellement en rupture de stock.', 'error');
        return;
      }

      const primaryImg = product.images?.[0]?.image_url || '';
      setCart((prev) => {
        const idx = prev.findIndex(
          (item) => item.productId === product.id && item.size === size && item.color_name === colorName
        );
        if (idx > -1) {
          const updated = [...prev];
          const nextQty = Math.min(maxStock, updated[idx].quantity + quantity);
          updated[idx] = { ...updated[idx], quantity: nextQty, max_stock: maxStock, price_mad: product.price_mad };
          return updated;
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            image: primaryImg,
            price_mad: product.price_mad,
            old_price_mad: product.old_price_mad,
            size,
            color_name: colorName,
            color_hex: colorHex,
            quantity: Math.min(maxStock, quantity),
            max_stock: maxStock,
          },
        ];
      });

      notify(`${product.name} ajouté au panier.`);
      setIsCartOpen(true);
    },
    [notify]
  );

  const updateCartQuantity = useCallback((productId: number, size: string, colorName: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) =>
        prev.filter((i) => !(i.productId === productId && i.size === size && i.color_name === colorName))
      );
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId && i.size === size && i.color_name === colorName
          ? { ...i, quantity: Math.min(i.max_stock || 99, quantity) }
          : i
      )
    );
  }, []);

  const removeFromCart = useCallback(
    (productId: number, size: string, colorName: string) => {
      setCart((prev) =>
        prev.filter((i) => !(i.productId === productId && i.size === size && i.color_name === colorName))
      );
      notify('Article retiré du panier.', 'info');
    },
    [notify]
  );

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleFavorite = useCallback(
    async (productId: number) => {
      if (user) {
        try {
          const res = await apiFetch<{ favorited: boolean }>(`/api/account/favorites/${productId}`, {
            method: 'POST',
          });
          setFavoriteIds((prev) =>
            res.favorited ? Array.from(new Set([...prev, productId])) : prev.filter((id) => id !== productId)
          );
          notify(res.favorited ? 'Ajouté à vos favoris.' : 'Retiré de vos favoris.', 'info');
        } catch (err: any) {
          notify(err.message || 'Erreur favoris', 'error');
        }
      } else {
        setFavoriteIds((prev) => {
          const exists = prev.includes(productId);
          notify(exists ? 'Retiré de vos favoris.' : 'Ajouté à vos favoris.', 'info');
          return exists ? prev.filter((id) => id !== productId) : [...prev, productId];
        });
      }
    },
    [user, notify]
  );

  const calculateShipping = useCallback(
    (city: string, subtotal: number) => {
      const freeThreshold = Number(settings.free_shipping_threshold_mad || 1200);
      if (subtotal === 0 || subtotal >= freeThreshold) return 0;
      const casaFee = Number(settings.shipping_casablanca_mad || 30);
      const otherFee = Number(settings.shipping_other_mad || 45);
      return city.toLowerCase() === 'casablanca' ? casaFee : otherFee;
    },
    [settings]
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price_mad * item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        settings,
        refreshSettings,
        user,
        authLoading,
        refreshUser,
        logout,
        cart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        isSearchOpen,
        setIsSearchOpen,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        favoriteIds,
        toggleFavorite,
        notify,
        calculateShipping,
      }}
    >
      {children}

      {/* Global Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0 no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto px-4 py-3 text-sm border shadow-lg transition-all duration-200 flex items-center justify-between gap-3 ${
              t.type === 'error'
                ? 'bg-[#111111] text-white border-red-500'
                : t.type === 'info'
                ? 'bg-white text-[#111111] border-[#111111]/15'
                : 'bg-[#111111] text-white border-[#B89B72]'
            }`}
          >
            <span>{t.text}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-xs opacity-70 hover:opacity-100 shrink-0"
              aria-label="Fermer la notification"
            >
              Fermer
            </button>
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
