import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ChevronRight, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { apiFetch, formatMad } from '../lib/api';
import type { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { SafeImage } from '../components/SafeImage';
import { ProductCard } from '../components/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart, favoriteIds, toggleFavorite, notify } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);
    setActiveImageIdx(0);
    setValidationError('');

    apiFetch<{ product: Product; related: Product[] }>(`/api/products/${slug}`)
      .then((data) => {
        if (!active) return;
        setProduct(data.product);
        setRelated(data.related || []);
        if (data.product.colors?.length === 1) {
          setSelectedColor(data.product.colors[0].color_name);
        }
        if (data.product.sizes?.length === 1) {
          setSelectedSize(data.product.sizes[0]);
        }
      })
      .catch(() => {
        if (active) setProduct(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-pulse">
          <div className="lg:col-span-7 aspect-[3/4] bg-[#EDE5D8]/60" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-4 w-32 bg-[#EDE5D8]" />
            <div className="h-9 w-72 bg-[#EDE5D8]" />
            <div className="h-6 w-28 bg-[#EDE5D8]" />
            <div className="h-24 w-full bg-[#EDE5D8]/50" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="font-editorial text-4xl text-[#111111] mb-3">Produit introuvable</h1>
        <p className="text-sm text-[#111111]/65 mb-6">
          Ce modèle n’est plus disponible ou l’adresse est incorrecte.
        </p>
        <Link
          to="/boutique"
          className="inline-block px-7 py-3.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider"
        >
          Retour à la boutique
        </Link>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [];
  const mainImage = images[activeImageIdx]?.image_url || '';
  const isFav = favoriteIds.includes(product.id);

  // Compute stock for selected variant or total
  const variantRecord =
    selectedSize && selectedColor
      ? product.inventory?.find((i) => i.size === selectedSize && i.color_name === selectedColor)
      : null;

  const availableVariantStock = variantRecord
    ? variantRecord.quantity
    : selectedSize
    ? product.inventory?.filter((i) => i.size === selectedSize).reduce((s, x) => s + x.quantity, 0)
    : product.total_stock;

  const handleAdd = () => {
    if (!selectedSize) {
      setValidationError('Veuillez sélectionner une taille avant d’ajouter au panier.');
      notify('Veuillez choisir une taille.', 'error');
      return;
    }
    if (!selectedColor) {
      setValidationError('Veuillez sélectionner une couleur avant d’ajouter au panier.');
      notify('Veuillez choisir une couleur.', 'error');
      return;
    }
    if (availableVariantStock <= 0) {
      setValidationError('Cette déclinaison est actuellement en rupture de stock.');
      notify('Stock insuffisant pour cette déclinaison.', 'error');
      return;
    }
    if (quantity > availableVariantStock) {
      setValidationError(`Stock disponible limité à ${availableVariantStock} unité(s).`);
      notify(`Quantité disponible : ${availableVariantStock}.`, 'error');
      return;
    }

    setValidationError('');
    const colorObj = product.colors.find((c) => c.color_name === selectedColor) || {
      color_name: selectedColor,
      color_hex: '#111111',
    };
    addToCart(product, selectedSize, colorObj.color_name, colorObj.color_hex, quantity);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#111111]/60 mb-8 flex-wrap">
        <Link to="/" className="hover:text-[#111111]">Accueil</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={product.gender === 'femme' ? '/femme' : '/homme'} className="hover:text-[#111111] capitalize">
          {product.gender}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#111111] font-medium truncate">{product.name}</span>
      </nav>

      {/* Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Gallery */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4 lg:sticky lg:top-24">
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:w-20 shrink-0">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`aspect-[3/4] w-16 sm:w-20 shrink-0 bg-[#F5F5F5] border transition-colors overflow-hidden ${
                    activeImageIdx === idx ? 'border-[#111111]' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <SafeImage src={img.image_url} alt={`${product.name} miniature ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 aspect-[3/4] bg-[#F5F5F5] overflow-hidden">
            <SafeImage
              src={mainImage}
              alt={product.name}
              fallbackTitle={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Purchase Module */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          <div className="border-b border-[#111111]/10 pb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#B89B72] mb-2">
              {product.gender === 'femme' ? 'Femme' : 'Homme'} · {product.category_name}
            </p>
            <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#111111] leading-tight">
              {product.name}
            </h1>

            <div className="mt-4 flex items-baseline gap-3 tabular-nums">
              <span className="text-2xl font-semibold text-[#111111]">
                {formatMad(product.price_mad)}
              </span>
              {product.old_price_mad && product.old_price_mad > product.price_mad && (
                <span className="text-base text-[#111111]/45 line-through">
                  {formatMad(product.old_price_mad)}
                </span>
              )}
            </div>

            {/* Stock availability */}
            <div className="mt-3 text-xs font-medium">
              {product.total_stock <= 0 ? (
                <span className="text-red-600">Rupture de stock momentanée</span>
              ) : availableVariantStock <= 0 && selectedSize && selectedColor ? (
                <span className="text-red-600">Variante indisponible en stock</span>
              ) : availableVariantStock <= 5 ? (
                <span className="text-amber-700 tabular-nums">
                  Stock limité — plus que {availableVariantStock} pièce(s) disponible(s)
                </span>
              ) : (
                <span className="text-emerald-700 tabular-nums">
                  En stock ({availableVariantStock} disponibles) · Expédié depuis Casablanca
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-[#111111]/80 leading-relaxed">{product.description}</p>

          {/* Color Selector (Mandatory) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#111111]">
                Couleur <span className="text-[#B89B72]">*</span>
              </span>
              <span className="text-xs text-[#111111]/65">{selectedColor || 'Sélectionner'}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((c) => {
                const active = selectedColor === c.color_name;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedColor(c.color_name);
                      setValidationError('');
                    }}
                    className={`flex items-center gap-2 px-3 py-2 border text-xs font-medium transition-colors ${
                      active
                        ? 'border-[#111111] bg-[#111111] text-white'
                        : 'border-[#111111]/20 bg-white text-[#111111] hover:border-[#111111]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: c.color_hex }}
                    />
                    <span>{c.color_name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector (Mandatory) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#111111]">
                Taille <span className="text-[#B89B72]">*</span>
              </span>
              <span className="text-xs text-[#111111]/65">{selectedSize || 'Sélectionner'}</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {product.sizes.map((size) => {
                const sizeStock = product.inventory
                  ?.filter((i) => i.size === size && (!selectedColor || i.color_name === selectedColor))
                  .reduce((s, x) => s + x.quantity, 0);
                const disabled = sizeStock <= 0;
                const active = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setSelectedSize(size);
                      setValidationError('');
                    }}
                    className={`py-2.5 text-xs font-semibold border transition-colors ${
                      disabled
                        ? 'border-[#111111]/10 bg-[#F5F5F5] text-[#111111]/30 line-through cursor-not-allowed'
                        : active
                        ? 'border-[#111111] bg-[#111111] text-white'
                        : 'border-[#111111]/20 bg-white text-[#111111] hover:border-[#111111]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Actions */}
          <div className="space-y-3 pt-2">
            {validationError && (
              <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-3 py-2">
                {validationError}
              </p>
            )}

            <div className="flex items-stretch gap-3">
              <div className="flex items-center border border-[#111111]/20 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-11 h-12 flex items-center justify-center hover:bg-[#F5F5F5]"
                  aria-label="Diminuer la quantité"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, availableVariantStock), q + 1))}
                  className="w-11 h-12 flex items-center justify-center hover:bg-[#F5F5F5]"
                  aria-label="Augmenter la quantité"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={product.total_stock <= 0}
                className="flex-1 h-12 bg-[#111111] hover:bg-[#B89B72] disabled:bg-[#111111]/30 text-white text-xs font-semibold uppercase tracking-[0.16em] transition-colors flex items-center justify-center gap-2.5"
              >
                <ShoppingBag className="w-4 h-4" />
                {product.total_stock <= 0 ? 'Rupture de stock' : 'Ajouter au panier'}
              </button>

              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                className="w-12 h-12 border border-[#111111]/20 flex items-center justify-center hover:border-[#111111] transition-colors"
                aria-label="Favoris"
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-[#B89B72] text-[#B89B72]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Delivery & Reassurance */}
          <div className="pt-6 border-t border-[#111111]/10 space-y-3 text-xs text-[#111111]/75">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-[#B89B72] shrink-0" />
              <span>Casablanca 24h (30 DH) · Autres villes du Maroc 24–48h (45 DH) · Gratuite dès 1 200 DH</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#B89B72] shrink-0" />
              <span>Paiement à la livraison (Cash on Delivery) accepté partout au Maroc</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#B89B72] shrink-0" />
              <span>Échange et retour sous 14 jours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-20 pt-14 border-t border-[#111111]/10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#B89B72] mb-1">Compléter le vestiaire</p>
              <h2 className="font-editorial text-3xl font-medium text-[#111111]">Produits similaires</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
