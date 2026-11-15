import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, LogOut, Package, Settings, User as UserIcon } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { apiFetch, formatDateFr, formatMad, MOROCCO_CITIES } from '../lib/api';
import type { Order, Product } from '../types';
import { ProductCard } from '../components/ProductCard';

const ORDER_STEPS = ['En attente', 'Confirmée', 'En préparation', 'Expédiée', 'Livrée'];

export const AccountPage: React.FC = () => {
  const { user, authLoading, refreshUser, logout, notify } = useStore();
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [sectionTab, setSectionTab] = useState<'orders' | 'favorites' | 'profile'>('orders');

  // Auth forms
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('Casablanca');
  const [regPassword, setRegPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  // Account data
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCity, setProfileCity] = useState('Casablanca');
  const [profileAddress, setProfileAddress] = useState('');
  const [profilePostal, setProfilePostal] = useState('');

  useEffect(() => {
    if (user) {
      setProfileName(user.full_name || '');
      setProfilePhone(user.phone || '');
      setProfileCity(user.city || 'Casablanca');
      setProfileAddress(user.address || '');
      setProfilePostal(user.postal_code || '');

      apiFetch<Order[]>('/api/account/orders').then(setOrders).catch(() => {});
      apiFetch<Product[]>('/api/account/favorites').then(setFavorites).catch(() => {});
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSubmitting(true);
    try {
      await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      await refreshUser();
      notify('Connexion réussie.');
    } catch (err: any) {
      setAuthError(err.message || 'Identifiants invalides.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSubmitting(true);
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          city: regCity,
          password: regPassword,
        }),
      });
      await refreshUser();
      notify('Compte créé avec succès. Bienvenue chez CASA STYLE.');
    } catch (err: any) {
      setAuthError(err.message || 'Impossible de créer le compte.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/api/account/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: profileName,
          phone: profilePhone,
          city: profileCity,
          address: profileAddress,
          postal_code: profilePostal,
        }),
      });
      await refreshUser();
      notify('Vos informations ont été mises à jour.');
    } catch (err: any) {
      notify(err.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-[#111111]/60">
        Chargement de votre espace client...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-14 lg:py-20">
        <div className="border border-[#111111]/15 bg-white p-7 sm:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-[#B89B72] text-center mb-2">Espace Personnel</p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-center text-[#111111] mb-8">
            {authTab === 'login' ? 'Se connecter' : 'Créer un compte'}
          </h1>

          <div className="grid grid-cols-2 border-b border-[#111111]/10 mb-6">
            <button
              onClick={() => {
                setAuthTab('login');
                setAuthError('');
              }}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                authTab === 'login' ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#111111]/50'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => {
                setAuthTab('register');
                setAuthError('');
              }}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                authTab === 'register' ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#111111]/50'
              }`}
            >
              Créer un compte
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs text-red-700">{authError}</div>
          )}

          {authTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">
                  E-mail ou nom d’utilisateur
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="sara.bennani@casastyle.ma"
                  className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">Mot de passe</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-[#111111] hover:bg-[#B89B72] text-white text-xs font-semibold uppercase tracking-[0.16em] transition-colors"
              >
                {submitting ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">Nom complet</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ex : Salma El Mansouri"
                  className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">Adresse e-mail</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">Téléphone</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+212 6..."
                    className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">Ville</label>
                  <select
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#111111]/20 bg-white text-sm focus:outline-none focus:border-[#111111]"
                  >
                    {MOROCCO_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">
                  Mot de passe (min. 6 caractères)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-[#111111] hover:bg-[#B89B72] text-white text-xs font-semibold uppercase tracking-[0.16em] transition-colors"
              >
                {submitting ? 'Création...' : 'Créer mon compte'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <div className="pb-8 border-b border-[#111111]/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#B89B72] mb-1">Mon Espace Client</p>
          <h1 className="font-editorial text-4xl font-medium text-[#111111]">Bonjour, {user.full_name}</h1>
          <p className="text-sm text-[#111111]/65 mt-1">{user.email}</p>
        </div>

        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <Link
              to="/admin"
              className="px-4 py-2.5 bg-[#B89B72] text-white text-xs font-semibold uppercase tracking-wider"
            >
              Tableau de bord Admin
            </Link>
          )}
          <button
            onClick={logout}
            className="px-4 py-2.5 border border-[#111111]/20 text-xs font-medium uppercase tracking-wider hover:bg-[#111111] hover:text-white transition-colors inline-flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[#111111]/10 mt-6 mb-8 overflow-x-auto">
        <button
          onClick={() => setSectionTab('orders')}
          className={`pb-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center gap-2 whitespace-nowrap ${
            sectionTab === 'orders' ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#111111]/55'
          }`}
        >
          <Package className="w-4 h-4" />
          Mes commandes ({orders.length})
        </button>
        <button
          onClick={() => setSectionTab('favorites')}
          className={`pb-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center gap-2 whitespace-nowrap ${
            sectionTab === 'favorites' ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#111111]/55'
          }`}
        >
          <Heart className="w-4 h-4" />
          Mes favoris ({favorites.length})
        </button>
        <button
          onClick={() => setSectionTab('profile')}
          className={`pb-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center gap-2 whitespace-nowrap ${
            sectionTab === 'profile' ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#111111]/55'
          }`}
        >
          <Settings className="w-4 h-4" />
          Mes informations
        </button>
      </div>

      {/* Orders Tab */}
      {sectionTab === 'orders' && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="py-16 text-center border border-[#111111]/10 bg-[#F5F5F5]/50">
              <p className="font-editorial text-2xl mb-2">Aucune commande enregistrée</p>
              <Link to="/boutique" className="text-xs font-semibold uppercase tracking-wider underline">
                Découvrir la collection
              </Link>
            </div>
          ) : (
            orders.map((order) => {
              const currentStepIdx = ORDER_STEPS.indexOf(order.status);
              return (
                <div key={order.id} className="border border-[#111111]/15 bg-white p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#111111]/10">
                    <div>
                      <p className="font-mono text-sm font-semibold text-[#111111]">
                        {order.order_number}
                        {order.is_demo === 1 && (
                          <span className="ml-2 text-[11px] font-sans font-normal text-[#111111]/50">
                            · Commande démo
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[#111111]/60 mt-0.5">
                        Passée le {formatDateFr(order.created_at)} · {order.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold tabular-nums">{formatMad(order.total_mad)}</p>
                      <p className="text-xs font-medium text-[#B89B72]">{order.status}</p>
                    </div>
                  </div>

                  {order.status !== 'Annulée' && (
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {ORDER_STEPS.map((step, idx) => {
                        const done = idx <= currentStepIdx;
                        return (
                          <div key={step} className="space-y-1.5">
                            <div className={`h-1 ${done ? 'bg-[#B89B72]' : 'bg-[#111111]/10'}`} />
                            <p className={`text-[11px] truncate ${done ? 'text-[#111111] font-medium' : 'text-[#111111]/40'}`}>
                              {step}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-[#111111]/70">
                    <span>
                      {(order.items || []).map((i) => `${i.product_name} (${i.size}) ×${i.quantity}`).join(', ')}
                    </span>
                    <Link
                      to={`/commande/confirmation/${order.order_number}`}
                      className="font-semibold text-[#111111] hover:text-[#B89B72] underline"
                    >
                      Voir le reçu
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Favorites Tab */}
      {sectionTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <div className="py-16 text-center border border-[#111111]/10 bg-[#F5F5F5]/50">
              <p className="font-editorial text-2xl mb-2">Aucun favori enregistré</p>
              <Link to="/boutique" className="text-xs font-semibold uppercase tracking-wider underline">
                Parcourir le catalogue
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {favorites.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {sectionTab === 'profile' && (
        <form onSubmit={handleProfileSave} className="max-w-xl space-y-4 border border-[#111111]/15 p-6 bg-white">
          <div className="flex items-center gap-2 pb-3 border-b border-[#111111]/10">
            <UserIcon className="w-4 h-4 text-[#B89B72]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Modifier mes informations</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">Nom complet</label>
            <input
              type="text"
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">Téléphone</label>
              <input
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">Ville</label>
              <select
                value={profileCity}
                onChange={(e) => setProfileCity(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#111111]/20 bg-white text-sm focus:outline-none focus:border-[#111111]"
              >
                {MOROCCO_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">Adresse complète</label>
            <input
              type="text"
              value={profileAddress}
              onChange={(e) => setProfileAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111111]/80 mb-1.5">Code postal</label>
            <input
              type="text"
              value={profilePostal}
              onChange={(e) => setProfilePostal(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-[#111111] hover:bg-[#B89B72] text-white text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      )}
    </div>
  );
};
