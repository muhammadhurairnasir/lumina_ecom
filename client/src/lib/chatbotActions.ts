import { api } from './api';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

export async function executeChatActions(actions: any[] | undefined, router: { push: (path: string) => void }) {
  if (!actions?.length) return;

  const { setCart, clearCart } = useStore.getState();

  for (const action of actions) {
    const type = action.type || action.action;

    try {
      if (type === 'ADD_TO_CART' && action.item?._id) {
        const res = await api.post('/cart/items', {
          productId: action.item._id,
          quantity: action.quantity || 1,
        });
        setCart(res.data.data.cart);
        toast.success(`Added ${action.item.name} to cart`);
      }

      if (type === 'REMOVE_FROM_CART' && action.itemId) {
        const res = await api.delete(`/cart/items/${action.itemId}`);
        setCart(res.data.data.cart);
        toast.success('Item removed from cart');
      }

      if (type === 'CLEAR_CART') {
        const res = await api.delete('/cart');
        if (res.data.data.cart) setCart(res.data.data.cart);
        else clearCart();
        toast.success('Cart cleared');
      }

      if (type === 'VIEW_CART') {
        router.push('/cart');
      }

      if (type === 'OPEN_CHECKOUT') {
        router.push('/checkout');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update your cart');
    }
  }
}
