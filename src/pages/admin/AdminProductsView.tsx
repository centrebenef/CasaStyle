import React, { useEffect, useState } from 'react';
import { Edit2, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { apiFetch, formatMad } from '../../lib/api';
import type { Category, Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { SafeImage } from '../../components/SafeImage';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const AdminProductsView: React.FC = () => {
  const { notify } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'femme' | 'homme'>('all');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [gender, setGender] = useState<'femme' | 'homme'>('femme');
  const [priceMad, setPriceMad] = useState('');
  const [oldPriceMad, setOldPriceMad] = useState('');
  const [description, setDescription] = useState('');
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L']);
  const [colors, setColors] = useState<Array<{ color_name: string; color_hex: string }>>([
    { color_name: 'Noir', color_hex: '#111111' },
  ]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#B89B72');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [stockOverride, setStockOverride] = useState('10');
  const [isNew, setIsNew] = useState(true);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isPromo, setIsPromo] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        apiFetch<Product[]>('/api/admin/products'),
        apiFetch<Category[]>('/api/admin/categories'),
      ]);
      setProducts(prods);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditing(null);
    setName('');
    setGender('femme');
    const firstCat = categories.find((c) => c.gender === 'femme') || categories[0];
    setCategoryId(firstCat?.id || 0);
    setPriceMad('');
    setOldPriceMad('');
    setDescription('');
    setSizes(['S', 'M', 'L']);
    setColors([{ color_name: 'Noir', color_hex: '#111111' }]);
    setImages(['/src/assets/images/femme_blazer_noir_1794761388257.jpg']);
    setStockOverride('10');
    setIsNew(true);
    setIsBestseller(false);
    setIsPromo(false);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditing(p);
    setName(p.name);
    setGender(p.gender);
    setCategoryId(p.category_id);
    setPriceMad(String(p.price_mad));
    setOldPriceMad(p.old_price_mad ? String(p.old_price_mad) : '');
    setDescription(p.description);
    setSizes(p.sizes || ['M']);
    setColors(p.colors?.map((c) => ({ color_name: c.color_name, color_hex: c.color_hex })) || []);
    setImages(p.images?.map((i) => i.image_url) || []);
    setStockOverride('');
    setIsNew(p.is_new === 1);
    setIsBestseller(p.is_bestseller === 1);
    setIsPromo(p.is_promo === 1);
    setIsActive(p.is_active === 1);
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('images', f));
      const res = await apiFetch<{ urls: string[] }>('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      setImages((prev) => [...prev, ...res.urls]);
      notify(`${res.urls.length} photo(s) téléversée(s).`);
    } catch (err: any) {
      notify(err.message || 'Erreur lors du téléversement', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || !priceMad) {
      notify('Veuillez remplir le nom, la catégorie et le prix.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category_id: categoryId,
        gender,
        price_mad: Number(priceMad),
        old_price_mad: oldPriceMad ? Number(oldPriceMad) : null,
        description: description.trim(),
        sizes,
        colors,
        images,
        is_new: isNew ? 1 : 0,
        is_bestseller: isBestseller ? 1 : 0,
        is_promo: isPromo ? 1 : 0,
        is_active: isActive ? 1 : 0,
        ...(editing
          ? stockOverride !== ''
            ? { stock_override: Number(stockOverride) }
            : {}
          : { initial_stock: Number(stockOverride || 10) }),
      };

      if (editing) {
        await apiFetch(`/api/admin/products/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        notify('Produit mis à jour.');
      } else {
        await apiFetch('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        notify('Nouveau produit ajouté au catalogue.');
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      notify(err.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    try {
      await apiFetch(`/api/admin/products/${p.id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
      notify(`"${p.name}" supprimé.`);
    } catch (err: any) {
      notify(err.message || 'Impossible de supprimer', 'error');
    }
  };

  const handleToggle = async (p: Product, field: 'is_active' | 'is_new' | 'is_promo') => {
    try {
      await apiFetch(`/api/admin/products/${p.id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ field }),
      });
      await loadData();
      notify('Statut mis à jour.');
    } catch (err: any) {
      notify(err.message || 'Erreur', 'error');
    }
  };

  const filtered = products.filter((p) => {
    if (genderFilter !== 'all' && p.gender !== genderFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.category_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111111]">Gestion des produits</h1>
          <p className="text-xs text-neutral-500 mt-0.5 tabular-nums">
            {products.length} produits enregistrés en base de données
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-[#111111] hover:bg-[#B89B72] text-white text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          Ajouter un produit
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white border border-neutral-200 p-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou catégorie..."
            className="w-full pl-9 pr-3 py-2 border border-neutral-200 text-sm focus:outline-none focus:border-[#111111]"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-neutral-100">
          {(['all', 'femme', 'homme'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                genderFilter === g ? 'bg-white text-[#111111] shadow-sm' : 'text-neutral-600'
              }`}
            >
              {g === 'all' ? 'Tous' : g}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 bg-neutral-50">
              <th className="py-3 px-4 font-medium">Produit</th>
              <th className="py-3 px-4 font-medium">Catégorie</th>
              <th className="py-3 px-4 font-medium text-right">Prix</th>
              <th className="py-3 px-4 font-medium text-right">Stock</th>
              <th className="py-3 px-4 font-medium">Visibilité & Tags</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-neutral-500">
                  Chargement des produits...
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <SafeImage
                        src={p.images?.[0]?.image_url}
                        alt={p.name}
                        className="w-10 h-12 object-cover bg-neutral-100 shrink-0"
                      />
                      <div>
                        <p className="font-medium text-[#111111]">{p.name}</p>
                        <p className="text-xs text-neutral-500 capitalize">
                          {p.gender} · {p.sizes.join(', ')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-neutral-600">{p.category_name}</td>
                  <td className="py-3 px-4 text-right tabular-nums">
                    <span className="font-semibold">{formatMad(p.price_mad)}</span>
                    {p.old_price_mad && (
                      <span className="block text-xs text-neutral-400 line-through">
                        {formatMad(p.old_price_mad)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">
                    <span
                      className={`text-xs font-semibold ${
                        p.total_stock === 0
                          ? 'text-red-600'
                          : p.total_stock <= 10
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {p.total_stock}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() => handleToggle(p, 'is_active')}
                        className={`px-2 py-1 border ${
                          p.is_active ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-neutral-300 text-neutral-500'
                        }`}
                      >
                        {p.is_active ? 'Actif' : 'Masqué'}
                      </button>
                      <button
                        onClick={() => handleToggle(p, 'is_new')}
                        className={`px-2 py-1 border ${
                          p.is_new ? 'border-[#111111] text-[#111111] bg-neutral-100' : 'border-neutral-200 text-neutral-400'
                        }`}
                      >
                        Nouveau
                      </button>
                      <button
                        onClick={() => handleToggle(p, 'is_promo')}
                        className={`px-2 py-1 border ${
                          p.is_promo ? 'border-[#B89B72] text-[#B89B72] bg-[#EDE5D8]/40' : 'border-neutral-200 text-neutral-400'
                        }`}
                      >
                        Promo
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-neutral-600 hover:text-[#111111]"
                        aria-label="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-1.5 text-neutral-500 hover:text-red-600"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-neutral-200 shadow-2xl">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-neutral-200 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-[#111111]">
                {editing ? `Modifier : ${editing.name}` : 'Nouveau produit'}
              </h2>
              <button onClick={() => setModalOpen(false)} aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Nom du produit *</label>
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
                    onChange={(e) => {
                      const g = e.target.value as 'femme' | 'homme';
                      setGender(g);
                      const first = categories.find((c) => c.gender === g);
                      if (first) setCategoryId(first.id);
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm"
                  >
                    <option value="femme">Femme</option>
                    <option value="homme">Homme</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Catégorie *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm"
                  >
                    {categories
                      .filter((c) => c.gender === gender)
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Prix (DH) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={priceMad}
                    onChange={(e) => setPriceMad(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Ancien prix (DH)</label>
                  <input
                    type="number"
                    value={oldPriceMad}
                    onChange={(e) => setOldPriceMad(e.target.value)}
                    placeholder="Optionnel"
                    className="w-full px-3 py-2 border border-neutral-300 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Description détaillée</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 text-sm"
                />
              </div>

              {/* Images */}
              <div className="space-y-2">
                <label className="block text-xs font-medium">Photos du produit</label>
                <div className="flex flex-wrap gap-3">
                  {images.map((url, idx) => (
                    <div key={`${url}-${idx}`} className="relative w-16 h-20 border border-neutral-200 bg-neutral-50">
                      <SafeImage src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-[#111111] text-white rounded-full flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-20 border border-dashed border-neutral-400 flex flex-col items-center justify-center text-[10px] text-neutral-600 cursor-pointer hover:border-[#111111]">
                    <Upload className="w-4 h-4 mb-1" />
                    <span>{uploading ? '...' : 'Importer'}</span>
                    <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Ou coller une URL d’image (/uploads/... ou https://...)"
                    className="flex-1 px-3 py-1.5 border border-neutral-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!imageUrlInput.trim()) return;
                      setImages((prev) => [...prev, imageUrlInput.trim()]);
                      setImageUrlInput('');
                    }}
                    className="px-3 py-1.5 bg-neutral-100 border border-neutral-300 text-xs font-medium"
                  >
                    Ajouter URL
                  </button>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <label className="block text-xs font-medium mb-1.5">Tailles disponibles</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((s) => {
                    const checked = sizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setSizes((prev) =>
                            checked ? prev.filter((x) => x !== s) : [...prev, s]
                          )
                        }
                        className={`px-3 py-1.5 text-xs font-medium border ${
                          checked ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-neutral-700 border-neutral-300'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <label className="block text-xs font-medium">Couleurs disponibles</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-neutral-300 text-xs">
                      <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: c.color_hex }} />
                      {c.color_name}
                      <button
                        type="button"
                        onClick={() => setColors((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-neutral-400 hover:text-red-600 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    placeholder="Nom couleur (ex: Beige Sable)"
                    className="flex-1 px-3 py-1.5 border border-neutral-300 text-xs"
                  />
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-9 h-8 border border-neutral-300 p-0.5 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newColorName.trim()) return;
                      setColors((prev) => [...prev, { color_name: newColorName.trim(), color_hex: newColorHex }]);
                      setNewColorName('');
                    }}
                    className="px-3 py-1.5 bg-neutral-100 border border-neutral-300 text-xs font-medium"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Stock & Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-200">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {editing ? 'Redéfinir le stock par variante (optionnel)' : 'Stock initial par variante'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={stockOverride}
                    onChange={(e) => setStockOverride(e.target.value)}
                    placeholder={editing ? 'Laisser vide pour conserver' : '10'}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm tabular-nums"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-5 text-xs">
                  <label className="inline-flex items-center gap-1.5">
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                    Actif
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
                    Nouveauté
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input type="checkbox" checked={isBestseller} onChange={(e) => setIsBestseller(e.target.checked)} />
                    Best-seller
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input type="checkbox" checked={isPromo} onChange={(e) => setIsPromo(e.target.checked)} />
                    Promotion
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-xs font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#111111] hover:bg-[#B89B72] text-white text-xs font-semibold uppercase tracking-wider"
                >
                  {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer le produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
