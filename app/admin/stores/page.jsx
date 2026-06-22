// C:\Users\Siddharathan\Desktop\Grocery-Cart\app\admin\stores\page.jsx
'use client';
import StoreInfo from '@/components/admin/StoreInfo';
import Loading from '@/components/Loading';
import { BuildingIcon, StoreIcon, PercentIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminStores() {
  const [stores,            setStores]            = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [editingCommission, setEditingCommission] = useState(null);
  const [commissionInput,   setCommissionInput]   = useState('');

  const fetchStores = async () => {
    try {
      const res  = await fetch('/api/admin/stores', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setStores(data.stores);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (storeId) => {
    try {
      const res  = await fetch('/api/admin/toggle-store', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle');
      toast.success(data.message);
      await fetchStores();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const saveCommission = async (storeId) => {
    const pct = Number(commissionInput);
    if (isNaN(pct) || pct < 0 || pct > 100) { toast.error('Commission must be between 0 and 100'); return; }
    try {
      const res  = await fetch('/api/admin/stores', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, commissionPercentage: pct }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      toast.success(data.message);
      setEditingCommission(null);
      await fetchStores();
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => { fetchStores(); }, []);

  if (loading) return <Loading />;

  return (
    <div className="text-slate-500 mb-28 pt-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl flex items-center gap-2">
          <span className="bg-green-50 text-green-600 p-2 rounded-md inline-flex"><BuildingIcon size={20} /></span>
          All <span className="text-slate-800 font-medium ml-1">Stores</span>
        </h1>
        <div className="flex gap-2">
          <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-medium">{stores.filter((s) => s.isActive).length} Active</span>
          <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-medium">{stores.length} Total</span>
        </div>
      </div>

      {stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 bg-slate-50 rounded-xl border border-slate-200">
          <StoreIcon size={48} className="text-slate-300 mb-4" />
          <h1 className="text-2xl text-slate-400 font-medium">No Approved Stores</h1>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 mt-6">
          {stores.map((store) => (
            <div key={store.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 flex max-md:flex-col gap-5 md:items-center max-w-4xl hover:shadow-md transition-shadow">
              <div className="flex-1">
                <StoreInfo store={store} />
                <div className="mt-3 flex items-center gap-2">
                  <PercentIcon size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-500">Commission:</span>
                  {editingCommission === store.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="100" step="0.5" value={commissionInput}
                        onChange={(e) => setCommissionInput(e.target.value)}
                        className="border border-slate-300 rounded px-2 py-0.5 text-sm w-20 outline-none focus:ring-2 focus:ring-green-100" />
                      <span className="text-sm text-slate-500">%</span>
                      <button onClick={() => saveCommission(store.id)} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Save</button>
                      <button onClick={() => setEditingCommission(null)} className="text-xs text-slate-500 hover:text-slate-700">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingCommission(store.id); setCommissionInput(store.commission?.percentage ?? 0); }}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                      {store.commission?.percentage ?? 0}%
                      <span className="text-xs text-slate-400 font-normal ml-1">(click to edit)</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-medium text-slate-600 text-sm">Status:</p>
                <div className={`flex items-center gap-3 p-1.5 px-3 rounded-full ${store.isActive ? 'bg-green-50' : 'bg-slate-100'}`}>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer"
                      onChange={() => toast.promise(toggleStatus(store.id), { loading: 'Updating...' })}
                      checked={store.isActive} />
                    <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                    <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                  </label>
                  <span className="text-sm font-medium">{store.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}