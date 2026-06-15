// app/employee/layout.jsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Loading from '@/components/Loading';
import EmployeeNavbar from '@/components/employee/EmployeeNavbar';
import EmployeeSidebar from '@/components/employee/EmployeeSidebar';

export default function EmployeeLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [employee,   setEmployee]   = useState(null);
  const [storeInfo,  setStoreInfo]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (pathname === '/employee/login') {
      setLoading(false);
      return;
    }

    const token   = localStorage.getItem('employeeToken');
    const empData = localStorage.getItem('employeeData');

    if (!token || !empData) {
      router.replace('/employee/login');
      return;
    }

    fetch('/api/store/employee-auth', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();

        if (!data.valid) {
          localStorage.removeItem('employeeToken');
          localStorage.removeItem('employeeData');
          router.replace('/employee/login');
          return;
        }

        setEmployee(data.employee);
        setStoreInfo(data.store);
        setLoading(false);
      })
      .catch(() => {
        router.replace('/employee/login');
      });
  }, [pathname]);

  if (pathname === '/employee/login') {
    return <>{children}</>;
  }

  if (loading) return <Loading />;
  if (!employee) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <EmployeeNavbar
        storeInfo={storeInfo}
        employee={employee}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex flex-1 h-full overflow-hidden relative">
        {mobileOpen && (
          <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
        )}
        <div className={`fixed md:relative md:flex h-full z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <EmployeeSidebar storeInfo={storeInfo} employee={employee} closeMobileMenu={() => setMobileOpen(false)} />
        </div>
        {/* ✅ Removed p-5 / lg:pl-12 / lg:pt-12 */}
        <div className="flex-1 h-full overflow-y-auto bg-slate-50">
          {children}
          <div className="pb-4 text-center text-xs text-slate-400">
            <p>© {new Date().getFullYear()} {storeInfo?.name} • Employee Portal</p>
          </div>
        </div>
      </div>
    </div>
  );
}