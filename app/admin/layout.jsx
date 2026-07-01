// C:\Users\Siddharathan\Desktop\Grocery-Cart\app\admin\layout.jsx
// app/admin/layout.jsx
// Switch from client-side AdminLayout component to server-side auth check.
// This avoids the Bearer token problem entirely by reading the Clerk session
// server-side before the page renders.

import { auth } from '@clerk/nextjs/server';
import authAdmin from '@/middlewares/authAdmin';
import AdminLayout from '@/components/admin/AdminLayout';
import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { ShieldAlertIcon, ArrowRightIcon } from 'lucide-react';

export const metadata = {
  title: 'GroceryCart. - Admin Dashboard',
  description: 'GroceryCart. - Admin Dashboard',
};

export default async function RootAdminLayout({ children }) {
  // Server-side auth — reads Clerk session cookie directly, no token needed
  const { userId } = await auth();

  // Not logged in at all — show embedded sign-in
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-800">
              <span className="text-green-600">Grocery </span> Cart
              <span className="text-green-600 text-4xl">.</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Admin Dashboard</p>
          </div>
          <SignIn fallbackRedirectUrl="/admin" />
        </div>
      </div>
    );
  }

  // Logged in — check if admin email
  const isAdminUser = await authAdmin(userId);

  if (!isAdminUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg flex flex-col items-center">
          <div className="p-3 bg-red-50 rounded-full mb-4">
            <ShieldAlertIcon size={40} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 mb-3">Access Denied</h1>
          <p className="text-slate-500 mb-2">You are not authorized to access this admin area.</p>
          <p className="text-xs text-slate-400 mb-6">
            Only admin email accounts can access this panel.
          </p>
          <Link
            href="/"
            className="bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-2 py-3 px-8 rounded-lg font-medium transition-colors"
          >
            Go to Home <ArrowRightIcon size={18} />
          </Link>
        </div>
      </div>
    );
  }

  // Admin confirmed — render the admin panel with client layout wrapper
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}