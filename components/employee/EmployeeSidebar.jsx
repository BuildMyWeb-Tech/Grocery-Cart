// components/employee/EmployeeSidebar.jsx
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon, ShoppingBag, BarChart2, Package, Layers,
  X, ChevronLeft, ChevronRight, LogOut, PackageOpen, PlusCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { PERMISSIONS } from '@/middlewares/authEmployee';

const ALL_LINKS = [
  { name: 'Dashboard',       href: '/employee/dashboard',      icon: HomeIcon,    permission: null },
  { name: 'Add Product',     href: '/employee/add-product',    icon: PlusCircle,  permission: PERMISSIONS.ADD_PRODUCT },
  { name: 'Manage Products', href: '/employee/manage-product', icon: PackageOpen, permission: PERMISSIONS.EDIT_PRODUCT },
  { name: 'Inventory',       href: '/employee/inventory',      icon: Package,     permission: PERMISSIONS.MANAGE_INVENTORY },
  { name: 'Orders',          href: '/employee/orders',         icon: ShoppingBag, permission: PERMISSIONS.VIEW_ORDERS },
  { name: 'Categories',      href: '/employee/categories',     icon: Layers,      permission: PERMISSIONS.MANAGE_CATEGORIES },
  { name: 'Reports',         href: '/employee/reports',        icon: BarChart2,   permission: PERMISSIONS.VIEW_REPORTS },
];

export default function EmployeeSidebar({ storeInfo, employee, closeMobileMenu }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const isOwner = employee?.isOwner === true;

  const visibleLinks = ALL_LINKS.filter((link) => {
    if (!link.permission) return true;
    if (isOwner) return true;
    return employee?.permissions?.[link.permission] === true;
  });

  const handleLogout = () => {
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeData');
    localStorage.removeItem('employeeStore');
    router.push('/employee/login');
  };

  return (
    <div className={`inline-flex h-full flex-col border-r border-slate-200 bg-white shadow-sm transition-all ${collapsed ? 'sm:w-20' : 'sm:min-w-60'} w-64`}>
      <div className="flex justify-between items-center p-4 md:hidden border-b border-slate-100">
        <p className="font-medium text-slate-800">Menu</p>
        <button onClick={closeMobileMenu} className="p-1 rounded-md hover:bg-slate-100 text-slate-500"><X size={20} /></button>
      </div>

      <div className={`flex ${collapsed ? 'flex-col' : 'flex-row'} gap-3 items-center pt-5 px-4 pb-3`}>
        <div className="relative flex-shrink-0">
          {storeInfo?.logo ? (
            <Image src={storeInfo.logo} alt={storeInfo?.name || 'Store'} width={44} height={44}
              className="w-11 h-11 rounded-full shadow border-2 border-white object-cover" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold shadow">
              {storeInfo?.name?.charAt(0) || 'S'}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-slate-800 font-medium truncate text-sm">{storeInfo?.name}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isOwner ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {isOwner ? 'Store Owner' : 'Employee'}
            </span>
          </div>
        )}

        <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 hidden md:block flex-shrink-0">
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      <div className="mx-4 border-t border-slate-100 mb-2" />

      <div className="flex-1 overflow-y-auto pb-2">
        {visibleLinks.map((link) => {
          const isActive = link.href === '/employee/dashboard'
            ? pathname === '/employee/dashboard'
            : pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href}
              onClick={() => closeMobileMenu?.()}
              className={`relative flex items-center gap-3 p-2.5 transition-all hover:bg-slate-50 ${collapsed ? 'justify-center' : 'pl-5 pr-3'} ${isActive ? 'bg-gradient-to-r from-green-50 to-slate-50 font-medium text-slate-800' : 'text-slate-500 hover:text-slate-600'}`}>
              <link.icon size={17} className={isActive ? 'text-green-600' : ''} />
              {!collapsed && <span className="truncate text-sm">{link.name}</span>}
              {isActive && <span className="absolute bg-gradient-to-b from-green-400 to-green-600 right-0 top-0 bottom-0 w-1.5 rounded-l" />}
            </Link>
          );
        })}
      </div>

      <div className="border-t border-slate-100 p-3">
        <button onClick={handleLogout} className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-sm ${collapsed ? 'justify-center' : 'pl-3'}`}>
          <LogOut size={15} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}