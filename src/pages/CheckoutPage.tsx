import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, ShieldCheck, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { apiFetch, formatMad, getDeliveryEstimate, MOROCCO_CITIES } from '../lib/api';
import type { Order } from '../types';
import { SafeImage } from '../components/SafeImage';

export const CheckoutPage: React.FC = () => {
  const { cart, cartSubtotal, user, clearCart, calculateShipping, notify } = useStore();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [cityChoice, setCityChoice] = useState<string>(
    user?.city && MOROCCO_CITIES.includes(user.city as any) ? user.city : 'Casablanca'
  );
  const [customCity, setCustomCity] = useState('');
  const [address, setAddress] = useState(user?.address || '');
  const [postalCode, setPostalCode] = useState(user?.postal_code || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online_card'>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.full_name || '');
      if (!phone) setPhone(user.phone || '');
      if (!email) setEmail(user.email || '');
      if (!address) setAddress(user.address || '');
      if (!postalCode) setPostalCode(user.postal_code || '');
    }
  }, [user]);

  const effectiveCity = cityChoice === 'Autres villes du Maroc' ? customCity.trim() || 'Autres villes du Maroc' : cityChoice;
  const shippingFee = calculateShipping(effectiveCity, cartSubtotal);
  const total = cartSubtotal + shippingFee;

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="font-editorial text-4xl text-[#111111] mb-3">Votre panier est vide</h1>
        <p className="text-sm text-[#111111]/65 mb-6">
          Ajoutez au moins un article avant de procéder à la commande.
        </p>
        <Link
          to="/boutique"
          className="inline-block px-7 py-3.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider"
        >
          Explorer la boutique
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !phone.trim() || !email.trim() || !address.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (cityChoice === 'Autres villes du Maroc' && !customCity.trim()) {
      setError('Veuillez préciser le nom de votre ville.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await apiFetch<Order>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: fullName.trim(),
          customer_phone: phone.trim(),
          customer_email: email.trim(),
          city: effectiveCity,
          address: address.trim(),
          postal_code: postalCode.trim(),
          notes: notes.trim(),
          payment_method: paymentMethod,
          items: cart.map((i) => ({
            productId: i.productId,
            size: i.size,
            color_name: i.color_name,
            quantity: i.quantity,
          })),
        }),
      });

      clearCart();
      notify(`Commande ${order.order_number} enregistrée avec succès.`);
      navigate(`/commande/confirmation/${order.order_number}`);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la validation.');
      notify(err.message || 'Erreur lors de la commande', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <div className="pb-6 border-b border-[#111111]/10 mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#B89B72] mb-2">Finalisation</p>
        <h1 className="font-editorial text-4xl font-medium text-[#111111]">Commande & Livraison</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Form */}
        <div className="lg:col-span-7 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          {/* Customer Info */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#111111] pb-2 border-b border-[#111111]/10">
              1. Coordonnées client
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">
                  Nom et prénom <span className="text-[#B89B72]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex : Sara Bennani"
                  className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">
                  Téléphone <span className="text-[#B89B72]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex : +212 6 61 00 00 00"
                  className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">
                Adresse e-mail <span className="text-[#B89B72]">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.ma"
                className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
              />
            </div>
          </div>

          {/* Shipping Info */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#111111] pb-2 border-b border-[#111111]/10">
              2. Adresse de livraison au Maroc
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">
                  Ville <span className="text-[#B89B72]">*</span>
                </label>
                <select
                  value={cityChoice}
                  onChange={(e) => setCityChoice(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#111111]/20 bg-white text-sm focus:outline-none focus:border-[#111111]"
                >
                  {MOROCCO_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">
                  Code postal
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Ex : 20100"
                  className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            {cityChoice === 'Autres villes du Maroc' && (
              <div>
                <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">
                  Précisez votre ville <span className="text-[#B89B72]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="Ex : Meknès, Oujda, Kénitra, Mohammedia..."
                  className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">
                Adresse complète <span className="text-[#B89B72]">*</span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Numéro, rue, quartier, immeuble / appartement"
                className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">
                Informations complémentaires
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instructions pour le livreur, créneau souhaité..."
                className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div className="p-3.5 bg-[#EDE5D8]/55 border border-[#B89B72]/30 flex items-center gap-3 text-xs text-[#111111]">
              <Truck className="w-4 h-4 text-[#B89B72] shrink-0" />
              <span>
                {getDeliveryEstimate(effectiveCity)} · Frais :{' '}
                <strong>{shippingFee === 0 ? 'Offerts' : formatMad(shippingFee)}</strong>
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#111111] pb-2 border-b border-[#111111]/10">
              3. Mode de paiement
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 text-left border transition-colors ${
                  paymentMethod === 'cod'
                    ? 'border-[#111111] bg-[#111111] text-white'
                    : 'border-[#111111]/20 bg-white text-[#111111] hover:border-[#111111]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold">Paiement à la livraison</span>
                  <ShieldCheck className="w-4 h-4 text-[#B89B72]" />
                </div>
                <p className={`text-xs ${paymentMethod === 'cod' ? 'text-white/75' : 'text-[#111111]/65'}`}>
                  Réglez en espèces directement au livreur lors de la réception (Cash on Delivery).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('online_card')}
                className={`p-4 text-left border transition-colors ${
                  paymentMethod === 'online_card'
                    ? 'border-[#111111] bg-[#111111] text-white'
                    : 'border-[#111111]/20 bg-white text-[#111111] hover:border-[#111111]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold">Paiement en ligne (CMI)</span>
                  <CreditCard className="w-4 h-4 text-[#B89B72]" />
                </div>
                <p className={`text-xs ${paymentMethod === 'online_card' ? 'text-white/75' : 'text-[#111111]/65'}`}>
                  Pré-autorisation carte marocaine / internationale (passerelle CMI prête pour activation).
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-5">
          <div className="bg-[#F5F5F5]/80 border border-[#111111]/10 p-6 space-y-5 sticky top-24">
            <h2 className="font-editorial text-2xl font-medium text-[#111111]">Votre commande</h2>

            <div className="divide-y divide-[#111111]/10 max-h-80 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={`${item.productId}-${item.size}-${item.color_name}`} className="py-3 flex gap-3">
                  <SafeImage src={item.image} alt={item.name} className="w-14 h-18 object-cover bg-white shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111111] truncate">{item.name}</p>
                    <p className="text-xs text-[#111111]/60">
                      {item.size} · {item.color_name} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0">
                    {formatMad(item.price_mad * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 text-sm pt-3 border-t border-[#111111]/10">
              <div className="flex justify-between">
                <span className="text-[#111111]/70">Sous-total</span>
                <span className="font-medium tabular-nums">{formatMad(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#111111]/70">Livraison ({effectiveCity})</span>
                <span className="font-medium tabular-nums">
                  {shippingFee === 0 ? 'Gratuite' : formatMad(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-3 border-t border-[#111111]/10">
                <span>Total à régler</span>
                <span className="tabular-nums">{formatMad(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 bg-[#111111] hover:bg-[#B89B72] text-white text-xs font-semibold uppercase tracking-[0.16em] transition-colors disabled:opacity-60"
            >
              {submitting ? 'Validation en cours...' : `Confirmer la commande (${formatMad(total)})`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
