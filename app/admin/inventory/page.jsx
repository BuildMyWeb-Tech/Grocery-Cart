// app/admin/inventory/page.jsx
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  Package, AlertTriangle, XCircle, CheckCircle, Loader2, RefreshCw,
  Search, ArrowUpDown, ChevronLeft, ChevronRight, Store,
} from 'lucide-react';

const PAGE_SIZE = 20;

function StockBadge({ quantity, lowStock }) {
  if (quantity === 0) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600"><XCircle size={12} /> Out of Stock</span>;
  if (quantity < lowStock) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600"><AlertTriangle size={12} /> Low Stock</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700"><CheckCircle size={12} /> In Stock</span>;
}

function VisibilityBadge({ status }) {
  const isActive = status === 'ACTIVE';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

const SORT_OPTIONS = [
  { key: 'storeName',  label: 'Store Name' },
  { key: 'productName',label: 'Product Name' },
  { key: 'quantity',   label: 'Stock Qty' },
  { key: 'lowStock',   label: 'Low Stock' },
  { key: 'updatedAt',  label: 'Last Updated' },
];

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');
  const [sortKey,   setSortKey]   = useState('updatedAt');
  const [sortDir,   setSortDir]   = useState('desc');
  const [page,      setPage]      = useState(1);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch('/api/inventory', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load inventory');
      setInventory(data.inventory || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  // Flatten rows with derived sortable fields
  const rows = useMemo(() => {
    return inventory.map((inv) => ({
      id:          inv.id,
      storeName:   inv.variant?.product?.store?.name || inv.store?.name || '—',
      productName: inv.variant?.product?.name || '—',
      colorSize:   `${inv.variant?.color || ''} / ${inv.variant?.size || ''}`,
      sku:         inv.variant?.sku || '—',
      quantity:    inv.quantity,
      lowStock:    inv.lowStock,
      status:      inv.variant?.product?.status || 'ACTIVE',
      updatedAt:   inv.updatedAt,
    }));
  }, [inventory]);

  const filtered = useMemo(() => {
    let r = rows;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((row) =>
        row.productName.toLowerCase().includes(q) ||
        row.storeName.toLowerCase().includes(q) ||
        row.sku.toLowerCase().includes(q)
      );
    }
    if (filter === 'out')      r = r.filter((row) => row.quantity === 0);
    else if (filter === 'low') r = r.filter((row) => row.quantity > 0 && row.quantity < row.lowStock);
    else if (filter === 'inactive') r = r.filter((row) => row.status !== 'ACTIVE');

    return [...r].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'updatedAt') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, search, filter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const outCount = rows.filter((r) => r.quantity === 0).length;
  const lowCount = rows.filter((r) => r.quantity > 0 && r.quantity < r.lowStock).length;
  const okCount  = rows.filter((r) => r.quantity >= r.lowStock).length;

  return (
    <div className="text-slate-500 pt-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl text-slate-800 font-bold flex items-center gap-2">
            <Package className="h-7 w-7 text-indigo-600" /> Inventory
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Stock levels across all stores</p>
        </div>
        <button onClick={fetchInventory} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-white transition-colors bg-white">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
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

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by product, store, or SKU..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div className="flex gap-2 flex-wrap">
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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-400"><Loader2 size={20} className="animate-spin" /> Loading inventory...</div>
        ) : pageRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400"><Package size={48} className="mb-3 text-slate-300" /><p className="text-lg font-medium">No records found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {[
                    { key: 'storeName',   label: 'Store Name' },
                    { key: 'productName', label: 'Product Name' },
                    { key: 'colorSize',   label: 'Color / Size', sortable: false },
                    { key: 'sku',         label: 'SKU', sortable: false },
                    { key: 'quantity',    label: 'Stock' },
                    { key: 'lowStock',    label: 'Low Stock' },
                    { key: 'status',      label: 'Status', sortable: false },
                    { key: 'updatedAt',   label: 'Last Updated' },
                  ].map((col) => (
                    <th key={col.key} className="text-left px-5 py-4 font-medium text-slate-500 text-xs">
                      {col.sortable === false ? (
                        col.label
                      ) : (
                        <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1 hover:text-slate-800 transition-colors">
                          {col.label}
                          <ArrowUpDown size={11} className={sortKey === col.key ? 'text-indigo-600' : 'text-slate-300'} />
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, idx) => (
                  <tr key={row.id} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${row.quantity === 0 ? 'bg-red-50/30' : row.quantity < row.lowStock ? 'bg-amber-50/30' : ''} ${idx === pageRows.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-4 font-medium text-slate-700">
                      <span className="inline-flex items-center gap-1.5"><Store size={13} className="text-slate-400" /> {row.storeName}</span>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">{row.productName}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5">
                        {row.colorSize.split(' / ').map((v, i) => v && (
                          <span key={i} className={`px-2 py-0.5 rounded text-xs ${i === 0 ? 'bg-slate-100 text-slate-700' : 'bg-indigo-100 text-indigo-700 font-bold'}`}>{v}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{row.sku}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold text-sm">{row.quantity}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{row.lowStock}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        <StockBadge quantity={row.quantity} lowStock={row.lowStock} />
                        <VisibilityBadge status={row.status} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs">
                      {new Date(row.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-sm text-slate-500">
            <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50">
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}