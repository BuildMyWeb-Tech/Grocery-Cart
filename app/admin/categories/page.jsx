// app/admin/categories/page.jsx
'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import {
  LayersIcon, PlusCircle, Trash2, Loader2, UploadCloud, X,
  AlertTriangle, ImageIcon, Pencil, ChevronLeft, Upload, Globe, Store,
} from 'lucide-react';

export default function AdminCategoriesPage() {
  const fileInputRef = useRef(null);
  const [categories,    setCategories]    = useState([]);
  const [storeCategories, setStoreCategories] = useState([]); // ✅ NEW
  const [loading,       setLoading]       = useState(true);
  const [storeCatLoading, setStoreCatLoading] = useState(true); // ✅ NEW
  const [submitting,    setSubmitting]    = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [editingId,     setEditingId]     = useState(null);
  const [form,          setForm]          = useState({ name: '', description: '' });
  const [imageFile,     setImageFile]     = useState(null);
  const [imagePreview,  setImagePreview]  = useState(null);
  const [deleteModal,   setDeleteModal]   = useState({ open: false, id: null, name: '' });
  const [deleting,      setDeleting]      = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res  = await fetch('/api/admin/categories', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setCategories(data.categories || []);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  // ✅ NEW — fetch ALL categories (global + every store's) via /api/categories
  // Admin role returns where:{} → all categories including storeId-owned ones
  const fetchStoreCategories = async () => {
    try {
      setStoreCatLoading(true);
      const res  = await fetch('/api/categories', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      // Only show store-scoped categories here (global ones are managed above)
      setStoreCategories((data.categories || []).filter((c) => !c.isGlobal));
    } catch { toast.error('Failed to load store categories'); }
    finally { setStoreCatLoading(false); }
  };

  useEffect(() => { fetchCategories(); fetchStoreCategories(); }, []);

  const clearImage = () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(null); setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openAddForm  = () => { setEditingId(null); setForm({ name: '', description: '' }); clearImage(); setShowForm(true); };
  const openEditForm = (cat) => { setEditingId(cat.id); setForm({ name: cat.name, description: cat.description }); setImageFile(null); setImagePreview(cat.image); if (fileInputRef.current) fileInputRef.current.value = ''; setShowForm(true); };
  const closeForm    = () => { setShowForm(false); setEditingId(null); setForm({ name: '', description: '' }); clearImage(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId && !imageFile) { toast.error('Please upload a category image'); return; }
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      if (imageFile) fd.append('image', imageFile);

      let res, data;
      if (editingId) {
        fd.append('id', editingId);
        res  = await fetch('/api/admin/categories', { method: 'PUT',  credentials: 'include', body: fd });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update');
        toast.success(data.message || 'Updated!');
        setCategories((prev) => prev.map((c) => (c.id === editingId ? data.category : c)));
      } else {
        res  = await fetch('/api/admin/categories', { method: 'POST', credentials: 'include', body: fd });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create');
        toast.success(data.message || 'Created!');
        setCategories((prev) => [data.category, ...prev]);
      }
      closeForm();
    } catch (error) { toast.error(error.message); }
    finally { setSubmitting(false); }
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      const res  = await fetch('/api/admin/categories', {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteModal.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      setCategories((prev) => prev.filter((c) => c.id !== deleteModal.id));
      toast.success('Category deleted');
      setDeleteModal({ open: false, id: null, name: '' });
    } catch (error) { toast.error(error.message); }
    finally { setDeleting(false); }
  };

  if (showForm) {
    return (
      <div className="px-3 sm:px-6 py-4 sm:py-6">
        <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <button onClick={closeForm} className="p-2 hover:bg-slate-100 rounded-full text-slate-600"><ChevronLeft size={20} /></button>
              <h2 className="text-lg font-semibold text-slate-800">{editingId ? 'Edit Global Category' : 'Add Global Category'}</h2>
            </div>
            <button onClick={closeForm} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500"><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Category Image {!editingId && <span className="text-red-500">*</span>}</p>
              <div className="flex items-start gap-4">
                <div className="relative w-36 h-36 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer group hover:border-green-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}>
                  {imagePreview ? (
                    <><Image src={imagePreview} alt="Preview" fill className="object-cover" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"><Upload size={20} className="text-white" /></div></>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-400"><UploadCloud size={24} /><span className="text-xs">Click to upload</span></div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} className="hidden" />
                </div>
                {imagePreview && <button type="button" onClick={clearImage} className="text-xs text-red-500 flex items-center gap-1 mt-1 px-3 py-1.5 border border-red-100 rounded-lg"><X size={12} /> Remove</button>}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-600">Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Electronics" required className="p-2.5 px-3 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-green-100 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-600">Description <span className="text-red-500">*</span></label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} required className="p-2.5 px-3 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-green-100 text-sm resize-none" />
            </div>
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-lg p-3 text-sm text-purple-700">
              <Globe size={16} className="text-purple-500" /> This will be a <strong className="mx-1">global</strong> category visible to all stores.
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={closeForm} disabled={submitting} className="px-5 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-lg text-white text-sm font-medium bg-green-600 hover:bg-green-700 flex items-center gap-2 disabled:opacity-60">
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : editingId ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Global Categories */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 flex items-center gap-2"><LayersIcon size={22} className="text-green-600" /> Global Categories</h1>
          <p className="text-slate-500 text-sm mt-1">Admin creates <span className="text-purple-600 font-medium">global</span> categories visible to all stores.</p>
        </div>
        <button onClick={openAddForm} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
          <PlusCircle size={16} /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-700">All Global Categories</h2>
          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{categories.length} categories</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400"><Loader2 size={18} className="animate-spin" /> Loading...</div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400"><LayersIcon size={40} className="mb-3 text-slate-300" /><p>No global categories yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Image', 'Name', 'Description', 'Products', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-3 sm:px-5 py-3.5 font-medium text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, idx) => (
                  <tr key={cat.id} className={`border-b border-slate-50 hover:bg-slate-50/70 ${idx === categories.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-3 sm:px-5 py-4">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                        {cat.image ? <Image src={cat.image} alt={cat.name} fill className="object-cover" /> : <div className="flex items-center justify-center h-full"><ImageIcon size={16} className="text-slate-300" /></div>}
                      </div>
                    </td>
                    <td className="px-3 sm:px-5 py-4 font-medium text-slate-800">{cat.name}</td>
                    <td className="px-3 sm:px-5 py-4 text-slate-500 hidden md:table-cell max-w-xs"><p className="line-clamp-2">{cat.description}</p></td>
                    <td className="px-3 sm:px-5 py-4"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{cat._count?.products ?? 0} products</span></td>
                    <td className="px-3 sm:px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEditForm(cat)} className="p-2 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600" title="Edit"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteModal({ open: true, id: cat.id, name: cat.name })} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✅ NEW — Store Categories (read-only, all stores) */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 flex items-center gap-2"><Store size={22} className="text-blue-600" /> Store Categories</h1>
          <p className="text-slate-500 text-sm mt-1">Categories created by individual stores. <span className="text-blue-600 font-medium">Read-only</span> — managed by each store owner.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-700">All Store Categories</h2>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{storeCategories.length} categories</span>
        </div>
        {storeCatLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400"><Loader2 size={18} className="animate-spin" /> Loading...</div>
        ) : storeCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400"><Store size={40} className="mb-3 text-slate-300" /><p>No store categories yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Image', 'Name', 'Store', 'Description', 'Products'].map((h) => (
                    <th key={h} className="text-left px-3 sm:px-5 py-3.5 font-medium text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {storeCategories.map((cat, idx) => (
                  <tr key={cat.id} className={`border-b border-slate-50 hover:bg-slate-50/70 ${idx === storeCategories.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-3 sm:px-5 py-4">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                        {cat.image ? <Image src={cat.image} alt={cat.name} fill className="object-cover" /> : <div className="flex items-center justify-center h-full"><ImageIcon size={16} className="text-slate-300" /></div>}
                      </div>
                    </td>
                    <td className="px-3 sm:px-5 py-4 font-medium text-slate-800">{cat.name}</td>
                    <td className="px-3 sm:px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        <Store size={11} /> {cat.store?.name || '—'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-5 py-4 text-slate-500 hidden md:table-cell max-w-xs"><p className="line-clamp-2">{cat.description}</p></td>
                    <td className="px-3 sm:px-5 py-4"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{cat._count?.products ?? 0} products</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteModal({ open: false, id: null, name: '' })} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle size={18} className="text-red-600" /></div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Delete Category</h3>
                <p className="text-slate-500 text-sm mt-1">Delete <span className="font-medium">"{deleteModal.name}"</span>? Products will be unlinked.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModal({ open: false, id: null, name: '' })} disabled={deleting} className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="px-5 py-2.5 rounded-lg text-white text-sm font-medium bg-red-600 hover:bg-red-700 flex items-center gap-2 disabled:opacity-60">
                {deleting ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : <><Trash2 size={14} /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}