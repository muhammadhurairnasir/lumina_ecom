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

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name is too short'),
  lastName: z.string().min(2, 'Last name is too short'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/^(?=.*[A-Z])(?=.*\d)/, 'Must contain 1 uppercase and 1 number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useStore(state => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const { confirmPassword, ...payload } = data;
      const res = await api.post('/auth/register', payload);
      const { accessToken, user } = res.data.data;
      setAuth(accessToken, user);

      // Merge guest cart to user cart
      try {
        await api.post('/cart/merge');
      } catch (mergeErr) {
        console.error('Failed to merge cart', mergeErr);
      }

      toast.success('Account created successfully!');
      router.push(redirect);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center py-12" />}>
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-text-primary">
          Create an account
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Or{' '}
          <Link href={`/login?redirect=${redirect}`} className="font-medium text-primary hover:text-primary-light transition-colors">
            sign in to existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-border sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary">First name</label>
                <div className="mt-1">
                  <input
                    {...register('firstName')}
                    type="text"
                    className="block w-full appearance-none rounded-md border border-border focus:ring-primary px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 sm:text-sm"
                  />
                  {errors.firstName && <p className="mt-1 text-xs text-semantic-error">{errors.firstName.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">Last name</label>
                <div className="mt-1">
                  <input
                    {...register('lastName')}
                    type="text"
                    className="block w-full appearance-none rounded-md border border-border focus:ring-primary px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 sm:text-sm"
                  />
                  {errors.lastName && <p className="mt-1 text-xs text-semantic-error">{errors.lastName.message}</p>}
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text-primary">Email address</label>
              <div className="mt-1">
                <input
                  {...register('email')}
                  type="email"
                  className="block w-full appearance-none rounded-md border border-border focus:ring-primary px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 sm:text-sm"
                />
                {errors.email && <p className="mt-1 text-xs text-semantic-error">{errors.email.message}</p>}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-text-primary">Password</label>
              <div className="mt-1 relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="block w-full appearance-none rounded-md border border-border focus:ring-primary px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 sm:text-sm"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-semantic-error">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-text-primary">Confirm Password</label>
              <div className="mt-1 relative">
                <input
                  {...register('confirmPassword')}
                  type={showPassword ? 'text' : 'password'}
                  className="block w-full appearance-none rounded-md border border-border focus:ring-primary px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 sm:text-sm"
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-semantic-error">{errors.confirmPassword.message}</p>}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center items-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-light hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                Create Account
              </button>
            </div>

          </form>
        </div>
      </div>
      </div>
    </Suspense>
  );
}
