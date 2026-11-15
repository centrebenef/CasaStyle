export type Gender = 'femme' | 'homme' | 'mixte';

export type OrderStatus =
  | 'En attente'
  | 'Confirmée'
  | 'En préparation'
  | 'Expédiée'
  | 'Livrée'
  | 'Annulée';

export interface Category {
  id: number;
  name: string;
  slug: string;
  gender: Gender;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: number;
  product_count?: number;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  sort_order: number;
  is_primary: number;
}

export interface ProductColor {
  id: number;
  product_id: number;
  color_name: string;
  color_hex: string;
}

export interface InventoryItem {
  id: number;
  product_id: number;
  size: string;
  color_name: string;
  quantity: number;
  low_stock_threshold: number;
  updated_at: string;
}

export interface Product {
  id: number;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  name: string;
  slug: string;
  gender: 'femme' | 'homme';
  description: string;
  price_mad: number;
  old_price_mad: number | null;
  is_new: number;
  is_bestseller: number;
  is_promo: number;
  is_active: number;
  is_demo: number;
  created_at: string;
  images: ProductImage[];
  sizes: string[];
  colors: ProductColor[];
  inventory: InventoryItem[];
  total_stock: number;
}

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  image: string;
  price_mad: number;
  old_price_mad: number | null;
  size: string;
  color_name: string;
  color_hex: string;
  quantity: number;
  max_stock: number;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'customer';
  full_name: string;
  phone?: string;
  city?: string;
  address?: string;
  postal_code?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  product_image: string;
  size: string;
  color_name: string;
  quantity: number;
  unit_price_mad: number;
  line_total_mad: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  city: string;
  address: string;
  postal_code: string;
  notes: string;
  payment_method: 'cod' | 'online_card';
  payment_status: string;
  status: OrderStatus;
  subtotal_mad: number;
  shipping_fee_mad: number;
  total_mad: number;
  is_demo: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface CustomerRecord {
  id: number;
  user_id: number | null;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  postal_code: string;
  is_active: number;
  is_demo: number;
  created_at: string;
  orders_count?: number;
  total_spent_mad?: number;
}

export interface Promotion {
  id: number;
  title: string;
  description: string;
  product_id: number | null;
  product_name?: string;
  discount_percent: number;
  promo_price_mad: number | null;
  start_date: string;
  end_date: string;
  is_active: number;
  created_at: string;
}

export interface InventoryMovement {
  id: number;
  product_id: number;
  product_name?: string;
  size: string;
  color_name: string;
  type: 'in' | 'out' | 'adjustment';
  quantity_delta: number;
  reason: string;
  created_at: string;
}

export interface SiteSettings {
  store_name: string;
  slogan: string;
  logo_text: string;
  address: string;
  phone: string;
  email: string;
  shipping_casablanca_mad: string;
  shipping_other_mad: string;
  free_shipping_threshold_mad: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  footer_text: string;
}

export interface CommunityPost {
  id: number;
  customer_name: string;
  city: string;
  product_id: number | null;
  product_name?: string;
  product_slug?: string;
  product_price_mad?: number;
  product_gender?: 'femme' | 'homme';
  image_url: string;
  rating: number;
  comment: string;
  likes_count: number;
  is_published: number;
  created_at: string;
}

