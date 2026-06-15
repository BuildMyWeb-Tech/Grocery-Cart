// app/employee/categories/page.jsx
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import {
  Layers, Search, X, LayoutGrid, List,
  Loader2, Info, Globe, Store, ShieldAlert,
} from 'lucide-react';
import { PERMISSIONS } from '@/middlewares/authEmployee';

export default function EmployeeCategoriesPage() {
  const [allowed,     setAllowed]     = useState(false);
  const [token,       setToken]       = useState(null);
  const [categories,  setCategories]  = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [viewMode,    setViewMode]    = useState('grid');
  const [pageReady,   setPageReady]   = useState(false);

  useEffect(() => {
    const empData  = localStorage.getItem('employeeData');
    const empToken = localStorage.getItem('employeeToken');
    if (!empData || !empToken) { setPageLoading(false); return; }
    const parsed = JSON.parse(empData);
    setToken(empToken);
    setAllowed(parsed.isOwner === true || parsed.permissions?.[PERMISSIONS.MANAGE_CATEGORIES] === true);
    setPageReady(true);
  }, []);

  useEffect(() => {
    if (!pageReady || !allowed) { setPageLoading(false); return; }
    axios.get('/api/categories', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setPageLoading(false));
  }, [pageReady, allowed, token]);

  const filtered = categories.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Updated: use isGlobal boolean
  const ScopeBadge = ({ cat }) => (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cat.isGlobal ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
      {cat.isGlobal ? <><Globe size={10} /> Global</> : <><Store size={10} /> Store</>}
    </span>
  );

  if (!pageReady && pageLoading) return (
    <div className="flex items-center justify-center py-20 gap-2 text-slate-400"><Loader2 size={20} className="animate-spin" /></div>
  );

  if (pageReady && !allowed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4"><ShieldAlert size={36} className="text-red-400" /></div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-slate-500 text-sm">You don't have permission to view categories.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl text-slate-800 font-bold flex items-center gap-2"><div className="p-2 bg-green-50 rounded-lg text-green-600"><Layers size={24} /></div> Product Categories</h1>
          <p className="text-slate-500 text-sm mt-1">
            <span className="text-purple-600 font-medium">Global</span> = admin categories. <span className="text-blue-600 font-medium">Store</span> = store categories.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700 flex items-center gap-1.5">
          <Info size={13} className="text-blue-500" /> View only
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative flex-grow max-w-md">
            <input type="text" placeholder="Search categories..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 bg-slate-50" />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={16} /></button>}
          </div>
          <div className="border border-slate-200 rounded-lg flex overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-2.5 ${viewMode === 'grid' ? 'bg-green-50 text-green-600' : 'text-slate-500'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2.5 ${viewMode === 'list' ? 'bg-green-50 text-green-600' : 'text-slate-500'}`}><List size={18} /></button>
          </div>
        </div>

        {pageLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400"><Loader2 size={20} className="animate-spin" /> Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400"><Layers size={40} className="mb-3 text-slate-300" /><p>{searchTerm ? 'No results found' : 'No categories yet'}</p></div>
        ) : viewMode === 'grid' ? (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cat) => (
              <div key={cat.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                <div className="relative h-44 bg-slate-100">
                  <Image src={cat.image} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 right-2"><ScopeBadge cat={cat} /></div>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-slate-800 mb-1">{cat.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{cat.description}</p>
                  <span className="text-xs text-slate-400">{new Date(cat.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Image', 'Name', 'Description', 'Scope'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 font-medium text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat) => (
                  <tr key={cat.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-4"><div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-100"><Image src={cat.image} alt={cat.name} fill className="object-cover" /></div></td>
                    <td className="px-5 py-4 font-medium text-slate-800">{cat.name}</td>
                    <td className="px-5 py-4 text-slate-500 max-w-xs hidden md:table-cell"><p className="line-clamp-2">{cat.description}</p></td>
                    <td className="px-5 py-4"><ScopeBadge cat={cat} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
        Categories are <strong className="mx-1">view-only</strong> in the employee portal.
      </div>
    </div>
  );
}