import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, WebCustomer } from '@/types';
import { supabase } from './supabase';
import { priceItem, type QuantityOffer } from './pricing';

interface CartStore {
  items: CartItem[];
  customer: WebCustomer | null;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setCustomer: (customer: WebCustomer | null) => void;
  logout: () => void;
  getTotal: () => number;
  getTotalSaved: () => number;
  getItemCount: () => number;
  syncCartToDB: () => Promise<void>;
}

async function syncCart(customerId: string | undefined, items: CartItem[]) {
  if (!customerId) return;
  try {
    await supabase
      .from('web_customers')
      .update({
        cart: items,
        cart_last_updated: new Date().toISOString(),
        cart_reminder_sent: false,
      })
      .eq('id', customerId);
  } catch (err) {
    console.warn('No se pudo sincronizar carrito:', err);
  }
}

// Recalcula precio + subtotal de un item según sus ofertas
function recalcItem(item: CartItem): CartItem {
  const offers = (item as any).quantity_offers as QuantityOffer[] | undefined;
  if (!offers || offers.length === 0) {
    return { ...item, subtotal: item.quantity * item.unit_price };
  }
  const priced = priceItem((item as any).base_unit_price || item.unit_price, item.quantity, offers);
  return {
    ...item,
    unit_price: priced.unit_price,
    subtotal: priced.subtotal,
  };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      customer: null,

      addItem: (item) => {
        const existing = get().items.find(i => i.product_id === item.product_id);
        let newItems: CartItem[];

        if (existing) {
          newItems = get().items.map(i =>
            i.product_id === item.product_id
              ? recalcItem({ ...i, quantity: i.quantity + item.quantity })
              : i
          );
        } else {
          // Guardamos el precio base original (sin ofertas) para poder recalcular
          const base = (item as any).base_unit_price || item.unit_price;
          newItems = [...get().items, recalcItem({ ...item, base_unit_price: base } as any)];
        }

        set({ items: newItems });
        syncCart(get().customer?.id, newItems);
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const newItems = get().items.map(i =>
          i.product_id === productId ? recalcItem({ ...i, quantity }) : i
        );
        set({ items: newItems });
        syncCart(get().customer?.id, newItems);
      },

      removeItem: (productId) => {
        const newItems = get().items.filter(i => i.product_id !== productId);
        set({ items: newItems });
        syncCart(get().customer?.id, newItems);
      },

      clearCart: () => {
        set({ items: [] });
        syncCart(get().customer?.id, []);
      },

      setCustomer: (customer) => {
        const current = get().customer;
        if (current && customer && current.id !== customer.id) {
          set({ customer, items: [] });
        } else {
          set({ customer });
          if (customer && customer.cart && customer.cart.length > 0 && get().items.length === 0) {
            // Recalcular items del carrito persistido (las ofertas pueden haber cambiado)
            set({ items: customer.cart.map(recalcItem) });
          }
        }
      },

      logout: () => set({ customer: null, items: [] }),

      getTotal: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),

      getTotalSaved: () => get().items.reduce((sum, i) => {
        const base = (i as any).base_unit_price || i.unit_price;
        const wouldBe = base * i.quantity;
        return sum + Math.max(0, wouldBe - i.subtotal);
      }, 0),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      syncCartToDB: async () => {
        await syncCart(get().customer?.id, get().items);
      },
    }),
    { name: 'addani-cart' }
  )
);
