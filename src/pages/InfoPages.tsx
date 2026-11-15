import React, { useState } from 'react';
import { ChevronDown, Mail, MapPin, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import { SafeImage } from '../components/SafeImage';

export const AboutPage: React.FC = () => {
  const { settings } = useStore();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[#B89B72]">Notre Maison</p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#111111]">
            À propos de {settings.store_name}
          </h1>
          <p className="text-base text-[#111111]/75 leading-relaxed">
            Née au cœur du Triangle d’Or à Casablanca, CASA STYLE incarne une vision contemporaine et architecturale de la mode marocaine et internationale.
          </p>
          <p className="text-base text-[#111111]/75 leading-relaxed">
            Chaque collection Femme et Homme est dessinée autour de lignes épurées, de coupes précises et de matières naturelles nobles : soie satinée, lin méditerranéen, laine froide et coton Pima.
          </p>
          <p className="text-sm font-medium text-[#111111] pt-2">
            « {settings.slogan} »
          </p>
        </div>

        <div className="lg:col-span-6 aspect-[4/3] bg-[#F5F5F5] overflow-hidden">
          <SafeImage
            src="/src/assets/images/accessoires_atelier_1794761391155.jpg"
            alt="Atelier CASA STYLE Casablanca"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-[#111111]/10">
        <div>
          <h2 className="font-editorial text-2xl font-medium text-[#111111] mb-2">Exigence Tailleur</h2>
          <p className="text-sm text-[#111111]/70 leading-relaxed">
            Nos patrons sont travaillés pour offrir un tombé fluide, une tenue durable et un confort optimal tout au long de la journée.
          </p>
        </div>
        <div>
          <h2 className="font-editorial text-2xl font-medium text-[#111111] mb-2">Proximité Maroc</h2>
          <p className="text-sm text-[#111111]/70 leading-relaxed">
            Basés à Casablanca, nous livrons rapidement dans l’ensemble des villes du Royaume avec un service client réactif.
          </p>
        </div>
        <div>
          <h2 className="font-editorial text-2xl font-medium text-[#111111] mb-2">Éditions Maîtrisées</h2>
          <p className="text-sm text-[#111111]/70 leading-relaxed">
            Nous produisons en séries raisonnées afin de privilégier la qualité des finitions sur la quantité.
          </p>
        </div>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { settings, notify } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      notify(res.message);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      notify(err.message || 'Erreur lors de l’envoi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <div className="max-w-2xl mb-12">
        <p className="text-xs uppercase tracking-[0.2em] text-[#B89B72] mb-2">Service Client</p>
        <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#111111]">Contact & Showroom</h1>
        <p className="mt-3 text-sm sm:text-base text-[#111111]/70">
          Une question sur une taille, une commande ou nos créations ? Notre équipe basée à Casablanca vous répond sous 24h ouvrées.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-[#EDE5D8]/50 border border-[#111111]/10 space-y-5">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#B89B72] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#111111]/60">Showroom Casablanca</p>
                <p className="text-sm text-[#111111] mt-1">{settings.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-[#B89B72] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#111111]/60">Téléphone</p>
                <p className="text-sm text-[#111111] mt-1 tabular-nums">{settings.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-[#B89B72] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#111111]/60">E-mail</p>
                <p className="text-sm text-[#111111] mt-1">{settings.email}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-[#111111]/10 text-xs text-[#111111]/70">
              Horaires boutique : Lundi au Samedi · 10h00 – 20h00
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4 border border-[#111111]/15 p-6 sm:p-8 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Nom complet *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">E-mail *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Sujet *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Commande, taille, showroom..."
                className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5">Message *</label>
            <textarea
              rows={5}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-7 py-3.5 bg-[#111111] hover:bg-[#B89B72] text-white text-xs font-semibold uppercase tracking-[0.16em] transition-colors"
          >
            {submitting ? 'Envoi en cours...' : 'Envoyer le message'}
          </button>
        </form>
      </div>
    </div>
  );
};

const FAQ_ITEMS = [
  {
    q: 'Quels sont les délais et frais de livraison au Maroc ?',
    a: 'À Casablanca, la livraison express est effectuée sous 24h ouvrées (30 DH). Vers Rabat, Marrakech, Tanger, Fès, Agadir et les autres villes du Maroc, comptez 24h à 48h ouvrées (45 DH). La livraison est offerte partout au Maroc dès 1 200 DH d’achat.',
  },
  {
    q: 'Quels modes de paiement acceptez-vous ?',
    a: 'Nous proposons le paiement à la livraison (Cash on Delivery) en espèces partout au Maroc, ainsi que le paiement par carte bancaire marocaine et internationale via notre interface CMI.',
  },
  {
    q: 'Comment effectuer un échange de taille ou un retour ?',
    a: 'Vous disposez de 14 jours après réception pour demander un échange ou un remboursement. Les articles doivent être non portés, avec leurs étiquettes d’origine intactes.',
  },
  {
    q: 'Comment suivre l’avancement de ma commande ?',
    a: 'Connectez-vous à votre Espace Client pour suivre en temps réel chaque étape : En attente, Confirmée, En préparation, Expédiée et Livrée.',
  },
  {
    q: 'Puis-je essayer les pièces en boutique à Casablanca ?',
    a: 'Oui, notre showroom du Triangle d’Or (24 Boulevard Massira Al Khadra) vous accueille du lundi au samedi de 10h à 20h.',
  },
];

export const FaqPage: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-[#B89B72] mb-2">Aide & Conseils</p>
      <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#111111] mb-10">
        Questions Fréquentes
      </h1>

      <div className="divide-y divide-[#111111]/10 border-t border-b border-[#111111]/10">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={item.q} className="py-5">
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between gap-4 text-left"
              >
                <span className="text-base font-medium text-[#111111]">{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#B89B72] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <p className="mt-3 text-sm text-[#111111]/75 leading-relaxed pr-6">{item.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const LegalPage: React.FC<{ type: 'cgv' | 'privacy' | 'returns' }> = ({ type }) => {
  const { settings } = useStore();
  const content = {
    cgv: {
      kicker: 'Informations Légales',
      title: 'Conditions Générales de Vente',
      sections: [
        {
          h: '1. Objet et champ d’application',
          p: `Les présentes conditions générales régissent les ventes de prêt-à-porter et accessoires effectuées par ${settings.store_name} au Maroc, depuis la boutique en ligne et le showroom de Casablanca.`,
        },
        {
          h: '2. Prix et devise',
          p: 'Tous les prix sont indiqués en Dirhams marocains (DH / MAD), toutes taxes comprises. Les frais de livraison sont calculés avant la validation définitive de la commande.',
        },
        {
          h: '3. Validation et disponibilité',
          p: 'Chaque commande génère un numéro unique et décrémente nos stocks en temps réel. En cas d’indisponibilité exceptionnelle, notre service client vous contacte immédiatement.',
        },
        {
          h: '4. Paiement et livraison',
          p: 'Le règlement s’effectue à la livraison en espèces (COD) ou par carte bancaire via passerelle sécurisée. Les livraisons sont assurées sous 24h à Casablanca et 24–48h partout au Maroc.',
        },
      ],
    },
    privacy: {
      kicker: 'Protection des Données',
      title: 'Politique de Confidentialité',
      sections: [
        {
          h: '1. Données collectées',
          p: 'CASA STYLE collecte uniquement les informations nécessaires au traitement de vos commandes et à la gestion de votre espace client : nom, téléphone, adresse e-mail et adresse de livraison.',
        },
        {
          h: '2. Sécurité et confidentialité',
          p: 'Vos mots de passe sont chiffrés côté serveur. Nous ne vendons ni ne partageons jamais vos coordonnées personnelles à des tiers commerciaux.',
        },
        {
          h: '3. Vos droits',
          p: `Conformément à la loi marocaine 09-08, vous pouvez demander l’accès, la rectification ou la suppression de vos données en écrivant à ${settings.email}.`,
        },
      ],
    },
    returns: {
      kicker: 'Garantie Satisfaction',
      title: 'Politique de Retour & Remboursement',
      sections: [
        {
          h: '1. Délai de 14 jours',
          p: 'Vous disposez de 14 jours calendaires suivant la réception de votre colis pour demander un échange de taille ou un remboursement.',
        },
        {
          h: '2. Conditions d’acceptation',
          p: 'Les articles retournés doivent être neufs, non portés, non lavés et accompagnés de leurs étiquettes et emballages d’origine.',
        },
        {
          h: '3. Procédure',
          p: `Contactez notre service client au ${settings.phone} ou par e-mail à ${settings.email} en précisant votre numéro de commande. Les échanges à Casablanca peuvent également être effectués directement en showroom.`,
        },
      ],
    },
  }[type];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-[#B89B72] mb-2">{content.kicker}</p>
      <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#111111] mb-10">{content.title}</h1>

      <div className="space-y-8">
        {content.sections.map((s) => (
          <section key={s.h} className="space-y-2 pb-6 border-b border-[#111111]/10">
            <h2 className="text-base font-semibold text-[#111111]">{s.h}</h2>
            <p className="text-sm text-[#111111]/75 leading-relaxed">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
};
