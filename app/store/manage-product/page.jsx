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
  ChevronDown, ChevronRight, Layers, Check, X, AlertCircle,
} from 'lucide-react';

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
          className="w-20 px-2 py-1 text-sm border border-indigo-400 rounded-md outline-none ring-2 ring-indigo-100 bg-white"
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
    <button onClick={() => setEditing(true)} className="text-sm font-semibold hover:underline transition-colors text-slate-700 hover:text-indigo-600">
      {label === 'price' ? `₹${Number(value).toLocaleString('en-IN')}` : value}
    </button>
  );
}

function ProductRow({ product, onDelete, onVariantUpdate }) {
  const { getToken } = useAuth();
  const router       = useRouter();
  const [expanded, setExpanded]   = useState(false);
  const [variants, setVariants]   = useState(product.variants || []);

  const totalStock   = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  const hasLow       = variants.some((v) => v.stock > 0 && v.stock <= 5);
  const hasOut       = variants.some((v) => v.stock === 0);

  const handleVariantPatch = async (variantId, updates) => {
    try {
      const empToken = typeof window !== 'undefined' ? localStorage.getItem('employeeToken') : null;
      let headers;
      if (empToken) { headers = { Authorization: `Bearer ${empToken}` }; }
      else { const token = await getToken(); headers = { Authorization: `Bearer ${token}` }; }

      const { data } = await axios.patch(`/api/store/product/variant?id=${variantId}`, updates, { headers });
      setVariants((p) => p.map((v) => (v.id === variantId ? { ...v, ...data.variant } : v)));
      onVariantUpdate(product.id, data.variant);
      toast.success('Variant updated');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update');
    }
  };

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
            <div>
              <span className="font-medium text-slate-800 line-clamp-1 max-w-[100px] sm:max-w-[140px] block text-sm">{product.name}</span>
              {product.brand && <span className="text-xs text-slate-400">{product.brand}</span>}
            </div>
          </div>
        </td>
        <td className="px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-semibold ${totalStock === 0 ? 'text-red-600' : hasLow ? 'text-amber-600' : 'text-slate-700'}`}>{totalStock}</span>
            {hasOut && <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">Out</span>}
            {!hasOut && hasLow && <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Low</span>}
          </div>
        </td>
        <td className="px-3 sm:px-5 py-3 sm:py-4">
          <span className={`inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium ${product.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${product.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-400'}`} />
            {product.status}
          </span>
        </td>
        <td className="px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex items-center gap-1">
            <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 text-xs font-medium">
              <Layers size={12} /> <span className="hidden sm:inline">Variants</span> {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            <button onClick={() => router.push(`/store/add-product?id=${product.id}`)} className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200" title="Edit">
              <Pencil size={14} />
            </button>
            <button onClick={() => onDelete(product)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600">
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-indigo-50/30">
          <td colSpan={4} className="px-3 sm:px-5 py-3">
            {!variants.length ? (
              <p className="text-sm text-slate-400 py-2">No variants found.</p>
            ) : (
              <div className="rounded-lg border border-indigo-100 bg-white overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="bg-indigo-50 border-b border-indigo-100">
                      {['Color', 'Size', 'Price', 'Cost', 'SKU', 'Stock', 'Status'].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 font-semibold text-indigo-700 text-xs uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, idx) => (
                      <tr key={v.id} className={`${idx < variants.length - 1 ? 'border-b border-slate-50' : ''}`}>
                        <td className="px-4 py-2.5">
                          <VariantEditor label="color" value={v.color} type="text" onSave={(val) => handleVariantPatch(v.id, { color: val })} />
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 bg-indigo-600 text-white rounded-md text-xs font-bold">{v.size}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <VariantEditor label="price" value={v.price} onSave={(val) => handleVariantPatch(v.id, { price: Number(val) })} />
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">₹{Number(v.costPrice || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{v.sku}</td>
                        <td className="px-4 py-2.5">
                          <VariantEditor label="stock" value={v.stock} onSave={(val) => handleVariantPatch(v.id, { stock: Number(val) })} />
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.stock === 0 ? 'bg-red-50 text-red-600' : v.stock <= 5 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                            {v.stock === 0 ? 'Out' : v.stock <= 5 ? 'Low' : 'OK'}
                          </span>
                        </td>
                      </tr>
                    ))}
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

  const getAuthHeader = async () => {
    const empToken = typeof window !== 'undefined' ? localStorage.getItem('employeeToken') : null;
    if (empToken) return { Authorization: `Bearer ${empToken}` };
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const { data } = await axios.get('/api/store/product', { headers });
      setProducts(data.products || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleVariantUpdate = useCallback((productId, updatedVariant) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return { ...p, variants: (p.variants || []).map((v) => v.id === updatedVariant.id ? { ...v, ...updatedVariant } : v) };
      })
    );
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">Manage Products</h1>
          <p className="text-slate-500 mt-1 text-sm">Click Variants to expand and edit inline</p>
        </div>
        <span className="text-sm text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full">{products.length} products</span>
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
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Product', 'Total Stock', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-3 sm:px-5 py-3 sm:py-4 font-medium text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <ProductRow key={product.id} product={product}
                    onDelete={(p) => setDeleteConfirm({ open: true, productId: p.id, productName: p.name })}
                    onVariantUpdate={handleVariantUpdate} />
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