import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { Category, Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';
import { CommunityGallery } from '../components/CommunityGallery';
import { useStore } from '../context/StoreContext';

export const HomePage: React.FC = () => {
  const { notify } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'bestseller' | 'promo'>('new');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submittingNews, setSubmittingNews] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<Product[]>('/api/products'),
      apiFetch<Category[]>('/api/categories'),
    ])
      .then(([prods, cats]) => {
        if (!active) return;
        setProducts(prods);
        setCategories(cats);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredTabProducts = products
    .filter((p) => {
      if (activeTab === 'new') return p.is_new === 1;
      if (activeTab === 'bestseller') return p.is_bestseller === 1;
      return p.is_promo === 1 || (p.old_price_mad !== null && p.old_price_mad > p.price_mad);
    })
    .slice(0, 8);

  const femmeCategories = categories.filter((c) => c.gender === 'femme').slice(0, 4);
  const hommeCategories = categories.filter((c) => c.gender === 'homme').slice(0, 4);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubmittingNews(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      });
      notify(res.message);
      setNewsletterEmail('');
    } catch (err: any) {
      notify(err.message || 'Erreur lors de l’inscription', 'error');
    } finally {
      setSubmittingNews(false);
    }
  };

  return (
    <div>
      {/* 1. HERO BANNER */}
      <section className="relative h-[78vh] min-h-[540px] max-h-[820px] bg-[#111111] overflow-hidden">
        <SafeImage
          src="/src/assets/images/hero_casa_style_1794761387075.jpg"
          alt="Collection CASA STYLE Casablanca"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15" />

        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-14 sm:pb-20">
          <div className="max-w-2xl text-white">
            <p className="text-xs uppercase tracking-[0.22em] text-[#EDE5D8] mb-3">
              Casablanca · Prêt-à-porter contemporain
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.08] text-balance">
              Découvrez votre nouveau style
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/85 max-w-xl leading-relaxed">
              Les dernières tendances de la mode à Casablanca. Coupes architecturales, étoffes nobles et allure intemporelle.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/boutique"
                className="px-7 py-3.5 bg-white text-[#111111] hover:bg-[#B89B72] hover:text-white text-xs font-semibold uppercase tracking-[0.16em] transition-colors inline-flex items-center gap-2.5 whitespace-nowrap"
              >
                Découvrir la collection
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/nouveautes"
                className="px-7 py-3.5 border border-white/60 text-white hover:bg-white/10 text-xs font-semibold uppercase tracking-[0.16em] transition-colors whitespace-nowrap"
              >
                Nouveautés
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COLLECTIONS FEMME & HOMME */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#B89B72] mb-2">Univers CASA STYLE</p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#111111]">
              Collections Femme & Homme
            </h2>
          </div>
          <Link
            to="/boutique"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-[#111111] hover:text-[#B89B72] inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            Explorer tout le catalogue
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Femme */}
          <div className="group relative aspect-[4/5] sm:aspect-[3/4] bg-[#F5F5F5] overflow-hidden">
            <SafeImage
              src="/src/assets/images/femme_robe_champagne_1794761387519.jpg"
              alt="Collection Femme CASA STYLE"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-[#EDE5D8] mb-2">Vestiaire Féminin</p>
              <h3 className="font-editorial text-3xl sm:text-4xl font-medium mb-3">Collection Femme</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/80 mb-6">
                {femmeCategories.map((c) => (
                  <Link key={c.id} to={`/femme?category=${c.slug}`} className="hover:text-white underline-offset-4 hover:underline">
                    {c.name}
                  </Link>
                ))}
              </div>
              <Link
                to="/femme"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#111111] hover:bg-[#B89B72] hover:text-white text-xs font-semibold uppercase tracking-[0.14em] transition-colors"
              >
                Découvrir Femme
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Homme */}
          <div className="group relative aspect-[4/5] sm:aspect-[3/4] bg-[#F5F5F5] overflow-hidden">
            <SafeImage
              src="/src/assets/images/homme_costume_noir_1794761389543.jpg"
              alt="Collection Homme CASA STYLE"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-[#EDE5D8] mb-2">Vestiaire Masculin</p>
              <h3 className="font-editorial text-3xl sm:text-4xl font-medium mb-3">Collection Homme</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/80 mb-6">
                {hommeCategories.map((c) => (
                  <Link key={c.id} to={`/homme?category=${c.slug}`} className="hover:text-white underline-offset-4 hover:underline">
                    {c.name}
                  </Link>
                ))}
              </div>
              <Link
                to="/homme"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#111111] hover:bg-[#B89B72] hover:text-white text-xs font-semibold uppercase tracking-[0.14em] transition-colors"
              >
                Découvrir Homme
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. NOUVEAUTÉS / MEILLEURES VENTES / PROMOTIONS */}
      <section className="bg-[#F5F5F5]/70 py-16 lg:py-24 border-y border-[#111111]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#B89B72] mb-2">Sélection Maison</p>
              <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#111111]">
                {activeTab === 'new'
                  ? 'Nouveautés de la Saison'
                  : activeTab === 'bestseller'
                  ? 'Meilleures Ventes'
                  : 'Offres & Promotions'}
              </h2>
            </div>

            <div className="flex items-center gap-1 p-1 bg-white border border-[#111111]/10 self-start md:self-auto">
              <button
                onClick={() => setActiveTab('new')}
                className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'new' ? 'bg-[#111111] text-white' : 'text-[#111111]/70 hover:text-[#111111]'
                }`}
              >
                Nouveautés
              </button>
              <button
                onClick={() => setActiveTab('bestseller')}
                className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'bestseller' ? 'bg-[#111111] text-white' : 'text-[#111111]/70 hover:text-[#111111]'
                }`}
              >
                Meilleures ventes
              </button>
              <button
                onClick={() => setActiveTab('promo')}
                className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'promo' ? 'bg-[#111111] text-white' : 'text-[#111111]/70 hover:text-[#111111]'
                }`}
              >
                Promotions
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3 animate-pulse">
                  <div className="aspect-[3/4] bg-[#EDE5D8]/60" />
                  <div className="h-3 w-20 bg-[#EDE5D8]" />
                  <div className="h-4 w-40 bg-[#EDE5D8]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10 lg:gap-x-7">
              {filteredTabProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to={
                activeTab === 'new'
                  ? '/nouveautes'
                  : activeTab === 'promo'
                  ? '/promotions'
                  : '/boutique?sort=bestsellers'
              }
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-[#111111] text-xs font-semibold uppercase tracking-[0.16em] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
            >
              Voir toute la sélection
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. CASA STYLE COMMUNITY */}
      <CommunityGallery products={products} />

      {/* 5. POURQUOI CHOISIR CASA STYLE ? */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 border-t border-[#111111]/10">
        <div className="max-w-2xl mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-[#B89B72] mb-2">Nos Engagements</p>
          <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#111111]">
            Pourquoi choisir CASA STYLE ?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#111111]/10 divide-y sm:divide-y-0 sm:divide-x divide-[#111111]/10 bg-white">
          <div className="p-7 space-y-3">
            <Sparkles className="w-5 h-5 text-[#B89B72]" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-[#111111]">Matières Nobles</h3>
            <p className="text-sm text-[#111111]/70 leading-relaxed">
              Soie satinée, laine vierge, lin méditerranéen et coton Pima rigoureusement sélectionnés pour un tombé irréprochable.
            </p>
          </div>
          <div className="p-7 space-y-3">
            <Truck className="w-5 h-5 text-[#B89B72]" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-[#111111]">Livraison Express Maroc</h3>
            <p className="text-sm text-[#111111]/70 leading-relaxed">
              Expédition sous 24h à Casablanca et 24–48h vers Rabat, Marrakech, Tanger, Fès, Agadir et tout le Royaume.
            </p>
          </div>
          <div className="p-7 space-y-3">
            <ShieldCheck className="w-5 h-5 text-[#B89B72]" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-[#111111]">Paiement à la Livraison</h3>
            <p className="text-sm text-[#111111]/70 leading-relaxed">
              Commandez en toute sérénité et réglez directement en espèces à la réception de votre colis partout au Maroc.
            </p>
          </div>
          <div className="p-7 space-y-3">
            <Check className="w-5 h-5 text-[#B89B72]" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-[#111111]">Échanges & Retours 14j</h3>
            <p className="text-sm text-[#111111]/70 leading-relaxed">
              Besoin d’une autre taille ? Profitez d’un échange simple et rapide sous 14 jours ou en boutique au Triangle d’Or.
            </p>
          </div>
        </div>
      </section>

      {/* 5. NEWSLETTER */}
      <section className="bg-[#EDE5D8] py-16 lg:py-20 border-t border-[#111111]/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#111111]/70 mb-2">Cercle Privé</p>
          <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#111111] mb-3">
            Restez informé(e) des nouvelles collections
          </h2>
          <p className="text-sm sm:text-base text-[#111111]/75 mb-8">
            Recevez en avant-première nos lancements exclusifs à Casablanca et nos ventes privées.
          </p>

          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Votre adresse e-mail"
              className="flex-1 px-4 py-3.5 bg-white border border-[#111111]/15 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
            />
            <button
              type="submit"
              disabled={submittingNews}
              className="px-7 py-3.5 bg-[#111111] text-white hover:bg-[#B89B72] text-xs font-semibold uppercase tracking-[0.16em] transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {submittingNews ? 'Inscription...' : 'S’inscrire'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
