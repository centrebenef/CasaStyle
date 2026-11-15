import React, { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, Plus } from 'lucide-react';
import { apiFetch, formatDateFr } from '../../lib/api';
import type { InventoryMovement } from '../../types';
import { useStore } from '../../context/StoreContext';
import { SafeImage } from '../../components/SafeImage';

interface InventoryRow {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  gender: string;
  size: string;
  color_name: string;
  quantity: number;
  low_stock_threshold: number;
  updated_at: string;
}

export const AdminInventoryView: React.FC = () => {
  const { notify } = useStore();
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [tab, setTab] = useState<'stock' | 'movements'>('stock');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ items: InventoryRow[]; movements: InventoryMovement[] }>('/api/admin/inventory');
      setItems(data.items);
      setMovements(data.movements);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStock = async (row: InventoryRow, nextQty: number) => {
    const qty = Math.max(0, nextQty);
    try {
      await apiFetch(`/api/admin/inventory/${row.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          quantity: qty,
          reason: qty > row.quantity ? 'Réassort manuel' : 'Sortie / correction manuelle',
        }),
      });
      notify(`Stock mis à jour pour ${row.product_name} (${row.size}).`);
      await load();
    } catch (err: any) {
      notify(err.message || 'Erreur lors de la mise à jour', 'error');
    }
  };

  const lowStockCount = items.filter((i) => i.quantity > 0 && i.quantity <= i.low_stock_threshold).length;
  const outStockCount = items.filter((i) => i.quantity === 0).length;

  const filteredItems = items.filter((i) => {
    if (filter === 'low') return i.quantity > 0 && i.quantity <= i.low_stock_threshold;
    if (filter === 'out') return i.quantity === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111111]">Gestion des stocks</h1>
          <p className="text-xs text-neutral-500 mt-0.5 tabular-nums">
            {lowStockCount} variante(s) en stock faible · {outStockCount} variante(s) en rupture
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-neutral-100 border border-neutral-200 self-start">
          <button
            onClick={() => setTab('stock')}
            className={`px-3 py-1.5 text-xs font-medium ${tab === 'stock' ? 'bg-white text-[#111111] shadow-sm' : 'text-neutral-600'}`}
          >
            Niveaux de stock
          </button>
          <button
            onClick={() => setTab('movements')}
            className={`px-3 py-1.5 text-xs font-medium ${tab === 'movements' ? 'bg-white text-[#111111] shadow-sm' : 'text-neutral-600'}`}
          >
            Entrées & Sorties ({movements.length})
          </button>
        </div>
      </div>

      {tab === 'stock' ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-2 text-xs font-medium border ${
                filter === 'all' ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white border-neutral-300'
              }`}
            >
              Tout ({items.length})
            </button>
            <button
              onClick={() => setFilter('low')}
              className={`px-3.5 py-2 text-xs font-medium border ${
                filter === 'low' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-neutral-300 text-amber-700'
              }`}
            >
              Stock faible ({lowStockCount})
            </button>
            <button
              onClick={() => setFilter('out')}
              className={`px-3.5 py-2 text-xs font-medium border ${
                filter === 'out' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-neutral-300 text-red-600'
              }`}
            >
              Rupture de stock ({outStockCount})
            </button>
          </div>

          <div className="bg-white border border-neutral-200 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 bg-neutral-50">
                  <th className="py-3 px-4 font-medium">Produit</th>
                  <th className="py-3 px-4 font-medium">Taille</th>
                  <th className="py-3 px-4 font-medium">Couleur</th>
                  <th className="py-3 px-4 font-medium">État</th>
                  <th className="py-3 px-4 font-medium text-right">Quantité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-xs text-neutral-500">Chargement...</td>
                  </tr>
                ) : (
                  filteredItems.map((row) => (
                    <tr key={row.id} className="hover:bg-neutral-50">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          <SafeImage src={row.product_image} alt="" className="w-8 h-10 object-cover bg-neutral-100 shrink-0" />
                          <span className="font-medium text-[#111111]">{row.product_name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs">{row.size}</td>
                      <td className="py-2.5 px-4 text-xs text-neutral-600">{row.color_name}</td>
                      <td className="py-2.5 px-4 text-xs font-medium">
                        {row.quantity === 0 ? (
                          <span className="text-red-600">Rupture</span>
                        ) : row.quantity <= row.low_stock_threshold ? (
                          <span className="text-amber-600">Stock faible</span>
                        ) : (
                          <span className="text-emerald-700">Disponible</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center border border-neutral-300 bg-white">
                          <button
                            onClick={() => updateStock(row, row.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-neutral-100"
                            aria-label="Retirer 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-10 text-center text-xs font-semibold tabular-nums">{row.quantity}</span>
                          <button
                            onClick={() => updateStock(row, row.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-neutral-100"
                            aria-label="Ajouter 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white border border-neutral-200 overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 bg-neutral-50">
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Produit</th>
                <th className="py-3 px-4 font-medium">Variante</th>
                <th className="py-3 px-4 font-medium">Motif</th>
                <th className="py-3 px-4 font-medium text-right">Mouvement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-neutral-50 text-xs">
                  <td className="py-3 px-4 text-neutral-500 tabular-nums">{formatDateFr(m.created_at)}</td>
                  <td className="py-3 px-4 font-medium text-[#111111]">{m.product_name}</td>
                  <td className="py-3 px-4 text-neutral-600">{m.size} · {m.color_name}</td>
                  <td className="py-3 px-4 text-neutral-600">{m.reason}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                    <span className={`inline-flex items-center gap-1 ${m.quantity_delta >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {m.quantity_delta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
