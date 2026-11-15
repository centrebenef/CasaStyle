import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC = () => {
  const { settings } = useStore();

  return (
    <footer className="bg-[#111111] text-white pt-16 pb-10 border-t border-white/10 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="font-editorial text-3xl tracking-[0.14em] font-semibold block">
              {settings.logo_text || 'CASA STYLE'}
            </Link>
            <p className="text-sm text-[#B89B72] tracking-wide">{settings.slogan}</p>
            <p className="text-sm text-white/70 leading-relaxed">
              {settings.footer_text}
            </p>
          </div>

          {/* Collections */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B89B72] mb-4">
              Collections
            </h3>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li><Link to="/femme" className="hover:text-white transition-colors">Collection Femme</Link></li>
              <li><Link to="/homme" className="hover:text-white transition-colors">Collection Homme</Link></li>
              <li><Link to="/nouveautes" className="hover:text-white transition-colors">Nouveautés</Link></li>
              <li><Link to="/promotions" className="hover:text-white transition-colors">Promotions</Link></li>
              <li><Link to="/boutique" className="hover:text-white transition-colors">Tout le catalogue</Link></li>
            </ul>
          </div>

          {/* Maison & Service */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B89B72] mb-4">
              Maison & Informations
            </h3>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li><Link to="/a-propos" className="hover:text-white transition-colors">À propos de CASA STYLE</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact & Showroom</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">Questions fréquentes (FAQ)</Link></li>
              <li><Link to="/retours" className="hover:text-white transition-colors">Retours & Remboursements</Link></li>
              <li><Link to="/cgv" className="hover:text-white transition-colors">Conditions générales de vente</Link></li>
              <li><Link to="/confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
            </ul>
          </div>

          {/* Coordonnées & Réseaux */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B89B72] mb-4">
              Boutique Casablanca
            </h3>
            <ul className="space-y-3 text-sm text-white/75">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#B89B72] shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#B89B72] shrink-0" />
                <a href={`tel:${settings.phone}`} className="hover:text-white tabular-nums">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#B89B72] shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-white">
                  {settings.email}
                </a>
              </li>
            </ul>

            <div className="flex items-center gap-4 mt-5 text-xs uppercase tracking-wider">
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="text-white/70 hover:text-[#B89B72] transition-colors">
                  Instagram
                </a>
              )}
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="text-white/70 hover:text-[#B89B72] transition-colors">
                  Facebook
                </a>
              )}
              {settings.tiktok_url && (
                <a href={settings.tiktok_url} target="_blank" rel="noreferrer" className="text-white/70 hover:text-[#B89B72] transition-colors">
                  TikTok
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} {settings.store_name || 'CASA STYLE'} · Casablanca, Maroc. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <span>Devise : Dirham marocain (DH)</span>
            <Link to="/admin" className="hover:text-white transition-colors">
              Administration
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
