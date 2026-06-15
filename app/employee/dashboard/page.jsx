// app/employee/dashboard/page.jsx
'use client';
import { useEffect, useState } from 'react';
import {
  ShoppingBag, Package, BarChart2, ShieldCheck, Layers,
  PackageOpen, PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import { PERMISSIONS } from '@/middlewares/authEmployee';

export default function EmployeeDashboard() {
  const [employee,  setEmployee]  = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);

  useEffect(() => {
    const empData  = localStorage.getItem('employeeData');
    const storeRaw = localStorage.getItem('employeeStore');
    if (empData)  setEmployee(JSON.parse(empData));
    if (storeRaw) setStoreInfo(JSON.parse(storeRaw));
  }, []);

  if (!employee) return null;

  const permissions = employee.permissions || {};
  const isOwner     = employee.isOwner === true;

  const allModules = [
    { key: PERMISSIONS.ADD_PRODUCT,       name: 'Add Product',      desc: 'Create new products',              href: '/employee/add-product',    icon: PlusCircle,  color: 'bg-green-50 border-green-200',   iconColor: 'bg-green-100 text-green-600' },
    { key: PERMISSIONS.EDIT_PRODUCT,      name: 'Manage Products',  desc: 'View and update products',         href: '/employee/manage-product', icon: PackageOpen, color: 'bg-indigo-50 border-indigo-200', iconColor: 'bg-indigo-100 text-indigo-600' },
    { key: PERMISSIONS.MANAGE_INVENTORY,  name: 'Inventory',        desc: 'Check product stock levels',       href: '/employee/inventory',      icon: Package,     color: 'bg-amber-50 border-amber-200',   iconColor: 'bg-amber-100 text-amber-600' },
    { key: PERMISSIONS.VIEW_ORDERS,       name: 'Orders',           desc: 'View and manage customer orders',  href: '/employee/orders',         icon: ShoppingBag, color: 'bg-blue-50 border-blue-200',     iconColor: 'bg-blue-100 text-blue-600' },
    { key: PERMISSIONS.MANAGE_CATEGORIES, name: 'Categories',       desc: 'View and manage categories',       href: '/employee/categories',     icon: Layers,      color: 'bg-teal-50 border-teal-200',     iconColor: 'bg-teal-100 text-teal-600' },
    { key: PERMISSIONS.VIEW_REPORTS,      name: 'Reports',          desc: 'View sales and analytics',         href: '/employee/reports',        icon: BarChart2,   color: 'bg-purple-50 border-purple-200', iconColor: 'bg-purple-100 text-purple-600' },
  ];

  const accessibleModules = allModules.filter((m) => isOwner || permissions[m.key] === true);

  // ✅ Only show granted permissions — no red strikethrough for denied ones
  const grantedPermissions = Object.entries(permissions)
    .filter(([, v]) => v === true)
    .map(([k]) => k);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome back, {employee.name} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isOwner ? 'Store Owner' : 'Employee'} • {storeInfo?.name || employee.storeId}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
          <ShieldCheck size={16} className="text-blue-600" />
          <span className="text-sm font-medium text-blue-700">
            {isOwner ? 'Full Access' : `${accessibleModules.length} modules`}
          </span>
        </div>
      </div>

      {/* ✅ Only show granted permissions */}
      {!isOwner && grantedPermissions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-700 mb-3">Your Permissions</p>
          <div className="flex flex-wrap gap-2">
            {grantedPermissions.map((key) => (
              <span key={key}
                className="px-3 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Module cards */}
      {accessibleModules.length > 0 ? (
        <div>
          <p className="text-sm font-medium text-slate-600 mb-3">Quick Access</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {accessibleModules.map((mod) => (
              <Link key={mod.key} href={mod.href}
                className={`flex flex-col gap-3 p-5 rounded-xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 ${mod.color}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mod.iconColor}`}>
                  <mod.icon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{mod.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{mod.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">No modules assigned yet</p>
          <p className="text-slate-400 text-sm mt-1">Contact your store owner to get permissions</p>
        </div>
      )}
    </div>
  );
}