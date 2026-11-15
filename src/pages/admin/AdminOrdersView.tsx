import React, { useEffect, useState } from 'react';
import { Eye, Printer, X } from 'lucide-react';
import { apiFetch, formatDateFr, formatMad } from '../../lib/api';
import type { Order, OrderStatus } from '../../types';
import { useStore } from '../../context/StoreContext';

const STATUSES: OrderStatus[] = ['En attente', 'Confirmée', 'En préparation', 'Expédiée', 'Livrée', 'Annulée'];

export const AdminOrdersView: React.FC = () => {
  const { notify, settings } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'real' | 'demo'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Order[]>(`/api/admin/orders?status=${encodeURIComponent(statusFilter)}&type=${typeFilter}`);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, typeFilter]);

  const handleStatusChange = async (orderId: number, nextStatus: OrderStatus) => {
    try {
      const updated = await apiFetch<Order>(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
      notify(`Statut mis à jour : ${nextStatus}`);
    } catch (err: any) {
      notify(err.message || 'Erreur lors de la mise à jour', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-semibold text-[#111111]">Gestion des commandes</h1>
          <p className="text-xs text-neutral-500 mt-0.5 tabular-nums">{orders.length} commande(s) affichée(s)</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-neutral-300 bg-white text-xs font-medium"
          >
            <option value="all">Toutes (Réelles + Démo)</option>
            <option value="real">Commandes réelles uniquement</option>
            <option value="demo">Commandes démo uniquement</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 bg-white text-xs font-medium"
          >
            <option value="all">Tous les statuts</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 overflow-x-auto no-print">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 bg-neutral-50">
              <th className="py-3 px-4 font-medium">N° Commande</th>
              <th className="py-3 px-4 font-medium">Client</th>
              <th className="py-3 px-4 font-medium">Téléphone</th>
              <th className="py-3 px-4 font-medium">Date</th>
              <th className="py-3 px-4 font-medium">Produits</th>
              <th className="py-3 px-4 font-medium text-right">Total</th>
              <th className="py-3 px-4 font-medium">Paiement</th>
              <th className="py-3 px-4 font-medium">Statut</th>
              <th className="py-3 px-4 font-medium text-right">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-xs text-neutral-500">
                  Chargement des commandes...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-xs text-neutral-500">
                  Aucune commande ne correspond à ce filtre.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-neutral-50">
                  <td className="py-3 px-4 font-mono text-xs font-semibold whitespace-nowrap">
                    {o.order_number}
                    {o.is_demo === 1 && <span className="ml-1.5 text-[10px] font-sans text-neutral-400">(Démo)</span>}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-[#111111]">{o.customer_name}</p>
                    <p className="text-xs text-neutral-500">{o.city}</p>
                  </td>
                  <td className="py-3 px-4 text-xs tabular-nums whitespace-nowrap">{o.customer_phone}</td>
                  <td className="py-3 px-4 text-xs text-neutral-500 tabular-nums whitespace-nowrap">
                    {formatDateFr(o.created_at)}
                  </td>
                  <td className="py-3 px-4 text-xs text-neutral-600 max-w-[200px] truncate">
                    {(o.items || []).map((i) => `${i.product_name} ×${i.quantity}`).join(', ')}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums whitespace-nowrap">
                    {formatMad(o.total_mad)}
                  </td>
                  <td className="py-3 px-4 text-xs">{o.payment_method === 'cod' ? 'À la livraison' : 'En ligne'}</td>
                  <td className="py-3 px-4">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                      className="px-2 py-1 border border-neutral-300 bg-white text-xs font-medium"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="p-1.5 text-neutral-600 hover:text-[#111111]"
                      aria-label="Voir la facture"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail & Printable Invoice Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 print:static print:p-0 print:bg-white">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-neutral-200 shadow-2xl print:shadow-none print:border-0 print:max-h-none">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between no-print">
              <h2 className="text-lg font-semibold">Bon de commande · {selectedOrder.order_number}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#111111] text-white text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer facture
                </button>
                <button onClick={() => setSelectedOrder(null)} className="p-1" aria-label="Fermer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 text-sm">
              <div className="flex justify-between items-start border-b border-neutral-200 pb-4">
                <div>
                  <p className="font-editorial text-2xl font-semibold tracking-wider">{settings.store_name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{settings.address}</p>
                  <p className="text-xs text-neutral-500">{settings.phone} · {settings.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-base">{selectedOrder.order_number}</p>
                  <p className="text-xs text-neutral-500">Date : {formatDateFr(selectedOrder.created_at)}</p>
                  <p className="text-xs font-semibold text-[#B89B72] mt-1">{selectedOrder.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase font-semibold text-neutral-500 mb-1">Client</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                  <p className="text-neutral-600">{selectedOrder.customer_phone}</p>
                  <p className="text-neutral-600">{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold text-neutral-500 mb-1">Adresse de livraison</p>
                  <p className="text-neutral-700">{selectedOrder.address}</p>
                  <p className="text-neutral-700">{selectedOrder.city} {selectedOrder.postal_code}</p>
                  {selectedOrder.notes && <p className="text-xs text-neutral-500 mt-1">Note : {selectedOrder.notes}</p>}
                </div>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 uppercase">
                    <th className="py-2">Article</th>
                    <th className="py-2">Variante</th>
                    <th className="py-2 text-right">Qté</th>
                    <th className="py-2 text-right">PU</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(selectedOrder.items || []).map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 font-medium">{item.product_name}</td>
                      <td className="py-2.5 text-neutral-600">{item.size} · {item.color_name}</td>
                      <td className="py-2.5 text-right tabular-nums">{item.quantity}</td>
                      <td className="py-2.5 text-right tabular-nums">{formatMad(item.unit_price_mad)}</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums">{formatMad(item.line_total_mad)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-neutral-200 pt-4 space-y-1.5 text-right text-sm">
                <p className="text-neutral-600">
                  Sous-total : <span className="tabular-nums font-medium">{formatMad(selectedOrder.subtotal_mad)}</span>
                </p>
                <p className="text-neutral-600">
                  Livraison : <span className="tabular-nums font-medium">{formatMad(selectedOrder.shipping_fee_mad)}</span>
                </p>
                <p className="text-base font-semibold">
                  Total TTC : <span className="tabular-nums">{formatMad(selectedOrder.total_mad)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
