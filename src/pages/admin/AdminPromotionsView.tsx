import React, { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import { apiFetch, formatMad } from '../../lib/api';
import type { Product, Promotion } from '../../types';
import { useStore } from '../../context/StoreContext';

export const AdminPromotionsView: React.FC = () => {
  const { notify } = useStore();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [productId, setProductId] = useState('');
  const [discountPct, setDiscountPct] = useState('15');
  const [promoPrice, setPromoPrice] = useState('');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [isActive, setIsActive] = useState(true);

  const load = async () => {
    const [pr, pd] = await Promise.all([
      apiFetch<Promotion[]>('/api/admin/promotions'),
      apiFetch<Product[]>('/api/admin/products'),
    ]);
    setPromos(pr);
    setProducts(pd);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setProductId(products[0] ? String(products[0].id) : '');
    setDiscountPct('15');
    setPromoPrice('');
    setStartDate('2026-11-01');
    setEndDate('2026-12-31');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (pr: Promotion) => {
    setEditing(pr);
    setTitle(pr.title);
    setDescription(pr.description);
    setProductId(pr.product_id ? String(pr.product_id) : '');
    setDiscountPct(String(pr.discount_percent));
    setPromoPrice(pr.promo_price_mad ? String(pr.promo_price_mad) : '');
    setStartDate(pr.start_date);
    setEndDate(pr.end_date);
    setIsActive(pr.is_active === 1);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        product_id: productId ? Number(productId) : null,
        discount_percent: Number(discountPct || 0),
        promo_price_mad: promoPrice ? Number(promoPrice) : null,
        start_date: startDate,
        end_date: endDate,
        is_active: isActive ? 1 : 0,
      };
      if (editing) {
        await apiFetch(`/api/admin/promotions/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        notify('Promotion mise à jour.');
      } else {
        await apiFetch('/api/admin/promotions', { method: 'POST', body: JSON.stringify(payload) });
        notify('Promotion créée et appliquée à la boutique.');
      }
      setModalOpen(false);
      await load();
    } catch (err: any) {
      notify(err.message || 'Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/api/admin/promotions/${id}`, { method: 'DELETE' });
      notify('Promotion supprimée.');
      await load();
    } catch (err: any) {
      notify(err.message || 'Erreur', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111111]">Gestion des promotions</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Les remises actives s’affichent immédiatement sur la boutique</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 bg-[#111111] hover:bg-[#B89B72] text-white text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle promotion
        </button>
      </div>

      <div className="bg-white border border-neutral-200 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 bg-neutral-50">
              <th className="py-3 px-4 font-medium">Opération</th>
              <th className="py-3 px-4 font-medium">Produit ciblé</th>
              <th className="py-3 px-4 font-medium text-right">Remise</th>
              <th className="py-3 px-4 font-medium text-right">Prix promo</th>
              <th className="py-3 px-4 font-medium">Période</th>
              <th className="py-3 px-4 font-medium">Statut</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {promos.map((pr) => (
              <tr key={pr.id} className="hover:bg-neutral-50">
                <td className="py-3 px-4">
                  <p className="font-medium text-[#111111]">{pr.title}</p>
                  <p className="text-xs text-neutral-500">{pr.description}</p>
                </td>
                <td className="py-3 px-4 text-xs text-neutral-600">{pr.product_name || 'Catalogue général'}</td>
                <td className="py-3 px-4 text-right font-semibold tabular-nums text-[#B89B72]">-{pr.discount_percent}%</td>
                <td className="py-3 px-4 text-right tabular-nums">
                  {pr.promo_price_mad ? formatMad(pr.promo_price_mad) : 'Automatique'}
                </td>
                <td className="py-3 px-4 text-xs text-neutral-500 tabular-nums">
                  {pr.start_date} → {pr.end_date}
                </td>
                <td className="py-3 px-4 text-xs">
                  <span className={pr.is_active ? 'text-emerald-700 font-medium' : 'text-neutral-400'}>
                    {pr.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button onClick={() => openEdit(pr)} className="p-1.5 text-neutral-600 hover:text-[#111111]" aria-label="Modifier">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(pr.id)} className="p-1.5 text-neutral-500 hover:text-red-600" aria-label="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-lg border border-neutral-200 shadow-2xl">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? 'Modifier la promotion' : 'Créer une promotion'}</h2>
              <button onClick={() => setModalOpen(false)} aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Titre de la promotion *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Produit associé</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm"
                >
                  <option value="">— Aucun produit spécifique —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatMad(p.price_mad)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Remise (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Prix promotionnel (DH)</label>
                  <input
                    type="number"
                    value={promoPrice}
                    onChange={(e) => setPromoPrice(e.target.value)}
                    placeholder="Calculé auto si vide"
                    className="w-full px-3 py-2 border border-neutral-300 text-sm tabular-nums"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Date de début *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Date de fin *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm"
                  />
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-xs">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Promotion active sur la boutique
              </label>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-neutral-300 text-xs">
                  Annuler
                </button>
                <button type="submit" className="px-6 py-2 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
