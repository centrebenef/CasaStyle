import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatMad, getDeliveryEstimate, MOROCCO_CITIES } from '../lib/api';
import { SafeImage } from '../components/SafeImage';

export const CartPage: React.FC = () => {
  const { cart, cartSubtotal, updateCartQuantity, removeFromCart, calculateShipping, settings } = useStore();
  const [previewCity, setPreviewCity] = useState<string>('Casablanca');

  const shippingFee = calculateShipping(previewCity, cartSubtotal);
  const total = cartSubtotal + shippingFee;
  const freeThreshold = Number(settings.free_shipping_threshold_mad || 1200);

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <ShoppingBag className="w-12 h-12 text-[#B89B72] mx-auto mb-4" strokeWidth={1.25} />
        <h1 className="font-editorial text-4xl text-[#111111] mb-3">Votre panier est vide</h1>
        <p className="text-sm text-[#111111]/65 mb-8">
          Découvrez nos collections Femme et Homme inspirées par l’élégance de Casablanca.
        </p>
        <Link
          to="/boutique"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-[0.16em] hover:bg-[#B89B72] transition-colors"
        >
          Découvrir la boutique
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <div className="pb-6 border-b border-[#111111]/10 mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#B89B72] mb-2">Récapitulatif</p>
        <h1 className="font-editorial text-4xl font-medium text-[#111111]">Votre Panier</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Items List */}
        <div className="lg:col-span-8 divide-y divide-[#111111]/10 border-t border-b border-[#111111]/10">
          {cart.map((item) => (
            <div key={`${item.productId}-${item.size}-${item.color_name}`} className="py-6 flex gap-5">
              <Link to={`/produit/${item.slug}`} className="w-24 sm:w-28 aspect-[3/4] bg-[#F5F5F5] shrink-0">
                <SafeImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </Link>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      to={`/produit/${item.slug}`}
                      className="text-base font-medium text-[#111111] hover:text-[#B89B72]"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-[#111111]/60 mt-1">
                      Taille : <span className="font-medium text-[#111111]">{item.size}</span> · Couleur :{' '}
                      <span className="font-medium text-[#111111]">{item.color_name}</span>
                    </p>
                    <p className="text-xs text-[#111111]/60 mt-1 tabular-nums">
                      Prix unitaire : {formatMad(item.price_mad)}
                    </p>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.productId, item.size, item.color_name)}
                    className="text-xs text-[#111111]/50 hover:text-red-600 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Supprimer</span>
                  </button>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border border-[#111111]/20">
                    <button
                      onClick={() => updateCartQuantity(item.productId, item.size, item.color_name, item.quantity - 1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-[#F5F5F5]"
                      aria-label="Diminuer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.productId, item.size, item.color_name, item.quantity + 1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-[#F5F5F5]"
                      aria-label="Augmenter"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-base font-semibold tabular-nums text-[#111111]">
                    {formatMad(item.price_mad * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Card */}
        <div className="lg:col-span-4">
          <div className="bg-[#F5F5F5]/80 border border-[#111111]/10 p-6 space-y-5 sticky top-24">
            <h2 className="font-editorial text-2xl font-medium text-[#111111]">Résumé de la commande</h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111]/70 mb-2">
                Estimer la livraison (Ville)
              </label>
              <select
                value={previewCity}
                onChange={(e) => setPreviewCity(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#111111]/15 text-sm focus:outline-none focus:border-[#111111]"
              >
                {MOROCCO_CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <p className="text-xs text-[#111111]/60 mt-1.5">{getDeliveryEstimate(previewCity)}</p>
            </div>

            <div className="space-y-2.5 text-sm pt-2 border-t border-[#111111]/10">
              <div className="flex justify-between">
                <span className="text-[#111111]/70">Sous-total</span>
                <span className="font-medium tabular-nums">{formatMad(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#111111]/70">Livraison ({previewCity})</span>
                <span className="font-medium tabular-nums">
                  {shippingFee === 0 ? 'Gratuite' : formatMad(shippingFee)}
                </span>
              </div>
              {cartSubtotal < freeThreshold && (
                <p className="text-xs text-[#B89B72]">
                  Livraison gratuite dès {formatMad(freeThreshold)} d’achats.
                </p>
              )}
              <div className="flex justify-between text-lg font-semibold pt-3 border-t border-[#111111]/10">
                <span>Total</span>
                <span className="tabular-nums">{formatMad(total)}</span>
              </div>
            </div>

            <Link
              to="/commande"
              className="w-full py-3.5 px-6 bg-[#111111] hover:bg-[#B89B72] text-white text-xs font-semibold uppercase tracking-[0.16em] text-center block transition-colors"
            >
              Valider ma commande
            </Link>
            <Link
              to="/boutique"
              className="w-full py-2.5 text-center text-xs text-[#111111]/70 hover:text-[#111111] block"
            >
              Continuer mes achats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
