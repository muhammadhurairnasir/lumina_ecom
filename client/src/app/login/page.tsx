'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useStore(state => state.setAuth);
  const setCart = useStore(state => state.setCart);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const res = await api.post('/auth/login', data);
      const { accessToken, user } = res.data.data;
      setAuth(accessToken, user);

      // Merge guest cart into user cart and sync store
      try {
        const mergeRes = await api.post('/cart/merge');
        if (mergeRes.data?.data?.cart) {
          setCart(mergeRes.data.data.cart);
        } else {
          // No guest cart was merged — just fetch the user's existing cart
          const cartRes = await api.get('/cart');
          if (cartRes.data?.data?.cart) {
            setCart(cartRes.data.data.cart);
          }
        }
      } catch (mergeErr) {
        // Non-fatal: cart merge failed, try fetching user cart directly
        try {
          const cartRes = await api.get('/cart');
          if (cartRes.data?.data?.cart) setCart(cartRes.data.data.cart);
        } catch { /* ignore */ }
      }

      toast.success('Welcome back!');
      router.push(redirect);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-text-primary">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Or{' '}
          <Link href={`/register?redirect=${redirect}`} className="font-medium text-primary hover:text-primary-light transition-colors">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-border sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text-primary">Email address</label>
              <div className="mt-1">
                <input
                  {...register('email')}
                  type="email"
                  className={`block w-full appearance-none rounded-md border ${errors.email ? 'border-semantic-error focus:ring-semantic-error' : 'border-border focus:ring-primary'} px-3 py-2 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 sm:text-sm`}
                />
                {errors.email && <p className="mt-2 text-sm text-semantic-error">{errors.email.message}</p>}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-text-primary">Password</label>
              <div className="mt-1 relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`block w-full appearance-none rounded-md border ${errors.password ? 'border-semantic-error focus:ring-semantic-error' : 'border-border focus:ring-primary'} px-3 py-2 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 sm:text-sm`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-sm text-semantic-error">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-text-secondary">Remember me</label>
              </div>
              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-primary hover:text-primary-light transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center items-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-light hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                Sign in
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center py-12" />}>
      <LoginForm />
    </Suspense>
  );
}
