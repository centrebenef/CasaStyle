import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { apiFetch } from '../../lib/api';
import { AdminDashboardView } from './AdminDashboardView';
import { AdminProductsView } from './AdminProductsView';
import { AdminCategoriesView } from './AdminCategoriesView';
import { AdminOrdersView } from './AdminOrdersView';
import { AdminCustomersView } from './AdminCustomersView';
import { AdminInventoryView } from './AdminInventoryView';
import { AdminPromotionsView } from './AdminPromotionsView';
import { AdminSettingsView } from './AdminSettingsView';

type AdminSection =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'inventory'
  | 'promotions'
  | 'settings';

const MENU_ITEMS: Array<{ id: AdminSection; label: string; icon: React.ComponentType<any> }> = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'products', label: 'Produits', icon: Package },
  { id: 'categories', label: 'Catégories', icon: FolderTree },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart },
  { id: 'customers', label: 'Clients', icon: Users },
  { id: 'inventory', label: 'Stocks', icon: Boxes },
  { id: 'promotions', label: 'Promotions', icon: Percent },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

export const AdminPage: React.FC = () => {
  const { user, authLoading, refreshUser, logout, notify } = useStore();
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin Login state (never pre-fill or expose password!)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setSubmitting(true);
    try {
      const res = await apiFetch<{ user: { role: string } }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: username.trim(), password }),
      });
      if (res.user.role !== 'admin') {
        setLoginError('Ce compte ne dispose pas des droits administrateur.');
        return;
      }
      await refreshUser();
      notify('Connexion administrateur réussie.');
    } catch (err: any) {
      setLoginError(err.message || 'Identifiants administrateur invalides.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center text-sm text-neutral-500">
        Vérification de session...
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-neutral-200 p-8 sm:p-10 shadow-sm">
          <div className="text-center mb-8">
            <Lock className="w-7 h-7 text-[#B89B72] mx-auto mb-3" strokeWidth={1.5} />
            <p className="font-editorial text-2xl font-semibold tracking-[0.14em] text-[#111111]">
              CASA STYLE
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 mt-1">
              Console Administration
            </p>
          </div>

          {user && user.role !== 'admin' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-xs text-amber-800">
              Vous êtes actuellement connecté(e) en tant que client. Connectez-vous avec un compte administrateur.
            </div>
          )}

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs text-red-700">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Nom d’utilisateur
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Identifiant administrateur"
                className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm focus:outline-none focus:border-[#111111]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#111111] hover:bg-[#B89B72] text-white text-xs font-semibold uppercase tracking-[0.16em] transition-colors"
            >
              {submitting ? 'Authentification...' : 'Accéder au tableau de bord'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-neutral-200 text-center">
            <Link to="/" className="text-xs text-neutral-500 hover:text-[#111111]">
              ← Retour à la boutique en ligne
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentItem = MENU_ITEMS.find((m) => m.id === section)!;

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#111111] text-white flex-col justify-between shrink-0 no-print">
        <div>
          <div className="px-6 py-6 border-b border-white/10">
            <p className="font-editorial text-2xl font-semibold tracking-[0.14em]">CASA STYLE</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#B89B72] mt-0.5">Administration</p>
          </div>

          <nav className="p-3 space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium transition-colors text-left ${
                    active ? 'bg-white text-[#111111]' : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            to="/"
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-white/75 hover:text-white border border-white/15"
          >
            <span>Voir la boutique</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:text-white"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-64 bg-[#111111] text-white h-full flex flex-col justify-between z-10">
            <div>
              <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
                <span className="font-editorial text-xl font-semibold tracking-[0.14em]">CASA STYLE</span>
                <button onClick={() => setMobileMenuOpen(false)} aria-label="Fermer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-3 space-y-1">
                {MENU_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = section === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSection(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-left ${
                        active ? 'bg-white text-[#111111]' : 'text-white/75'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="p-4 border-t border-white/10">
              <button onClick={logout} className="flex items-center gap-2 text-xs text-white/75">
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-neutral-200 px-4 sm:px-8 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[#111111]"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-xs text-neutral-500 flex items-center gap-2">
              <span>Admin</span>
              <span>/</span>
              <span className="font-semibold text-[#111111]">{currentItem.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="hidden sm:inline text-neutral-600">{user.full_name}</span>
            <Link
              to="/"
              className="px-3 py-1.5 border border-neutral-300 text-[#111111] hover:bg-neutral-100 whitespace-nowrap"
            >
              Boutique
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {section === 'dashboard' && <AdminDashboardView />}
          {section === 'products' && <AdminProductsView />}
          {section === 'categories' && <AdminCategoriesView />}
          {section === 'orders' && <AdminOrdersView />}
          {section === 'customers' && <AdminCustomersView />}
          {section === 'inventory' && <AdminInventoryView />}
          {section === 'promotions' && <AdminPromotionsView />}
          {section === 'settings' && <AdminSettingsView />}
        </main>
      </div>
    </div>
  );
};
