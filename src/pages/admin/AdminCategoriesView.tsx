import React, { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2, Upload, X } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { Category } from '../../types';
import { useStore } from '../../context/StoreContext';
import { SafeImage } from '../../components/SafeImage';

export const AdminCategoriesView: React.FC = () => {
  const { notify } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'femme' | 'homme'>('femme');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const load = async () => {
    const data = await apiFetch<Category[]>('/api/admin/categories');
    setCategories(data);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setGender('femme');
    setDescription('');
    setImageUrl('/src/assets/images/accessoires_atelier_1794761391155.jpg');
    setSortOrder('1');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setGender(c.gender === 'homme' ? 'homme' : 'femme');
    setDescription(c.description);
    setImageUrl(c.image_url);
    setSortOrder(String(c.sort_order));
    setIsActive(c.is_active === 1);
    setModalOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('images', file);
    try {
      const res = await apiFetch<{ urls: string[] }>('/api/admin/upload', { method: 'POST', body: fd });
      if (res.urls[0]) setImageUrl(res.urls[0]);
      notify('Image téléversée.');
    } catch (err: any) {
      notify(err.message || 'Erreur upload', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: name.trim(),
        gender,
        description: description.trim(),
        image_url: imageUrl.trim(),
        sort_order: Number(sortOrder || 0),
        is_active: isActive ? 1 : 0,
      };
      if (editing) {
        await apiFetch(`/api/admin/categories/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        notify('Catégorie mise à jour.');
      } else {
        await apiFetch('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        notify('Catégorie ajoutée.');
      }
      setModalOpen(false);
      await load();
    } catch (err: any) {
      notify(err.message || 'Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleDelete = async (c: Category) => {
    try {
      await apiFetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' });
      notify(`Catégorie "${c.name}" supprimée.`);
      await load();
    } catch (err: any) {
      notify(err.message || 'Impossible de supprimer cette catégorie', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111111]">Gestion des catégories</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Collections Femme et Homme</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 bg-[#111111] hover:bg-[#B89B72] text-white text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle catégorie
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <div key={c.id} className="bg-white border border-neutral-200 p-4 flex gap-4 items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <SafeImage src={c.image_url} alt={c.name} className="w-14 h-16 object-cover bg-neutral-100 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-[#B89B72] font-semibold">{c.gender}</p>
                <p className="text-sm font-semibold text-[#111111] truncate">{c.name}</p>
                <p className="text-xs text-neutral-500 tabular-nums">{c.product_count ?? 0} produit(s)</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => openEdit(c)} className="p-2 text-neutral-600 hover:text-[#111111]" aria-label="Modifier">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(c)} className="p-2 text-neutral-500 hover:text-red-600" aria-label="Supprimer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-lg border border-neutral-200 shadow-2xl">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
              <button onClick={() => setModalOpen(false)} aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Collection *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'femme' | 'homme')}
                    className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm"
                  >
                    <option value="femme">Femme</option>
                    <option value="homme">Homme</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Image de catégorie</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-neutral-300 text-xs"
                  />
                  <label className="px-3 py-2 border border-neutral-300 bg-neutral-50 text-xs cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Importer
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-medium mb-1">Ordre d’affichage</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm tabular-nums"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-xs pt-4">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  Catégorie active
                </label>
              </div>

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
