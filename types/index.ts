export interface Product {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  category_id?: string;
  barcode?: string;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  images: string[];
  online_gallery?: string[];
  online_description?: string;
  show_online?: boolean;
  featured?: boolean;
  variants?: any[];
  active: boolean;
  tag?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  display_order: number;
  active: boolean;
}

export interface WebCustomer {
  id: string;
  dni: string;
  email?: string;
  full_name: string;
  phone?: string;
  password_hash?: string;
  google_id?: string;
  avatar_url?: string;
  cart: CartItem[];
  not_picked_up_count: number;
  blocked: boolean;
  last_login?: string;
  created_at: string;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  category_id?: string;
  category_name?: string;
  category_icon?: string;
}

export interface Order {
  id: string;
  order_number: string;
  short_code: string;
  qr_token: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  payment_method: 'efectivo' | 'transferencia';
  status: OrderStatus;
  payment_proof_url?: string;
  payment_proof_uploaded_at?: string;
  approved_at?: string;
  rejected_reason?: string;
  delivered_at?: string;
  cancelled_by_customer?: boolean;
  cancellation_reason?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'pending_payment'
  | 'pending_approval'
  | 'approved'
  | 'ready_to_pickup'
  | 'delivered'
  | 'cancelled'
  | 'expired'
  | 'rejected';

export interface WebConfig {
  id: string;
  store_name: string;
  store_description?: string;
  bank_alias?: string;
  bank_cvu?: string;
  bank_holder?: string;
  whatsapp_number?: string;
  store_address?: string;
  store_hours?: string;
  pickup_instructions?: string;
  primary_color?: string;
}