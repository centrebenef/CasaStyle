import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatMad } from '../lib/api';
import type { Product } from '../types';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { favoriteIds, toggleFavorite, addToCart } = useStore();
  const isFav = favoriteIds.includes(product.id);
  const primaryImg = product.images?.[0]?.image_url || '';
  const secondaryImg = product.images?.[1]?.image_url || primaryImg;
  const outOfStock = product.total_stock <= 0;

  const discountPct =
    product.old_price_mad && product.old_price_mad > product.price_mad
      ? Math.round(((product.old_price_mad - product.price_mad) / product.old_price_mad) * 100)
      : 0;

  // At most 1 clean subtle text tag (never badge spam)
  let tagLabel: string | null = null;
  if (outOfStock) tagLabel = 'Épuisé';
  else if (discountPct > 0) tagLabel = `-${discountPct}%`;
  else if (product.is_new) tagLabel = 'Nouveau';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    // Find first in-stock variant
    const inStockVariant = product.inventory?.find((i) => i.quantity > 0);
    const size = inStockVariant?.size || product.sizes?.[0] || 'M';
    const colorObj =
      product.colors?.find((c) => c.color_name === inStockVariant?.color_name) ||
      product.colors?.[0] || { color_name: 'Noir', color_hex: '#111111' };
    addToCart(product, size, colorObj.color_name, colorObj.color_hex, 1);
  };

  return (
    <div className="group flex flex-col transition-transform duration-200 hover:-translate-y-0.5">
      <div className="relative aspect-[3/4] bg-[#F5F5F5] overflow-hidden rounded-sm">
        <Link to={`/produit/${product.slug}`} className="block w-full h-full">
          <SafeImage
            src={primaryImg}
            alt={product.name}
            fallbackTitle={product.name}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03]"
          />
          {secondaryImg && secondaryImg !== primaryImg && (
            <SafeImage
              src={secondaryImg}
              alt={`${product.name} vue alternative`}
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Single clean corner tag */}
        {tagLabel && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 text-[11px] font-medium tracking-wider uppercase ${
              outOfStock
                ? 'bg-[#111111] text-white'
                : discountPct > 0
                ? 'bg-[#B89B72] text-white'
                : 'bg-white/95 text-[#111111]'
            }`}
          >
            {tagLabel}
          </span>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white flex items-center justify-center rounded-full text-[#111111] transition-colors shadow-sm"
          aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-[#B89B72] text-[#B89B72]' : ''}`} />
        </button>

        {/* Hover Quick Add */}
        {!outOfStock && (
          <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
            <button
              onClick={handleQuickAdd}
              className="w-full py-2.5 px-4 bg-[#111111]/95 hover:bg-[#B89B72] text-white text-xs font-medium tracking-wider uppercase flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Ajouter au panier
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="pt-3.5 flex-1 flex flex-col justify-between gap-1.5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#111111]/55">
            {product.category_name || (product.gender === 'femme' ? 'Femme' : 'Homme')}
          </p>
          <Link
            to={`/produit/${product.slug}`}
            className="text-[15px] font-medium text-[#111111] hover:text-[#B89B72] transition-colors line-clamp-1 mt-0.5 block"
          >
            {product.name}
          </Link>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-[15px] font-semibold text-[#111111]">
              {formatMad(product.price_mad)}
            </span>
            {product.old_price_mad && product.old_price_mad > product.price_mad && (
              <span className="text-xs text-[#111111]/45 line-through">
                {formatMad(product.old_price_mad)}
              </span>
            )}
          </div>

          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1" aria-label="Couleurs disponibles">
              {product.colors.slice(0, 3).map((c) => (
                <span
                  key={c.id}
                  title={c.color_name}
                  className="w-3 h-3 rounded-full border border-[#111111]/20"
                  style={{ backgroundColor: c.color_hex }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
