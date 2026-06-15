// app/store/login/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LogIn, Mail, Lock, Eye, EyeOff, Store, Users, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function StoreLoginPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('employee'); // ✅ default to employee since owners redirect away

  // ✅ FIX: If already signed in via Clerk (store owner), skip this page
  // entirely and go straight to the dashboard — StoreLayout will
  // verify seller status from there.
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/store');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return; }

    try {
      setLoading(true);

      if (loginType === 'employee') {
        const { data } = await axios.post('/api/employee/login', form);
        localStorage.setItem('employeeToken', data.token);
        localStorage.setItem('employeeData',  JSON.stringify(data.employee));
        localStorage.setItem('employeeStore', JSON.stringify(data.employee.store));
        toast.success(`Welcome, ${data.employee.name}!`);
        router.push('/employee/dashboard');
      } else {
        toast('Store owners sign in via Clerk. Redirecting...', { icon: 'ℹ️' });
        router.push('/sign-in?redirect_url=/store');
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Don't flash the chooser UI while Clerk auth status is loading
  // or while we're redirecting an already-signed-in owner away.
  if (!isLoaded || isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-4xl font-bold text-slate-800">
            <span className="text-green-600">King</span>cart
            <span className="text-green-600 text-5xl leading-none">.</span>
          </Link>
          <p className="text-slate-500 text-sm mt-2">Store Management Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => setLoginType('owner')}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${loginType === 'owner' ? 'bg-green-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              <Store size={15} /> Store Owner
            </button>
            <button
              type="button"
              onClick={() => setLoginType('employee')}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${loginType === 'employee' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              <Users size={15} /> Employee
            </button>
          </div>

          {loginType === 'owner' ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Store size={26} className="text-green-600" />
              </div>
              <h2 className="font-bold text-slate-800 mb-1">Store Owner Login</h2>
              <p className="text-sm text-slate-500 mb-5">Sign in with your KingCart account to access the store panel.</p>
              <Link href="/sign-in?redirect_url=/store"
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2.5 rounded-lg font-medium text-sm transition-all">
                <LogIn size={16} /> Sign in with KingCart
              </Link>
              <p className="text-xs text-slate-400 mt-4">
                Don't have a store?{' '}
                <Link href="/create-store" className="text-green-600 hover:underline font-medium">Apply here</Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Users size={26} className="text-blue-600" />
                </div>
                <h2 className="font-bold text-slate-800">Employee Login</h2>
                <p className="text-xs text-slate-400 mt-1">Use credentials given by your store owner</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@store.com"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <LogIn size={16} />}
                {loading ? 'Signing in...' : 'Sign In as Employee'}
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mt-5">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <ArrowLeft size={12} /> Back to Homepage
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/create-store" className="text-xs text-green-600 hover:underline">Register a Store</Link>
        </div>
      </div>
    </div>
  );
}