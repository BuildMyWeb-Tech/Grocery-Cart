// components/admin/AdminSidebar.jsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  CheckSquare,
  Layers,
  BarChart2,
  ShoppingBag,
  Package,
  Settings2,
} from 'lucide-react';

const navLinks = [
  { label: 'Dashboard',    href: '/admin',              icon: LayoutDashboard },
  { label: 'Stores',       href: '/admin/stores',       icon: Store },
  { label: 'Approve',      href: '/admin/approve',      icon: CheckSquare },
  { label: 'Categories',   href: '/admin/categories',   icon: Layers },
  { label: 'Inventory',    href: '/admin/inventory',    icon: Package },
  { label: 'Orders',       href: '/admin/orders',       icon: ShoppingBag },
  { label: 'Coupons',      href: '/admin/coupons',      icon: BarChart2 },
  { label: 'Sales Report', href: '/admin/sales-report', icon: BarChart2 },
];

export default function AdminSidebar({ setSidebarOpen }) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar w-60 min-h-screen bg-white border-r border-slate-100 flex flex-col py-6 px-3">
      <div className="mb-8 px-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Admin Panel
        </span>
      </div>
      <nav className="flex flex-col gap-1">
        {navLinks.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen?.(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-green-50 text-green-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-green-600' : 'text-slate-400'} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}