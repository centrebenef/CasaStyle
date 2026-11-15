import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { apiFetch, formatMad } from '../lib/api';
import type { Product } from '../types';
import { SafeImage } from './SafeImage';

export const Navbar: React.FC = () => {
  const { settings, user, cartCount, setIsCartOpen, isSearchOpen, setIsSearchOpen } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPromoBar, setShowPromoBar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMobileOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname, location.search, setIsSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiFetch<Product[]>(`/api/products?search=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(res.slice(0, 5));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [searchQuery, isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    navigate(`/boutique?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const navLinks = [
    { label: 'Accueil', to: '/' },
    { label: 'Femme', to: '/femme' },
    { label: 'Homme', to: '/homme' },
    { label: 'Nouveautés', to: '/nouveautes' },
    { label: 'Promotions', to: '/promotions' },
    { label: 'Contact', to: '/contact' },
  ];

  const threshold = Number(settings.free_shipping_threshold_mad || 1200).toLocaleString('fr-MA');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#111111]/10 no-print">
      {showPromoBar && (
        <div className="bg-[#111111] text-white text-xs py-1.5 px-4 flex items-center justify-center relative">
          <p className="truncate text-center tracking-wide">
            Livraison offerte dès {threshold} DH · Paiement à la livraison partout au Maroc
          </p>
          <button
            onClick={() => setShowPromoBar(false)}
            className="absolute right-3 text-white/70 hover:text-white p-1"
            aria-label="Masquer la bannière"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Mobile menu trigger + Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 text-[#111111] hover:text-[#B89B72] transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link
            to="/"
            className="font-editorial text-2xl sm:text-[26px] font-semibold tracking-[0.14em] text-[#111111] whitespace-nowrap shrink-0"
          >
            {settings.logo_text || 'CASA STYLE'}
          </Link>
        </div>

        {/* Center Navigation */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#111111]/80" aria-label="Navigation principale">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors hover:text-[#111111] ${
                  active ? 'text-[#111111] font-semibold' : ''
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute left-0 right-0 bottom-0 h-[1.5px] bg-[#B89B72]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 text-[#111111] hover:text-[#B89B72] transition-colors"
            aria-label="Rechercher un article"
          >
            <Search className="w-5 h-5" />
          </button>

          <Link
            to={user?.role === 'admin' ? '/admin' : '/compte'}
            className="p-2 text-[#111111] hover:text-[#B89B72] transition-colors flex items-center gap-1.5"
            aria-label="Mon compte"
          >
            <User className="w-5 h-5" />
            {user && (
              <span className="hidden xl:inline text-xs font-medium max-w-[100px] truncate">
                {user.full_name.split(' ')[0]}
              </span>
            )}
          </Link>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-[#111111] hover:text-[#B89B72] transition-colors flex items-center gap-1.5"
            aria-label="Ouvrir le panier"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="tabular-nums text-xs font-semibold min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[#111111] text-white rounded-full">
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="border-t border-[#111111]/10 bg-white shadow-lg"
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
                <Search className="w-5 h-5 text-[#111111]/50 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une robe, un blazer, du lin, un accessoire..."
                  className="w-full py-2 text-base bg-transparent border-b border-[#111111]/20 focus:border-[#111111] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-[#111111] text-white hover:bg-[#B89B72] transition-colors whitespace-nowrap shrink-0"
                >
                  Rechercher
                </button>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 text-[#111111]/60 hover:text-[#111111]"
                  aria-label="Fermer la recherche"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>

              {searching && (
                <p className="text-xs text-[#111111]/60 mt-3">Recherche en cours...</p>
              )}

              {!searching && searchResults.length > 0 && (
                <div className="mt-4 divide-y divide-[#111111]/10">
                  {searchResults.map((p) => (
                    <Link
                      key={p.id}
                      to={`/produit/${p.slug}`}
                      className="flex items-center justify-between py-2.5 hover:bg-[#F5F5F5] px-2 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <SafeImage
                          src={p.images?.[0]?.image_url}
                          alt={p.name}
                          className="w-10 h-12 object-cover bg-[#F5F5F5] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#111111] truncate">{p.name}</p>
                          <p className="text-xs text-[#111111]/60">{p.category_name}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-[#111111] shrink-0 ml-4">
                        {formatMad(p.price_mad)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                <p className="text-sm text-[#111111]/60 mt-4">
                  Aucun modèle ne correspond à « {searchQuery} ».
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="relative w-80 max-w-[85vw] bg-white h-full flex flex-col justify-between p-6 shadow-2xl z-10"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-[#111111]/10">
                  <span className="font-editorial text-2xl font-semibold tracking-[0.14em]">
                    {settings.logo_text || 'CASA STYLE'}
                  </span>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-2 text-[#111111]"
                    aria-label="Fermer le menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="mt-6 flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="py-3 px-2 text-base font-medium text-[#111111] border-b border-[#111111]/5 hover:text-[#B89B72] transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    to="/boutique"
                    className="py-3 px-2 text-base font-medium text-[#111111] border-b border-[#111111]/5 hover:text-[#B89B72] transition-colors"
                  >
                    Toute la boutique
                  </Link>
                  <Link
                    to="/compte"
                    className="py-3 px-2 text-base font-medium text-[#111111] border-b border-[#111111]/5 hover:text-[#B89B72] transition-colors"
                  >
                    Espace client
                  </Link>
                </nav>
              </div>

              <div className="pt-6 border-t border-[#111111]/10 text-xs text-[#111111]/60 space-y-1">
                <p className="font-medium text-[#111111]">{settings.slogan}</p>
                <p>{settings.phone}</p>
                <p>Casablanca, Maroc</p>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};
