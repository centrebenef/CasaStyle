import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Box, Clock, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { apiFetch, formatDateFr, formatMad } from '../../lib/api';
import type { InventoryMovement, Order } from '../../types';
import { SafeImage } from '../../components/SafeImage';

interface DashboardData {
  kpis: {
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    revenueMad: number;
    pendingOrders: number;
    outOfStockProducts: number;
  };
  monthlySales: Array<{ month: string; revenue: number; orders_count: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  topProducts: Array<{
    product_id: number;
    product_name: string;
    product_image: string;
    units_sold: number;
    total_revenue: number;
  }>;
  latestOrders: Order[];
  recentActivity: InventoryMovement[];
}

export const AdminDashboardView: React.FC = () => {
  const [mode, setMode] = useState<'all' | 'real'>('all');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<DashboardData>(`/api/admin/dashboard?mode=${mode}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [mode]);

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-neutral-200 p-5" />
          ))}
        </div>
        <div className="h-72 bg-white border border-neutral-200" />
      </div>
    );
  }

  const maxRev = Math.max(1, ...data.monthlySales.map((m) => m.revenue));
  const totalStatusCount = Math.max(1, data.ordersByStatus.reduce((s, x) => s + x.count, 0));

  const kpiCards = [
    { label: 'Chiffre d’affaires', value: formatMad(data.kpis.revenueMad), icon: TrendingUp, accent: 'text-[#B89B72]' },
    { label: 'Total commandes', value: String(data.kpis.totalOrders), icon: ShoppingBag, accent: 'text-[#111111]' },
    { label: 'Commandes en attente', value: String(data.kpis.pendingOrders), icon: Clock, accent: 'text-amber-600' },
    { label: 'Clients enregistrés', value: String(data.kpis.totalCustomers), icon: Users, accent: 'text-[#111111]' },
    { label: 'Produits au catalogue', value: String(data.kpis.totalProducts), icon: Box, accent: 'text-[#111111]' },
    { label: 'Produits en rupture', value: String(data.kpis.outOfStockProducts), icon: AlertTriangle, accent: 'text-red-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Data Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111111]">Vue d’ensemble</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {mode === 'all'
              ? 'Inclut les données de démonstration et les ventes réelles.'
              : 'Ventes et clients réels uniquement (hors données de démonstration).'}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-neutral-100 border border-neutral-200 self-start">
          <button
            onClick={() => setMode('all')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              mode === 'all' ? 'bg-white text-[#111111] shadow-sm' : 'text-neutral-600'
            }`}
          >
            Tout (Démo + Réel)
          </button>
          <button
            onClick={() => setMode('real')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              mode === 'real' ? 'bg-white text-[#111111] shadow-sm' : 'text-neutral-600'
            }`}
          >
            Ventes réelles uniquement
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white border border-neutral-200 p-5 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-500">{k.label}</p>
                <p className="text-2xl font-semibold text-[#111111] tabular-nums mt-2">{k.value}</p>
              </div>
              <Icon className={`w-5 h-5 ${k.accent}`} strokeWidth={1.75} />
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Sales Bar Chart */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-[#111111]">Ventes par mois (DH)</h2>
              <p className="text-xs text-neutral-500">Évolution mensuelle du chiffre d’affaires</p>
            </div>
          </div>

          {data.monthlySales.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-neutral-500">
              Aucune donnée de vente pour ce filtre.
            </div>
          ) : (
            <div className="h-56 flex items-end gap-4 pt-6 border-b border-neutral-200">
              {data.monthlySales.map((m) => {
                const heightPct = Math.max(8, Math.round((m.revenue / maxRev) * 100));
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[11px] font-mono text-neutral-600 tabular-nums">
                      {Math.round(m.revenue).toLocaleString('fr-MA')}
                    </span>
                    <div
                      className="w-full max-w-[48px] bg-[#111111] group-hover:bg-[#B89B72] transition-colors"
                      style={{ height: `${heightPct}%` }}
                      title={`${m.month} : ${formatMad(m.revenue)} (${m.orders_count} cmd)`}
                    />
                    <span className="text-[11px] text-neutral-500 pb-1 font-mono">{m.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Orders by Status */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 p-6">
          <h2 className="text-sm font-semibold text-[#111111] mb-1">Commandes par statut</h2>
          <p className="text-xs text-neutral-500 mb-6">Répartition des dossiers en cours</p>

          {data.ordersByStatus.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-neutral-500">
              Aucune commande enregistrée.
            </div>
          ) : (
            <div className="space-y-4">
              {data.ordersByStatus.map((s) => {
                const pct = Math.round((s.count / totalStatusCount) * 100);
                return (
                  <div key={s.status} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#111111]">{s.status}</span>
                      <span className="tabular-nums text-neutral-500">
                        {s.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 overflow-hidden">
                      <div
                        className={`h-full ${
                          s.status === 'Livrée'
                            ? 'bg-emerald-600'
                            : s.status === 'Annulée'
                            ? 'bg-red-500'
                            : 'bg-[#B89B72]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grids: Top Products + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-6 bg-white border border-neutral-200 p-6">
          <h2 className="text-sm font-semibold text-[#111111] mb-4">Produits les plus vendus</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-xs text-neutral-500 py-6">Aucune vente enregistrée.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {data.topProducts.map((tp) => (
                <div key={tp.product_name} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <SafeImage
                      src={tp.product_image}
                      alt={tp.product_name}
                      className="w-10 h-12 object-cover bg-neutral-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#111111] truncate">{tp.product_name}</p>
                      <p className="text-xs text-neutral-500 tabular-nums">{tp.units_sold} unité(s) vendue(s)</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-[#111111] shrink-0">
                    {formatMad(tp.total_revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-6 bg-white border border-neutral-200 p-6">
          <h2 className="text-sm font-semibold text-[#111111] mb-4">Activité récente des stocks</h2>
          <div className="divide-y divide-neutral-100">
            {data.recentActivity.map((act) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  {act.quantity_delta >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-[#111111] truncate">
                      {act.product_name} ({act.size} / {act.color_name})
                    </p>
                    <p className="text-neutral-500 truncate">{act.reason}</p>
                  </div>
                </div>
                <span
                  className={`font-mono font-semibold tabular-nums shrink-0 ${
                    act.quantity_delta >= 0 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {act.quantity_delta > 0 ? `+${act.quantity_delta}` : act.quantity_delta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Latest Orders */}
      <div className="bg-white border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-sm font-semibold text-[#111111]">Dernières commandes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 bg-neutral-50">
                <th className="py-3 px-4 font-medium">N° Commande</th>
                <th className="py-3 px-4 font-medium">Client</th>
                <th className="py-3 px-4 font-medium">Ville</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Statut</th>
                <th className="py-3 px-4 font-medium text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.latestOrders.map((o) => (
                <tr key={o.id} className="hover:bg-neutral-50">
                  <td className="py-3 px-4 font-mono text-xs font-semibold">
                    {o.order_number}
                    {o.is_demo === 1 && (
                      <span className="ml-2 text-[10px] font-sans text-neutral-400">(Démo)</span>
                    )}
                  </td>
                  <td className="py-3 px-4">{o.customer_name}</td>
                  <td className="py-3 px-4 text-neutral-600">{o.city}</td>
                  <td className="py-3 px-4 text-neutral-500 text-xs tabular-nums">{formatDateFr(o.created_at)}</td>
                  <td className="py-3 px-4 text-xs font-medium">{o.status}</td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatMad(o.total_mad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
