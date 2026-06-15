// components/admin/AdminLayout.jsx

'use client';
import { useEffect, useState } from 'react';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        window.innerWidth < 768 &&
        sidebarOpen &&
        !e.target.closest('.admin-sidebar')
      ) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sidebarOpen]);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <AdminNavbar setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} />
      <div className="flex flex-1 items-start h-full overflow-hidden">
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-slate-900/50 z-10 transition-opacity duration-300"
            aria-hidden="true"
          />
        )}
        <div
          className={`admin-sidebar fixed md:static h-full z-20 transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <AdminSidebar setSidebarOpen={setSidebarOpen} />
        </div>
        {/* ✅ Removed p-4/md:p-6/lg:p-8 and max-w-7xl mx-auto — pages control their own spacing now */}
        <div className="flex-1 h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;