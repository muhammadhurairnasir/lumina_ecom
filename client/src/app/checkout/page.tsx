'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Check, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';

// Stripe Promise
let stripePromise: Promise<any> | null = null;
const getStripe = async () => {
  if (!stripePromise) {
    try {
      const res = await api.get('/orders/stripe/config');
      stripePromise = loadStripe(res.data.data.publishableKey);
    } catch (error) {
      console.error('Failed to load Stripe config');
    }
  }
  return stripePromise;
};

// ----------------------------------------------------
// Payment Form Component (Wrapped in Elements provider)
// ----------------------------------------------------
const CheckoutPaymentForm = ({ clientSecret, orderId, onConfirm }: { clientSecret: string, orderId: string, onConfirm: (id: string) => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    // Confirm Payment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // Do not redirect immediately
    });

    if (error) {
      toast.error(error.message || 'Payment failed');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        // Backend Confirmation
        await api.post('/orders/confirm', {
          orderId,
          paymentIntentId: paymentIntent.id
        });
        toast.success('Payment successful!');
        onConfirm(orderId);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Order confirmation failed');
        setIsProcessing(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <PaymentElement />
      <button 
        disabled={!stripe || isProcessing}
        type="submit"
        className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-light hover:text-primary transition-colors disabled:opacity-50"
      >
        {isProcessing ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : 'Pay Now'}
      </button>
    </form>
  );
};


// ----------------------------------------------------
// Main Checkout Page Component
// ----------------------------------------------------
export default function CheckoutPage() {
  const router = useRouter();
  const { user, accessToken, cart, clearCart } = useStore();
  const [step, setStep] = useState(1);
  const [checkoutData, setCheckoutData] = useState<any>(null); // orderId, clientSecret
  const [shippingAddress, setShippingAddress] = useState({
    street: '', city: '', state: '', zip: '', country: 'US'
  });

  // Protection
  useEffect(() => {
    if (!accessToken && !user) {
      router.push('/login?redirect=checkout');
    }
  }, [accessToken, user, router]);

  // Fetch Cart (Background sync)
  const { isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await api.get('/cart');
      return res.data.data.cart;
    },
    enabled: !!accessToken
  });
  const cartData = cart;

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/orders/checkout', { shippingAddress });
      setCheckoutData(res.data.data);
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initialize checkout');
    }
  };

  const handleConfirmation = (completedOrderId: string) => {
    clearCart();
    setStep(3);
  };

  return (
    <div className="bg-[#F9FAFB] min-h-screen pb-20">
      
      {/* Header Stepper */}
      <div className="bg-white border-b border-border py-8">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <div className={`flex flex-col items-center ${step >= 1 ? 'text-primary' : 'text-border'}`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 1 ? 'bg-primary text-white' : 'bg-border text-text-secondary'}`}>1</div>
             <span className="text-sm font-medium">Shipping</span>
          </div>
          <div className={`h-1 flex-1 mx-4 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-border'}`}></div>
          <div className={`flex flex-col items-center ${step >= 2 ? 'text-primary' : 'text-border'}`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 2 ? 'bg-primary text-white' : 'bg-border text-text-secondary'}`}>2</div>
             <span className="text-sm font-medium">Payment</span>
          </div>
          <div className={`h-1 flex-1 mx-4 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-border'}`}></div>
          <div className={`flex flex-col items-center ${step >= 3 ? 'text-primary' : 'text-border'}`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 3 ? 'bg-primary text-white' : 'bg-border text-text-secondary'}`}>3</div>
             <span className="text-sm font-medium">Confirmation</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-12">
        
        {/* Main Content */}
        <div className="flex-1">
          {step === 1 && (
            <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Shipping Address</h2>
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">First Name</label>
                    <input type="text" value={user.firstName} disabled className="w-full border border-border rounded-lg px-4 py-2 bg-gray-50 text-text-secondary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Last Name</label>
                    <input type="text" value={user.lastName} disabled className="w-full border border-border rounded-lg px-4 py-2 bg-gray-50 text-text-secondary" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Street Address</label>
                  <input required type="text" value={shippingAddress.street} onChange={e => setShippingAddress({...shippingAddress, street: e.target.value})} className="w-full border border-border rounded-lg px-4 py-2 focus:ring-primary focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">City</label>
                    <input required type="text" value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})} className="w-full border border-border rounded-lg px-4 py-2 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">State / Province</label>
                    <input required type="text" value={shippingAddress.state} onChange={e => setShippingAddress({...shippingAddress, state: e.target.value})} className="w-full border border-border rounded-lg px-4 py-2 focus:ring-primary focus:border-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">ZIP / Postal Code</label>
                    <input required type="text" value={shippingAddress.zip} onChange={e => setShippingAddress({...shippingAddress, zip: e.target.value})} className="w-full border border-border rounded-lg px-4 py-2 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Country</label>
                    <input required type="text" value={shippingAddress.country} onChange={e => setShippingAddress({...shippingAddress, country: e.target.value})} className="w-full border border-border rounded-lg px-4 py-2 focus:ring-primary focus:border-primary" />
                  </div>
                </div>
                <div className="pt-6">
                  <button type="submit" disabled={!cartData || cartData.items.length === 0} className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-light hover:text-primary transition-colors shadow-md disabled:opacity-50">
                    Continue to Payment
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 2 && checkoutData && (
            <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
               <h2 className="text-2xl font-bold text-text-primary mb-6">Payment Details</h2>
               <Elements stripe={getStripe()} options={{ clientSecret: checkoutData.clientSecret, appearance: { theme: 'stripe' } }}>
                 <CheckoutPaymentForm clientSecret={checkoutData.clientSecret} orderId={checkoutData.orderId} onConfirm={handleConfirmation} />
               </Elements>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white p-12 rounded-2xl border border-border shadow-sm text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-semantic-success text-white rounded-full flex items-center justify-center mb-6">
                <Check className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-text-primary mb-2">Order Confirmed!</h2>
              <p className="text-text-secondary mb-8">
                Thank you for your purchase. We have received your order and will begin processing it right away.
              </p>
              <button onClick={() => router.push('/account/orders')} className="px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-light hover:text-primary transition-colors">
                View Order Tracking
              </button>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full md:w-[350px]">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm sticky top-24">
            <h3 className="font-bold text-lg mb-4 pb-4 border-b border-border">Order Summary</h3>
            {cartLoading ? (
               <Skeleton className="h-32 w-full" />
            ) : cartData ? (
               <>
                 <div className="space-y-4 mb-6">
                   {cartData.items.map((item: any) => (
                     <div key={item.product._id} className="flex justify-between text-sm">
                       <span className="text-text-secondary line-clamp-1 flex-1 pr-4">{item.quantity}x {item.name}</span>
                       <span className="font-medium text-text-primary">${(item.price * item.quantity).toFixed(2)}</span>
                     </div>
                   ))}
                 </div>
                 <div className="space-y-2 border-t border-border pt-4 text-sm">
                   <div className="flex justify-between text-text-secondary">
                     <span>Subtotal</span>
                     <span>${cartData.subtotal.toFixed(2)}</span>
                   </div>
                   {cartData.discount > 0 && (
                     <div className="flex justify-between text-semantic-success">
                       <span>Discount</span>
                       <span>-${cartData.discount.toFixed(2)}</span>
                     </div>
                   )}
                   <div className="flex justify-between font-bold text-lg text-text-primary mt-4 pt-4 border-t border-border">
                     <span>Total</span>
                     <span>${cartData.total.toFixed(2)}</span>
                   </div>
                 </div>
               </>
            ) : (
              <p className="text-text-secondary">No items in cart</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
