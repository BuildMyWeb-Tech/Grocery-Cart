// app/employee/add-product/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PERMISSIONS } from '@/middlewares/authEmployee';
import StoreAddProductPage from '@/app/store/add-product/page';

export default function EmployeeAddProductPage() {
  const [allowed,   setAllowed]   = useState(false);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('employeeToken') : null;
      if (!token) { setPageReady(true); return; }

      try {
        // ✅ Always fetch FRESH permissions from DB — localStorage 'employeeData'
        // can be stale if the owner granted permission after last login.
        const res  = await fetch('/api/store/employee-auth', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.valid && data.employee) {
          const isAllowed = data.employee.isOwner === true
            || data.employee.permissions?.[PERMISSIONS.ADD_PRODUCT] === true;
          setAllowed(isAllowed);

          // Keep localStorage in sync for other pages that still read it
          localStorage.setItem('employeeData', JSON.stringify(data.employee));
        }
      } catch {
        // fall back to cached data if the network call fails
        const empData = localStorage.getItem('employeeData');
        if (empData) {
          const parsed = JSON.parse(empData);
          setAllowed(parsed.isOwner === true || parsed.permissions?.[PERMISSIONS.ADD_PRODUCT] === true);
        }
      } finally {
        setPageReady(true);
      }
    };

    checkPermission();
  }, []);

  if (!pageReady) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert size={36} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-slate-500 text-sm max-w-sm">
          Adding products requires permission from your store owner.
        </p>
        <Link href="/employee/manage-product"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <ArrowLeft size={16} /> View Products Instead
        </Link>
      </div>
    );
  }

  return <StoreAddProductPage />;
}