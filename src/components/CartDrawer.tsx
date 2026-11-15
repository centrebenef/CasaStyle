import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { formatMad } from '../lib/api';
import { SafeImage } from './SafeImage';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    cartSubtotal,
    updateCartQuantity,
    removeFromCart,
    settings,
    calculateShipping,
  } = useStore();

  const freeThreshold = Number(settings.free_shipping_threshold_mad || 1200);
  const remainingForFree = Math.max(0, freeThreshold - cartSubtotal);
  const progress = Math.min(100, (cartSubtotal / freeThreshold) * 100);
  const estimatedCasaShipping = calculateShipping('Casablanca', cartSubtotal);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end no-print">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/45"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl z-10"
            aria-label="Panier d'achat"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#111111]/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#111111]" />
                <h2 className="font-editorial text-2xl font-semibold text-[#111111]">Votre Panier</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-[#111111]/70 hover:text-[#111111]"
                aria-label="Fermer le panier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free shipping progress */}
            <div className="px-6 py-3 bg-[#EDE5D8]/50 border-b border-[#111111]/10">
              <p className="text-xs text-[#111111] mb-2">
                {remainingForFree === 0
                  ? 'Vous bénéficiez de la livraison gratuite au Maroc.'
                  : `Plus que ${formatMad(remainingForFree)} pour profiter de la livraison gratuite.`}
              </p>
              <div className="w-full h-1 bg-[#111111]/10 overflow-hidden">
                <div
                  className="h-full bg-[#B89B72] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#111111]/10">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <ShoppingBag className="w-10 h-10 text-[#B89B72] mb-4" strokeWidth={1.25} />
                  <p className="font-editorial text-2xl text-[#111111] mb-2">Votre panier est vide</p>
                  <p className="text-sm text-[#111111]/60 mb-6 max-w-xs">
                    Explorez nos pièces intemporelles Femme et Homme confectionnées avec exigence.
                  </p>
                  <Link
                    to="/boutique"
                    onClick={() => setIsCartOpen(false)}
                    className="px-6 py-3 bg-[#111111] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#B89B72] transition-colors"
                  >
                    Découvrir la collection
                  </Link>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={`${item.productId}-${item.size}-${item.color_name}`} className="py-4 flex gap-4">
                    <Link
                      to={`/produit/${item.slug}`}
                      onClick={() => setIsCartOpen(false)}
                      className="w-20 h-26 bg-[#F5F5F5] shrink-0 overflow-hidden"
                    >
                      <SafeImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/produit/${item.slug}`}
                            onClick={() => setIsCartOpen(false)}
                            className="text-sm font-medium text-[#111111] hover:text-[#B89B72] line-clamp-2"
                          >
                            {item.name}
                          </Link>
                          <button
                            onClick={() => removeFromCart(item.productId, item.size, item.color_name)}
                            className="text-[#111111]/40 hover:text-red-600 p-1 shrink-0"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-[#111111]/60 mt-1">
                          Taille : {item.size} · Couleur : {item.color_name}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-[#111111]/15">
                          <button
                            onClick={() =>
                              updateCartQuantity(item.productId, item.size, item.color_name, item.quantity - 1)
                            }
                            className="w-7 h-7 flex items-center justify-center hover:bg-[#F5F5F5]"
                            aria-label="Diminuer la quantité"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-medium tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(item.productId, item.size, item.color_name, item.quantity + 1)
                            }
                            className="w-7 h-7 flex items-center justify-center hover:bg-[#F5F5F5]"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-sm font-semibold tabular-nums text-[#111111]">
                          {formatMad(item.price_mad * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-[#111111]/10 bg-[#F5F5F5]/60 space-y-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-[#111111]/70">
                    <span>Sous-total</span>
                    <span className="tabular-nums font-medium text-[#111111]">{formatMad(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#111111]/70">
                    <span>Livraison (dès Casablanca)</span>
                    <span className="tabular-nums font-medium text-[#111111]">
                      {estimatedCasaShipping === 0 ? 'Gratuite' : formatMad(estimatedCasaShipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-[#111111] pt-2 border-t border-[#111111]/10">
                    <span>Total estimé</span>
                    <span className="tabular-nums">{formatMad(cartSubtotal + estimatedCasaShipping)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/panier"
                    onClick={() => setIsCartOpen(false)}
                    className="py-3 px-4 border border-[#111111] text-center text-xs font-medium uppercase tracking-wider text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
                  >
                    Voir le panier
                  </Link>
                  <Link
                    to="/commande"
                    onClick={() => setIsCartOpen(false)}
                    className="py-3 px-4 bg-[#111111] text-center text-xs font-medium uppercase tracking-wider text-white hover:bg-[#B89B72] transition-colors"
                  >
                    Valider ma commande
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
