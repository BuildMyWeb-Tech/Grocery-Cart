// app/store/manage-product/page.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Pencil, Trash2, PackageOpen, Loader2, AlertTriangle,
  ChevronDown, ChevronRight, Layers, Check, X, Search, Leaf, Star, Power, PowerOff,
} from 'lucide-react';

const STATUS_BADGE = {
  ACTIVE:       { bg: 'bg-green-50 text-green-700',   dot: 'bg-green-500',  label: 'Active' },
  OUT_OF_STOCK: { bg: 'bg-yellow-50 text-yellow-700',  dot: 'bg-yellow-500', label: 'Out Of Stock' },
  INACTIVE:     { bg: 'bg-slate-100 text-slate-500',   dot: 'bg-slate-400',  label: 'Inactive' },
  DRAFT:        { bg: 'bg-slate-100 text-slate-500',   dot: 'bg-slate-400',  label: 'Draft' },
};

function VariantEditor({ label, value, type = 'number', onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value);
  const [saving, setSaving]   = useState(false);

  const save = async () => {
    if (type === 'number' && Number(val) === Number(value)) { setEditing(false); return; }
    setSaving(true);
    await onSave(val);
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        {type === 'number' && label === 'price' && <span className="text-slate-400 text-sm">₹</span>}
        <input
          type={type}
          min={type === 'number' ? 0 : undefined}
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          className="w-20 px-2 py-1 text-sm border border-green-400 rounded-md outline-none ring-2 ring-green-100 bg-white"
        />
        <button onClick={save} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        </button>
        <button onClick={() => { setVal(value); setEditing(false); }} className="p-1 text-red-400 hover:bg-red-50 rounded">
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="text-sm font-semibold hover:underline transition-colors text-slate-700 hover:text-green-700">
      {label === 'price' ? `₹${Number(value).toLocaleString('en-IN')}` : value}
    </button>
  );
}

