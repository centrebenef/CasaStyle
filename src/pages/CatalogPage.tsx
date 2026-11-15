import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { Category, Product, Promotion } from '../types';
import { ProductCard } from '../components/ProductCard';

interface CatalogPageProps {
  mode: 'all' | 'femme' | 'homme' | 'nouveautes' | 'promotions';
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const CatalogPage: React.FC<CatalogPageProps> = ({ mode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(4000);
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || '');
    if (searchParams.get('sort')) setSort(searchParams.get('sort') || 'newest');
  }, [searchParams, mode]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const params = new URLSearchParams();
    if (mode === 'femme') params.set('gender', 'femme');
    if (mode === 'homme') params.set('gender', 'homme');
    if (mode === 'nouveautes') params.set('isNew', '1');
    if (mode === 'promotions') params.set('isPromo', '1');
    if (selectedCategory) params.set('category', selectedCategory);
    if (search.trim()) params.set('search', search.trim());
    if (selectedSize) params.set('size', selectedSize);
    if (selectedColor) params.set('color', selectedColor);
    if (maxPrice < 4000) params.set('maxPrice', String(maxPrice));
    params.set('sort', sort);

    const catUrl = mode === 'femme' || mode === 'homme' ? `/api/categories?gender=${mode}` : '/api/categories';

