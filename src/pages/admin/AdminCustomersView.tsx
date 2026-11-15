import React, { useEffect, useState } from 'react';
import { Eye, Search, UserCheck, UserX, X } from 'lucide-react';
import { apiFetch, formatDateFr, formatMad } from '../../lib/api';
import type { CustomerRecord, Order } from '../../types';
import { useStore } from '../../context/StoreContext';

export const AdminCustomersView: React.FC = () => {
  const { notify } = useStore();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<CustomerRecord[]>('/api/admin/customers');
      setCustomers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCustomerModal = async (c: CustomerRecord) => {
    setSelectedCustomer(c);
    try {
      const orders = await apiFetch<Order[]>(`/api/admin/customers/${c.id}/orders`);
      setCustomerOrders(orders);
    } catch {
      setCustomerOrders([]);
    }
  };

  const toggleActive = async (c: CustomerRecord) => {
    try {
      const updated = await apiFetch<CustomerRecord>(`/api/admin/customers/${c.id}/toggle`, { method: 'PATCH' });
      setCustomers((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: updated.is_active } : x)));
      notify(updated.is_active ? `Compte de ${c.full_name} réactivé.` : `Compte de ${c.full_name} désactivé.`);
    } catch (err: any) {
      notify(err.message || 'Erreur', 'error');
    }
  };

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111111]">Gestion des clients</h1>
          <p className="text-xs text-neutral-500 mt-0.5 tabular-nums">{customers.length} client(s) enregistré(s)</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            className="w-full pl-9 pr-3 py-2 border border-neutral-300 bg-white text-sm focus:outline-none focus:border-[#111111]"
          />
        </div>
      </div>

      <div className="bg-white border border-neutral-200 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 bg-neutral-50">
              <th className="py-3 px-4 font-medium">Client</th>
              <th className="py-3 px-4 font-medium">Téléphone</th>
              <th className="py-3 px-4 font-medium">Ville</th>
              <th className="py-3 px-4 font-medium text-right">Commandes</th>
              <th className="py-3 px-4 font-medium text-right">Total dépensé</th>
              <th className="py-3 px-4 font-medium">Statut</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-xs text-neutral-500">
                  Chargement des clients...
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-[#111111]">
                      {c.full_name}
                      {c.is_demo === 1 && <span className="ml-2 text-[10px] text-neutral-400">(Démo)</span>}
                    </p>
                    <p className="text-xs text-neutral-500">{c.email}</p>
                  </td>
                  <td className="py-3 px-4 text-xs tabular-nums">{c.phone}</td>
                  <td className="py-3 px-4 text-xs text-neutral-600">{c.city}</td>
                  <td className="py-3 px-4 text-right tabular-nums">{c.orders_count ?? 0}</td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums">
                    {formatMad(c.total_spent_mad ?? 0)}
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <span className={c.is_active ? 'text-emerald-700 font-medium' : 'text-red-600 font-medium'}>
                      {c.is_active ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openCustomerModal(c)}
                        className="p-1.5 text-neutral-600 hover:text-[#111111]"
                        aria-label="Consulter le client"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(c)}
                        className={`p-1.5 ${c.is_active ? 'text-neutral-500 hover:text-red-600' : 'text-emerald-600'}`}
                        aria-label={c.is_active ? 'Désactiver le compte' : 'Réactiver le compte'}
                      >
                        {c.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-xl max-h-[85vh] overflow-y-auto border border-neutral-200 shadow-2xl">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{selectedCustomer.full_name}</h2>
              <button onClick={() => setSelectedCustomer(null)} aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-4 border border-neutral-200 text-xs">
                <div>
                  <span className="text-neutral-500 block">E-mail</span>
                  <span className="font-medium">{selectedCustomer.email}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Téléphone</span>
                  <span className="font-medium tabular-nums">{selectedCustomer.phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-neutral-500 block">Adresse</span>
                  <span className="font-medium">
                    {selectedCustomer.address || '—'} · {selectedCustomer.city} {selectedCustomer.postal_code}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
                  Historique des commandes ({customerOrders.length})
                </h3>
                {customerOrders.length === 0 ? (
                  <p className="text-xs text-neutral-500">Aucune commande passée par ce client.</p>
                ) : (
                  <div className="divide-y divide-neutral-100 border border-neutral-200">
                    {customerOrders.map((o) => (
                      <div key={o.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-mono font-semibold">{o.order_number}</p>
                          <p className="text-neutral-500">{formatDateFr(o.created_at)} · {o.status}</p>
                        </div>
                        <span className="font-semibold tabular-nums">{formatMad(o.total_mad)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