function ProductRow({ product, onDelete, onVariantUpdate, onStatusUpdate }) {
  const { getToken } = useAuth();
  const router       = useRouter();
  const [expanded, setExpanded]       = useState(false);
  const [variants, setVariants]       = useState(product.variants || []);
  const [statusLoading, setStatusLoading] = useState(false);

  const totalStock = variants.reduce((sum, v) => sum + (v.inventory?.quantity || 0), 0);
  const hasLow = variants.some((v) => {
    const qty = v.inventory?.quantity ?? 0;
    const low = v.inventory?.lowStock ?? 10;
    return qty > 0 && qty <= low;
  });
  const hasOut = variants.some((v) => (v.inventory?.quantity ?? 0) === 0);

  const getAuthHeader = async () => {
    const empToken = typeof window !== 'undefined' ? localStorage.getItem('employeeToken') : null;
    if (empToken) return { Authorization: `Bearer ${empToken}` };
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  };

  const handleVariantPatch = async (variantId, updates) => {
    try {
      const headers = await getAuthHeader();
      const { data } = await axios.patch(`/api/store/product/variant?id=${variantId}`, updates, { headers });
      setVariants((p) => p.map((v) => (v.id === variantId ? { ...v, ...data.variant } : v)));
      onVariantUpdate(product.id, data.variant);
      toast.success('Variant updated');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update');
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setStatusLoading(true);
      const headers = await getAuthHeader();
      const { data } = await axios.post('/api/inventory/toggle-status', { productId: product.id, status: newStatus }, { headers });
      onStatusUpdate(product.id, data.product.status);
      toast.success(data.message || 'Status updated');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const badge = STATUS_BADGE[product.status] || STATUS_BADGE.INACTIVE;

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
        <td className="px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            {product.images?.[0] && (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
              </div>
            )}
            <span className="font-medium text-slate-800 line-clamp-1 max-w-[100px] sm:max-w-[160px] block text-sm">{product.name}</span>
          </div>
        </td>

        <td className="px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex flex-wrap gap-1 max-w-[140px]">
            {(product.categories || []).slice(0, 2).map((c, idx) => (
              <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                {c.category?.name || c.name}
              </span>
            ))}
            {(product.categories || []).length > 2 && (
              <span className="text-xs text-slate-400">+{product.categories.length - 2}</span>
            )}
            {!(product.categories || []).length && <span className="text-xs text-slate-400">—</span>}
          </div>
        </td>

        <td className="px-3 sm:px-5 py-3 sm:py-4">
          {product.isOrganic ? <Leaf size={16} className="text-green-600" /> : <span className="text-slate-300">—</span>}
        </td>

        <td className="px-3 sm:px-5 py-3 sm:py-4">
          {product.isFeatured ? <Star size={16} className="text-amber-500 fill-amber-500" /> : <span className="text-slate-300">—</span>}
        </td>

        <td className="px-3 sm:px-5 py-3 sm:py-4">
          <span className={`inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${badge.dot}`} />
            {badge.label}
          </span>
        </td>

        <td className="px-3 sm:px-5 py-3 sm:py-4 text-sm text-slate-600">{variants.length}</td>

        <td className="px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-semibold ${totalStock === 0 ? 'text-red-600' : hasLow ? 'text-amber-600' : 'text-slate-700'}`}>{totalStock}</span>
            {hasOut && <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">Out</span>}
            {!hasOut && hasLow && <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Low</span>}
          </div>
        </td>

        <td className="px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex items-center gap-1">
            <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-green-700 bg-green-50 hover:bg-green-100 text-xs font-medium" title="View variants">
              <Layers size={12} /> {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            <button onClick={() => router.push(`/store/add-product?id=${product.id}`)} className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200" title="Edit">
              <Pencil size={14} />
            </button>
            <button
              onClick={handleToggleStatus}
              disabled={statusLoading}
              title={product.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              className={`p-2 rounded-lg border disabled:opacity-50 ${product.status === 'ACTIVE' ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200' : 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200'}`}
            >
              {statusLoading ? <Loader2 size={14} className="animate-spin" /> : product.status === 'ACTIVE' ? <PowerOff size={14} /> : <Power size={14} />}
            </button>
            <button onClick={() => onDelete(product)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-green-50/30">
          <td colSpan={8} className="px-3 sm:px-5 py-3">
            {!variants.length ? (
              <p className="text-sm text-slate-400 py-2">No variants found.</p>
            ) : (
              <div className="rounded-lg border border-green-100 bg-white overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-green-50 border-b border-green-100">
                      {['Variant', 'Price', 'SKU', 'Stock', 'Min Stock', 'Status'].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 font-semibold text-green-700 text-xs uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, idx) => {
                      const qty = v.inventory?.quantity ?? 0;
                      const low = v.inventory?.lowStock ?? 10;
                      return (
                        <tr key={v.id} className={`${idx < variants.length - 1 ? 'border-b border-slate-50' : ''}`}>
                          <td className="px-4 py-2.5">
                            <VariantEditor label="variantName" value={v.variantName} type="text" onSave={(val) => handleVariantPatch(v.id, { variantName: val })} />
                          </td>
                          <td className="px-4 py-2.5">
                            <VariantEditor label="price" value={v.price} onSave={(val) => handleVariantPatch(v.id, { price: Number(val) })} />
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{v.sku}</td>
                          <td className="px-4 py-2.5">
                            <VariantEditor label="stock" value={qty} onSave={(val) => handleVariantPatch(v.id, { stock: Number(val) })} />
                          </td>
                          <td className="px-4 py-2.5">
                            <VariantEditor label="minStock" value={low} onSave={(val) => handleVariantPatch(v.id, { minStock: Number(val) })} />
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${qty === 0 ? 'bg-red-50 text-red-600' : qty <= low ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                              {qty === 0 ? 'Out' : qty <= low ? 'Low' : 'OK'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function ManageProductPage() {
  const { getToken } = useAuth();
  const [products,      setProducts]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, productId: null, productName: '' });
  const [deleting,      setDeleting]      = useState(false);
  const [filters, setFilters] = useState({ search: '', category: '', status: '', organicOnly: false, featuredOnly: false });

  const getAuthHeader = async () => {
    const empToken = typeof window !== 'undefined' ? localStorage.getItem('employeeToken') : null;
    if (empToken) return { Authorization: `Bearer ${empToken}` };
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  };

  const fetchProducts = async (currentFilters) => {
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const params = {};
      if (currentFilters.search)      params.search   = currentFilters.search;
      if (currentFilters.category)    params.category = currentFilters.category;
      if (currentFilters.status)      params.status   = currentFilters.status;
      if (currentFilters.organicOnly) params.organic  = 'true';
      if (currentFilters.featuredOnly) params.featured = 'true';
      const { data } = await axios.get('/api/store/product', { headers, params });
      setProducts(data.products || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchProducts(filters); }, 400);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleVariantUpdate = useCallback((productId, updatedVariant) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return { ...p, variants: (p.variants || []).map((v) => v.id === updatedVariant.id ? { ...v, ...updatedVariant } : v) };
      })
    );
  }, []);

  const handleStatusUpdate = useCallback((productId, newStatus) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p)));
  }, []);

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      const headers = await getAuthHeader();
      await axios.delete(`/api/store/product?id=${deleteConfirm.productId}`, { headers });
      setProducts((p) => p.filter((prod) => prod.id !== deleteConfirm.productId));
      toast.success('Product deleted');
      setDeleteConfirm({ open: false, productId: null, productName: '' });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">Manage Products</h1>
          <p className="text-slate-500 mt-1 text-sm">Click Variants to expand and edit inline</p>
        </div>
        <span className="text-sm text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full">{products.length} products</span>
      </div>

      {/* Search / Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search product name..." value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-100 bg-slate-50" />
          </div>
          <input type="text" placeholder="Category" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} className="sm:w-40 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-100 bg-slate-50" />
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="sm:w-40 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-100 bg-slate-50">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="OUT_OF_STOCK">Out Of Stock</option>
          </select>
          <label className="flex items-center gap-1.5 text-sm text-slate-600 whitespace-nowrap">
            <input type="checkbox" checked={filters.organicOnly} onChange={(e) => setFilters((f) => ({ ...f, organicOnly: e.target.checked }))} className="w-4 h-4 accent-green-600 rounded" /> Organic
          </label>
          <label className="flex items-center gap-1.5 text-sm text-slate-600 whitespace-nowrap">
            <input type="checkbox" checked={filters.featuredOnly} onChange={(e) => setFilters((f) => ({ ...f, featuredOnly: e.target.checked }))} className="w-4 h-4 accent-green-600 rounded" /> Featured
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-400"><Loader2 size={20} className="animate-spin" /> Loading...</div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <PackageOpen size={48} className="mb-3 text-slate-300" />
            <p className="text-lg font-medium">No products yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Product', 'Category', 'Organic', 'Featured', 'Status', 'Variants', 'Total Stock', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-3 sm:px-5 py-3 sm:py-4 font-medium text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <ProductRow key={product.id} product={product}
                    onDelete={(p) => setDeleteConfirm({ open: true, productId: p.id, productName: p.name })}
                    onVariantUpdate={handleVariantUpdate}
                    onStatusUpdate={handleStatusUpdate} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirm({ open: false, productId: null, productName: '' })} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle size={20} className="text-red-600" /></div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Delete Product</h3>
                <p className="text-slate-500 mt-1 text-sm">Delete <span className="font-medium text-slate-700">"{deleteConfirm.productName}"</span> and all its variants?</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDeleteConfirm({ open: false, productId: null, productName: '' })} disabled={deleting} className="px-4 py-2.5 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-60">
                {deleting ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : <><Trash2 size={16} /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}