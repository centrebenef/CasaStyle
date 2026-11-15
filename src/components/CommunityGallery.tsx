import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, Heart, Star, Upload, X } from 'lucide-react';
import { apiFetch, formatDateFr, formatMad, MOROCCO_CITIES } from '../lib/api';
import type { CommunityPost, Product } from '../types';
import { useStore } from '../context/StoreContext';
import { SafeImage } from './SafeImage';

export const CommunityGallery: React.FC<{ products?: Product[] }> = ({ products = [] }) => {
  const { notify, user } = useStore();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'femme' | 'homme'>('all');
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [likedIds, setLikedIds] = useState<number[]>([]);

  // Share Look modal state
  const [shareOpen, setShareOpen] = useState(false);
  const [customerName, setCustomerName] = useState(user?.full_name || '');
  const [city, setCity] = useState(user?.city || 'Casablanca');
  const [productId, setProductId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<CommunityPost[]>('/api/community')
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.full_name && !customerName) {
      setCustomerName(user.full_name);
    }
  }, [user, customerName]);

  const filteredPosts = posts.filter((p) => {
    if (filter === 'all') return true;
    return p.product_gender === filter;
  });

  const handleLike = async (e: React.MouseEvent, post: CommunityPost) => {
    e.stopPropagation();
    if (likedIds.includes(post.id)) return;
    try {
      const res = await apiFetch<{ id: number; likes_count: number }>(`/api/community/${post.id}/like`, {
        method: 'POST',
      });
      setLikedIds((prev) => [...prev, post.id]);
      setPosts((prev) => prev.map((x) => (x.id === post.id ? { ...x, likes_count: res.likes_count } : x)));
      if (selectedPost?.id === post.id) {
        setSelectedPost({ ...selectedPost, likes_count: res.likes_count });
      }
    } catch {
      // ignore
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await apiFetch<{ url: string }>('/api/community/upload', {
        method: 'POST',
        body: fd,
      });
      setImageUrl(res.url);
      notify('Photo importée avec succès.');
    } catch (err: any) {
      notify(err.message || 'Erreur lors de l’import de la photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !comment.trim() || !imageUrl.trim()) {
      notify('Veuillez renseigner votre nom, une photo et votre avis.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const created = await apiFetch<CommunityPost>('/api/community', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: customerName.trim(),
          city,
          product_id: productId ? Number(productId) : null,
          image_url: imageUrl.trim(),
          rating,
          comment: comment.trim(),
        }),
      });
      setPosts((prev) => [created, ...prev]);
      setShareOpen(false);
      setComment('');
      setImageUrl('');
      setRating(5);
      notify('Merci ! Votre look a été ajouté à CASA STYLE Community.');
    } catch (err: any) {
      notify(err.message || 'Impossible de publier votre avis', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating =
    posts.length > 0
      ? (posts.reduce((sum, p) => sum + p.rating, 0) / posts.length).toFixed(1)
      : '4.9';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 border-t border-[#111111]/10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[#B89B72] mb-2">
            Galerie Clients & Avis Vérifiés
          </p>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[42px] font-medium text-[#111111]">
            CASA STYLE Community
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-[#111111]/70 leading-relaxed">
            Nos pièces portées au quotidien de Casablanca à Marrakech. Note moyenne{' '}
            <span className="font-semibold text-[#111111] tabular-nums">{averageRating}/5</span> sur{' '}
            <span className="tabular-nums">{posts.length}</span> retours clients.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#F5F5F5] border border-[#111111]/10">
            {(['all', 'femme', 'homme'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  filter === tab ? 'bg-white text-[#111111] shadow-sm' : 'text-[#111111]/65 hover:text-[#111111]'
                }`}
              >
                {tab === 'all' ? 'Tous' : tab}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShareOpen(true)}
            className="px-5 py-2.5 bg-[#111111] hover:bg-[#B89B72] text-white text-xs font-semibold uppercase tracking-[0.14em] transition-colors inline-flex items-center gap-2 whitespace-nowrap"
          >
            <Camera className="w-3.5 h-3.5" />
            Partager votre look
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse">
              <div className="aspect-[3/4] bg-[#EDE5D8]/60" />
              <div className="h-4 w-32 bg-[#EDE5D8]" />
              <div className="h-12 w-full bg-[#EDE5D8]/50" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredPosts.map((post) => {
            const isLiked = likedIds.includes(post.id);
            return (
              <article
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="group cursor-pointer flex flex-col border border-[#111111]/10 bg-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                {/* Portrait Photography */}
                <div className="relative aspect-[3/4] bg-[#F5F5F5] overflow-hidden">
                  <SafeImage
                    src={post.image_url}
                    alt={`${post.customer_name} portant ${post.product_name || 'CASA STYLE'}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80" />

                  {/* Bottom overlay caption */}
                  <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between text-white">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{post.customer_name}</p>
                      <p className="text-xs text-white/80 truncate">{post.city}</p>
                    </div>

                    <button
                      onClick={(e) => handleLike(e, post)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/45 hover:bg-black/70 text-white text-xs tabular-nums transition-colors shrink-0"
                      aria-label="Aimer ce look"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#B89B72] text-[#B89B72]' : ''}`} />
                      <span>{post.likes_count}</span>
                    </button>
                  </div>
                </div>

                {/* Review Content */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-0.5" aria-label={`Note ${post.rating} sur 5`}>
                        {[...Array(5)].map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3.5 h-3.5 ${
                              idx < post.rating ? 'fill-[#B89B72] text-[#B89B72]' : 'text-[#111111]/20'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-[#111111]/50">Achat vérifié</span>
                    </div>

                    <p className="text-sm text-[#111111]/85 leading-relaxed line-clamp-3">
                      « {post.comment} »
                    </p>
                  </div>

                  {post.product_name && (
                    <div className="pt-3 border-t border-[#111111]/10 flex items-center justify-between gap-2 text-xs">
                      <span className="text-[#111111]/65 truncate">
                        Pièce : <strong className="font-medium text-[#111111]">{post.product_name}</strong>
                      </span>
                      <span className="text-[#B89B72] font-medium inline-flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                        Voir
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Lightbox Detail Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-12 border border-[#111111]/15 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:col-span-6 aspect-[3/4] bg-[#F5F5F5]">
              <SafeImage
                src={selectedPost.image_url}
                alt={selectedPost.customer_name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-[#111111]/10 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#B89B72]">CASA STYLE Community</p>
                    <h3 className="font-editorial text-2xl font-medium text-[#111111] mt-1">
                      {selectedPost.customer_name}
                    </h3>
                    <p className="text-xs text-[#111111]/60 mt-0.5">
                      {selectedPost.city} · {formatDateFr(selectedPost.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="p-1.5 text-[#111111]/60 hover:text-[#111111]"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, idx) => (
                    <Star
                      key={idx}
                      className={`w-4 h-4 ${
                        idx < selectedPost.rating ? 'fill-[#B89B72] text-[#B89B72]' : 'text-[#111111]/20'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-xs text-[#111111]/60 tabular-nums">{selectedPost.rating}/5</span>
                </div>

                <p className="text-base text-[#111111]/85 leading-relaxed">
                  « {selectedPost.comment} »
                </p>

                <button
                  onClick={(e) => handleLike(e, selectedPost)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[#111111]/20 text-xs font-medium hover:border-[#111111] transition-colors"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      likedIds.includes(selectedPost.id) ? 'fill-[#B89B72] text-[#B89B72]' : ''
                    }`}
                  />
                  <span className="tabular-nums">J’aime ({selectedPost.likes_count})</span>
                </button>
              </div>

              {selectedPost.product_slug && (
                <div className="p-4 bg-[#F5F5F5] border border-[#111111]/10 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-[#111111]/55">Article porté</p>
                    <p className="text-sm font-semibold text-[#111111] truncate">{selectedPost.product_name}</p>
                    {selectedPost.product_price_mad && (
                      <p className="text-xs font-medium text-[#B89B72] tabular-nums mt-0.5">
                        {formatMad(selectedPost.product_price_mad)}
                      </p>
                    )}
                  </div>
                  <Link
                    to={`/produit/${selectedPost.product_slug}`}
                    onClick={() => setSelectedPost(null)}
                    className="px-4 py-2.5 bg-[#111111] hover:bg-[#B89B72] text-white text-xs font-semibold uppercase tracking-wider shrink-0 transition-colors"
                  >
                    Voir la pièce
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Look Modal */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#111111]/15 shadow-2xl">
            <div className="px-6 py-4 border-b border-[#111111]/10 flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-2xl font-medium text-[#111111]">Partager votre look</h3>
                <p className="text-xs text-[#111111]/60">Rejoignez la galerie CASA STYLE Community</p>
              </div>
              <button onClick={() => setShareOpen(false)} aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleShareSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex : Nadia Alami"
                    className="w-full px-3 py-2 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Ville *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-[#111111]/20 bg-white text-sm focus:outline-none focus:border-[#111111]"
                  >
                    {MOROCCO_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {products.length > 0 && (
                <div>
                  <label className="block text-xs font-medium mb-1">Pièce CASA STYLE portée</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-[#111111]/20 bg-white text-sm focus:outline-none focus:border-[#111111]"
                  >
                    <option value="">— Sélectionner un article —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1.5">Votre note</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className="p-1"
                      aria-label={`${n} étoile(s)`}
                    >
                      <Star
                        className={`w-5 h-5 ${n <= rating ? 'fill-[#B89B72] text-[#B89B72]' : 'text-[#111111]/20'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5">Votre photo *</label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 border border-[#111111]/25 bg-[#F5F5F5] hover:border-[#111111] text-xs font-medium cursor-pointer inline-flex items-center gap-2 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Import...' : 'Téléverser une photo'}
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Ou URL de votre photo"
                    className="flex-1 px-3 py-2 border border-[#111111]/20 text-xs focus:outline-none focus:border-[#111111]"
                  />
                </div>
                {imageUrl && (
                  <div className="mt-3 w-20 h-26 bg-[#F5F5F5] border border-[#111111]/10 overflow-hidden">
                    <SafeImage src={imageUrl} alt="Aperçu" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Votre avis / commentaire *</label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Partagez votre ressenti sur la coupe, la matière et la livraison..."
                  className="w-full px-3 py-2 border border-[#111111]/20 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#111111]/10">
                <button
                  type="button"
                  onClick={() => setShareOpen(false)}
                  className="px-4 py-2 border border-[#111111]/20 text-xs font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-[#111111] hover:bg-[#B89B72] text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  {submitting ? 'Publication...' : 'Publier mon look'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
