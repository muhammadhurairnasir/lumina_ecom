import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setCookie, deleteCookie } from 'cookies-next';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface CartItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  appliedVoucher?: {
    code: string;
    discountType: string;
    discountValue: number;
  };
}

interface AppState {
  // Auth
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  
  // Cart (Optimistic local sync)
  cart: CartState;
  setCart: (cart: CartState) => void;
  clearCart: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      
      setAuth: (token, user) => {
        set({ accessToken: token, user });
        if (user.role === 'admin') {
          setCookie('adminToken', token, { maxAge: 60 * 60 * 24 * 7, path: '/' });
        }
      },
      
      logout: () => {
        set({ accessToken: null, user: null });
        deleteCookie('adminToken', { path: '/' });
      },
      
      cart: {
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
      },
      
      setCart: (cart) => set({ cart }),
      
      clearCart: () => set({ 
        cart: {
          items: [],
          subtotal: 0,
          discount: 0,
          total: 0,
        }
      })
    }),
    {
      name: 'ecommerce-storage',
      partialize: (state) => ({ 
        accessToken: state.accessToken, 
        user: state.user 
      }), // Only persist auth, fetch cart from server on load
    }
  )
);
