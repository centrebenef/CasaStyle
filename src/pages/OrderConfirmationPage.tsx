import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Printer, Truck } from 'lucide-react';
import { apiFetch, formatDateFr, formatMad, getDeliveryEstimate } from '../lib/api';
import type { Order } from '../types';
import { SafeImage } from '../components/SafeImage';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) return;
    apiFetch<Order>(`/api/orders/${orderNumber}`)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-sm text-[#111111]/60">
        Chargement de votre confirmation de commande...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="font-editorial text-4xl mb-3">Commande introuvable</h1>
        <Link to="/boutique" className="text-sm underline">Retour à la boutique</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
      <div className="border border-[#111111]/15 bg-white p-7 sm:p-10 space-y-8">
        <div className="text-center border-b border-[#111111]/10 pb-8">
          <CheckCircle2 className="w-12 h-12 text-[#B89B72] mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-xs uppercase tracking-[0.2em] text-[#B89B72] mb-2">Merci pour votre confiance</p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#111111]">
            Commande confirmée
          </h1>
          <p className="mt-3 text-sm text-[#111111]/75">
            Numéro de commande :{' '}
            <span className="font-mono font-semibold text-[#111111]">{order.order_number}</span>
          </p>
          <p className="text-xs text-[#111111]/60 mt-1">
            Date : {formatDateFr(order.created_at)} · Statut : {order.status}
          </p>
        </div>

        {/* Delivery & Payment Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#111111]/55">Livraison</p>
            <p className="font-medium text-[#111111]">{order.customer_name}</p>
            <p className="text-[#111111]/75">{order.address}</p>
            <p className="text-[#111111]/75">
              {order.city} {order.postal_code}
            </p>
            <p className="text-[#111111]/75 tabular-nums">{order.customer_phone}</p>
            <p className="text-xs text-[#B89B72] pt-1 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              {getDeliveryEstimate(order.city)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#111111]/55">Paiement</p>
            <p className="font-medium text-[#111111]">
              {order.payment_method === 'cod' ? 'Paiement à la livraison (Espèces)' : 'Paiement en ligne (CMI)'}
            </p>
            <p className="text-[#111111]/75">{order.payment_status}</p>
            <p className="text-[#111111]/75">{order.customer_email}</p>
          </div>
        </div>

        {/* Items */}
        <div className="border-t border-b border-[#111111]/10 divide-y divide-[#111111]/10">
          {(order.items || []).map((item) => (
            <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <SafeImage src={item.product_image} alt={item.product_name} className="w-12 h-16 object-cover bg-[#F5F5F5] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#111111] truncate">{item.product_name}</p>
                  <p className="text-xs text-[#111111]/60">
                    Taille : {item.size} · Couleur : {item.color_name} · Qté : {item.quantity}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold tabular-nums shrink-0">{formatMad(item.line_total_mad)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-[#111111]/70">
            <span>Sous-total</span>
            <span className="tabular-nums">{formatMad(order.subtotal_mad)}</span>
          </div>
          <div className="flex justify-between text-[#111111]/70">
            <span>Frais de livraison</span>
            <span className="tabular-nums">{order.shipping_fee_mad === 0 ? 'Gratuit' : formatMad(order.shipping_fee_mad)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold pt-2 border-t border-[#111111]/10">
            <span>Total</span>
            <span className="tabular-nums">{formatMad(order.total_mad)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 no-print">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 px-5 border border-[#111111] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#F5F5F5]"
          >
            <Printer className="w-4 h-4" />
            Imprimer le reçu
          </button>
          <Link
            to="/boutique"
            className="flex-1 py-3 px-5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider text-center hover:bg-[#B89B72] transition-colors"
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
};
