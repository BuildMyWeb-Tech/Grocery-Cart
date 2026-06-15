// app/store/inventory/page.jsx
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@clerk/nextjs';
import { Package, AlertTriangle, XCircle, CheckCircle, Loader2, RefreshCw, Search } from 'lucide-react';

function StockBadge({ quantity, lowStock }) {
  if (quantity === 0) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600"><XCircle size={12} /> Out of Stock</span>;
  if (quantity < lowStock) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600"><AlertTriangle size={12} /> Low Stock</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700"><CheckCircle size={12} /> In Stock</span>;
}

// ✅ NEW — Active/Inactive toggle switch (replaces "Status: OK")
function StatusToggle({ productId, status, onToggled, apiFetch }) {
  const [saving, setSaving] = useState(false);
  const isActive = status === 'ACTIVE';

  const toggle = async () => {
    try {
      setSaving(true);
      const newStatus = isActive ? 'INACTIVE' : 'ACTIVE';
      const res = await apiFetch('/api/inventory/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      onToggled(productId, newStatus);
      toast.success(newStatus === 'ACTIVE' ? 'Product activated' : 'Product deactivated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`relative inline-flex items-center h-6 w-12 rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-slate-300'} disabled:opacity-60`}
      title={isActive ? 'Active — visible to customers' : 'Inactive — hidden from customers'}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
      {saving && <Loader2 size={10} className="absolute right-1 text-white animate-spin" />}
    </button>
  );
}

function EditableThreshold({ inv, onUpdated, apiFetch }) {
  const [lowStock, setLowStock] = useState(inv.lowStock);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setLowStock(inv.lowStock); }, [inv.lowStock]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const cancel = () => { setLowStock(inv.lowStock); setEditing(false); };

  const save = async () => {
    if (lowStock === inv.lowStock) { setEditing(false); return; }
    try {
      setSaving(true);
      const res = await apiFetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: inv.variantId, quantity: inv.quantity, lowStock }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onUpdated(inv.variantId, { lowStock });
      toast.success('Threshold updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update');
      setLowStock(inv.lowStock);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-slate-600 hover:text-indigo-600 hover:underline transition-colors" title="Click to edit">
        {lowStock}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type="number" min="1" value={lowStock}
        onChange={(e) => setLowStock(Math.max(1, Number(e.target.value)))}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
        className="w-20 h-7 text-center text-sm border border-amber-300 rounded-md ring-2 ring-amber-100 outline-none" />
      <button onClick={save} disabled={saving} className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-1">
        {saving && <Loader2 size={10} className="animate-spin" />} Save
      </button>
      <button onClick={cancel} className="px-3 py-1 text-slate-500 text-xs border border-slate-200 rounded-md hover:bg-slate-50">Cancel</button>
    </div>
  );
}

// ✅ Editable stock quantity — Item 2: syncs everywhere via /api/inventory/update
function EditableStock({ inv, onUpdated, apiFetch }) {
  const [qty, setQty] = useState(inv.quantity);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setQty(inv.quantity); }, [inv.quantity]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const cancel = () => { setQty(inv.quantity); setEditing(false); };

  const save = async () => {
    if (qty === inv.quantity) { setEditing(false); return; }
    try {
      setSaving(true);
      const res = await apiFetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: inv.variantId, quantity: qty, lowStock: inv.lowStock }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onUpdated(inv.variantId, { quantity: qty });
      toast.success('Stock updated — synced across all pages');
    } catch (err) {
      toast.error(err.message || 'Failed to update');
      setQty(inv.quantity);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold text-sm transition-colors" title="Click to edit stock">
        {qty}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type="number" min="0" value={qty}
        onChange={(e) => setQty(Math.max(0, Number(e.target.value)))}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
        className="w-20 h-7 text-center text-sm border border-indigo-300 rounded-md ring-2 ring-indigo-100 outline-none" />
      <button onClick={save} disabled={saving} className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-1">
        {saving && <Loader2 size={10} className="animate-spin" />} Save
      </button>
      <button onClick={cancel} className="px-3 py-1 text-slate-500 text-xs border border-slate-200 rounded-md hover:bg-slate-50">Cancel</button>
    </div>
  );
}

export default function StoreInventoryPage() {
  const { getToken } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');

  // ✅ credentials:include + employee bearer fallback
  const apiFetch = useCallback(async (url, options = {}) => {
    const empToken = typeof window !== 'undefined' ? localStorage.getItem('employeeToken') : null;
    const headers = { ...(options.headers || {}) };
    if (empToken) headers.Authorization = `Bearer ${empToken}`;
    return fetch(url, { credentials: 'include', ...options, headers });
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await apiFetch('/api/inventory');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setInventory(data.inventory || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleUpdated = useCallback((variantId, patch) => {
    setInventory((prev) => prev.map((inv) => inv.variantId === variantId ? { ...inv, ...patch } : inv));
  }, []);

  const handleStatusToggled = useCallback((productId, newStatus) => {
    setInventory((prev) => prev.map((inv) =>
      inv.variant?.product?.id === productId
        ? { ...inv, variant: { ...inv.variant, product: { ...inv.variant.product, status: newStatus } } }
        : inv
    ));
  }, []);

  const displayed = inventory.filter((inv) => {
    const name = (inv.variant?.product?.name || '').toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'out') return inv.quantity === 0;
    if (filter === 'low') return inv.quantity > 0 && inv.quantity < inv.lowStock;
    if (filter === 'inactive') return inv.variant?.product?.status !== 'ACTIVE';
    return true;
  });

  const outCount = inventory.filter((i) => i.quantity === 0).length;
  const lowCount = inventory.filter((i) => i.quantity > 0 && i.quantity < i.lowStock).length;
  const okCount  = inventory.filter((i) => i.quantity >= i.lowStock).length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
              <Package size={22} className="text-indigo-600" /> Inventory
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Per-variant stock levels. Toggle product visibility and edit stock — changes sync everywhere instantly.</p>
          </div>
          <button onClick={fetchInventory} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-white transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'In Stock',     count: okCount,  color: 'border-green-100' },
            { label: 'Low Stock',    count: lowCount, color: 'border-amber-100' },
            { label: 'Out of Stock', count: outCount, color: 'border-red-100' },
          ].map((s) => (
            <div key={s.label} className={`bg-white border ${s.color} rounded-xl p-4 shadow-sm`}>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.label === 'In Stock' ? 'text-green-600' : s.label === 'Low Stock' ? 'text-amber-600' : 'text-red-600'}`}>{s.count}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-100" />
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all',      label: 'All' },
              { key: 'low',      label: '⚠ Low' },
              { key: 'out',      label: '✕ Out' },
              { key: 'inactive', label: '◌ Inactive' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === key ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-slate-400"><Loader2 size={20} className="animate-spin" /> Loading inventory...</div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400"><Package size={48} className="mb-3 text-slate-300" /><p className="text-lg font-medium">No records found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Product', 'Color / Size', 'SKU', 'Stock Qty', 'Low Threshold', 'Stock Status', 'Visibility', 'Last Updated'].map((h) => (
                      <th key={h} className="text-left px-5 py-4 font-medium text-slate-500 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((inv, idx) => (
                    <tr key={inv.id} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${inv.quantity === 0 ? 'bg-red-50/30' : inv.quantity < inv.lowStock ? 'bg-amber-50/30' : ''} ${idx === displayed.length - 1 ? 'border-b-0' : ''}`}>
                      <td className="px-5 py-4 font-medium text-slate-800">{inv.variant?.product?.name}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">{inv.variant?.color}</span>
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">{inv.variant?.size}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{inv.variant?.sku}</td>
                      <td className="px-5 py-4">
                        <EditableStock inv={inv} onUpdated={handleUpdated} apiFetch={apiFetch} />
                      </td>
                      <td className="px-5 py-4">
                        <EditableThreshold inv={inv} onUpdated={handleUpdated} apiFetch={apiFetch} />
                      </td>
                      <td className="px-5 py-4"><StockBadge quantity={inv.quantity} lowStock={inv.lowStock} /></td>
                      <td className="px-5 py-4">
                        <StatusToggle
                          productId={inv.variant?.product?.id}
                          status={inv.variant?.product?.status}
                          onToggled={handleStatusToggled}
                          apiFetch={apiFetch}
                        />
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs">
                        {new Date(inv.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}