    Promise.all([
      apiFetch<Product[]>(`/api/products?${params.toString()}`),
      apiFetch<Category[]>(catUrl),
      mode === 'promotions' ? apiFetch<Promotion[]>('/api/promotions') : Promise.resolve([]),
    ])
      .then(([prods, cats, promos]) => {
        if (!active) return;
        setProducts(prods);
        setCategories(cats);
        setPromotions(promos);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [mode, selectedCategory, search, selectedSize, selectedColor, maxPrice, sort]);

  const availableColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      for (const c of p.colors || []) {
        if (!map.has(c.color_name)) map.set(c.color_name, c.color_hex);
      }
    }
    if (map.size === 0) {
      return [
        ['Noir', '#111111'],
        ['Ivoire', '#F5F2EB'],
        ['Sable', '#D5C3A5'],
        ['Camel', '#BA9163'],
      ];
    }
    return Array.from(map.entries());
  }, [products]);

  const pageHeader = useMemo(() => {
    switch (mode) {
      case 'femme':
        return {
          kicker: 'Vestiaire Féminin',
          title: 'Collection Femme',
          desc: 'Robes en soie, blazers structurés, trenchs et essentiels minimalistes pensés à Casablanca.',
        };
      case 'homme':
        return {
          kicker: 'Vestiaire Masculin',
          title: 'Collection Homme',
          desc: 'Costumes légers, chemises en lin méditerranéen, mailles fines et coupes tailleur.',
        };
      case 'nouveautes':
        return {
          kicker: 'Derniers Arrivages',
          title: 'Nouveautés',
          desc: 'Les nouvelles pièces de la saison tout juste arrivées dans notre boutique.',
        };
      case 'promotions':
        return {
          kicker: 'Offres Privilèges',
          title: 'Promotions',
          desc: 'Sélection de pièces signatures proposées à prix doux pour une durée limitée.',
        };
      default:
        return {
          kicker: 'Catalogue Complet',
          title: 'Toutes les Collections',
          desc: 'Explorez l’ensemble des créations CASA STYLE Femme et Homme.',
        };
    }
  }, [mode]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedSize('');
    setSelectedColor('');
    setMaxPrice(4000);
    setSort('newest');
    setSearchParams({});
  };

  const FiltersPanel = (
    <div className="space-y-8">
      {/* Search */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#111111] mb-3">
          Recherche
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-[#111111]/45 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, matière..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#111111]/15 focus:border-[#111111] focus:outline-none bg-white"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#111111] mb-3">
          Catégories
        </label>
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          <button
            onClick={() => setSelectedCategory('')}
            className={`w-full text-left px-2.5 py-1.5 text-sm transition-colors flex justify-between ${
              selectedCategory === '' ? 'bg-[#111111] text-white font-medium' : 'text-[#111111]/75 hover:bg-[#F5F5F5]'
            }`}
          >
            <span>Toutes</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`w-full text-left px-2.5 py-1.5 text-sm transition-colors flex items-center justify-between ${
                selectedCategory === cat.slug
                  ? 'bg-[#111111] text-white font-medium'
                  : 'text-[#111111]/75 hover:bg-[#F5F5F5]'
              }`}
            >
              <span className="truncate">{cat.name}</span>
              <span className="text-xs opacity-60 tabular-nums ml-2">{cat.product_count ?? ''}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#111111]">
            Prix max
          </label>
          <span className="text-xs font-medium tabular-nums text-[#111111]">
            {maxPrice >= 4000 ? 'Tous les prix' : `${maxPrice.toLocaleString('fr-MA')} DH`}
          </span>
        </div>
        <input
          type="range"
          min={300}
          max={4000}
          step={100}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#111111]"
        />
      </div>

      {/* Size */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#111111] mb-3">
          Taille
        </label>
        <div className="grid grid-cols-3 gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSize(selectedSize === s ? '' : s)}
              className={`py-2 text-xs font-medium border transition-colors ${
                selectedSize === s
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white text-[#111111] border-[#111111]/15 hover:border-[#111111]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#111111] mb-3">
          Couleur
        </label>
        <div className="flex flex-wrap gap-2">
          {availableColors.map(([name, hex]) => {
            const active = selectedColor === name;
            return (
              <button
                key={name}
                onClick={() => setSelectedColor(active ? '' : name)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs border transition-colors ${
                  active ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#111111]/15 bg-white text-[#111111]'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                  style={{ backgroundColor: hex }}
                />
                <span className="truncate max-w-[90px]">{name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={resetFilters}
        className="w-full py-2.5 text-xs font-medium uppercase tracking-wider border border-[#111111]/20 text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      {/* Header */}
      <div className="pb-8 border-b border-[#111111]/10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[#B89B72] mb-2">{pageHeader.kicker}</p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#111111]">{pageHeader.title}</h1>
          <p className="mt-2.5 text-sm sm:text-base text-[#111111]/70">{pageHeader.desc}</p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden px-4 py-2.5 border border-[#111111]/20 text-xs font-medium uppercase tracking-wider flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres
          </button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Trier les produits"
            className="px-3.5 py-2.5 border border-[#111111]/20 bg-white text-xs font-medium text-[#111111] focus:outline-none focus:border-[#111111]"
          >
            <option value="newest">Trier : Nouveautés</option>
            <option value="bestsellers">Trier : Meilleures ventes</option>
            <option value="price_asc">Prix : Croissant</option>
            <option value="price_desc">Prix : Décroissant</option>
          </select>
        </div>
      </div>

      {/* Active Promotions Strip when on /promotions */}
      {mode === 'promotions' && promotions.length > 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {promotions.map((pr) => (
            <div key={pr.id} className="p-4 bg-[#EDE5D8]/60 border border-[#B89B72]/30">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#B89B72]">
                -{pr.discount_percent}% Privilège
              </p>
              <p className="text-sm font-semibold text-[#111111] mt-1">{pr.title}</p>
              <p className="text-xs text-[#111111]/70 mt-1 line-clamp-2">{pr.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="mt-8 flex gap-10">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">{FiltersPanel}</aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          <div className="mb-5 flex items-center justify-between text-xs text-[#111111]/60">
            <span className="tabular-nums">
              {products.length} {products.length > 1 ? 'modèles trouvés' : 'modèle trouvé'}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3 animate-pulse">
                  <div className="aspect-[3/4] bg-[#EDE5D8]/60" />
                  <div className="h-3 w-20 bg-[#EDE5D8]" />
                  <div className="h-4 w-36 bg-[#EDE5D8]" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center border border-[#111111]/10 bg-[#F5F5F5]/50 px-6">
              <p className="font-editorial text-2xl text-[#111111] mb-2">Aucun article trouvé</p>
              <p className="text-sm text-[#111111]/65 mb-6">
                Essayez d’élargir vos critères de recherche ou de réinitialiser les filtres.
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-3 bg-[#111111] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#B89B72] transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10 lg:gap-x-7">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div className="fixed inset-0 bg-black/45" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative w-80 max-w-[85vw] bg-white h-full overflow-y-auto p-6 z-10 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#111111]/10">
              <h2 className="font-editorial text-2xl font-medium">Filtres</h2>
              <button onClick={() => setMobileFiltersOpen(false)} aria-label="Fermer les filtres">
                <X className="w-5 h-5" />
              </button>
            </div>
            {FiltersPanel}
          </div>
        </div>
      )}
    </div>
  );
};
