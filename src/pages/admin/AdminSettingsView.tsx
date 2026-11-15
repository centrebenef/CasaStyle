import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { useStore } from '../../context/StoreContext';
import type { SiteSettings } from '../../types';

export const AdminSettingsView: React.FC = () => {
  const { settings, refreshSettings, notify } = useStore();
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleChange = (key: keyof SiteSettings, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      await refreshSettings();
      notify('Paramètres de la boutique enregistrés et publiés.');
    } catch (err: any) {
      notify(err.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-[#111111]">Paramètres du site</h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Ces informations sont reflétées immédiatement sur l’en-tête, le panier et le pied de page de la boutique.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-neutral-200 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Nom de la boutique</label>
            <input
              type="text"
              value={form.store_name}
              onChange={(e) => handleChange('store_name', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Texte du logo</label>
            <input
              type="text"
              value={form.logo_text}
              onChange={(e) => handleChange('logo_text', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Slogan</label>
          <input
            type="text"
            value={form.slogan}
            onChange={(e) => handleChange('slogan', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Téléphone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">E-mail de contact</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Adresse showroom (Casablanca)</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-200">
          <div>
            <label className="block text-xs font-medium mb-1">Livraison Casablanca (DH)</label>
            <input
              type="number"
              value={form.shipping_casablanca_mad}
              onChange={(e) => handleChange('shipping_casablanca_mad', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Autres villes Maroc (DH)</label>
            <input
              type="number"
              value={form.shipping_other_mad}
              onChange={(e) => handleChange('shipping_other_mad', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Seuil livraison gratuite (DH)</label>
            <input
              type="number"
              value={form.free_shipping_threshold_mad}
              onChange={(e) => handleChange('free_shipping_threshold_mad', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 text-sm tabular-nums"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-200">
          <div>
            <label className="block text-xs font-medium mb-1">Instagram URL</label>
            <input
              type="text"
              value={form.instagram_url}
              onChange={(e) => handleChange('instagram_url', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Facebook URL</label>
            <input
              type="text"
              value={form.facebook_url}
              onChange={(e) => handleChange('facebook_url', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">TikTok URL</label>
            <input
              type="text"
              value={form.tiktok_url}
              onChange={(e) => handleChange('tiktok_url', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Texte de présentation (Footer)</label>
          <textarea
            rows={2}
            value={form.footer_text}
            onChange={(e) => handleChange('footer_text', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 text-sm"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#111111] hover:bg-[#B89B72] text-white text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </form>
    </div>
  );
};
