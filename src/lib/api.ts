export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erreur serveur (${res.status})`);
  }
  return data as T;
}

export function formatMad(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-MA')} DH`;
}

export function formatDateFr(isoString: string): string {
  if (!isoString) return '—';
  const normalized = isoString.includes('T') ? isoString : isoString.replace(' ', 'T') + 'Z';
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const MOROCCO_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Tanger',
  'Fès',
  'Agadir',
  'Autres villes du Maroc',
] as const;

export function getDeliveryEstimate(city: string): string {
  if (city.toLowerCase() === 'casablanca') {
    return 'Livraison express sous 24h';
  }
  return 'Livraison rapide sous 24h à 48h';
}
