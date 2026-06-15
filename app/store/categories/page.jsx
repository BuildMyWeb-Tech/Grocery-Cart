// app/store/categories/page.jsx
'use client';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  AlertTriangle, ChevronLeft, Globe, ImagePlus, Info, Layers,
  LayoutGrid, List, Loader2, Pencil, PlusCircle, Search, Store,
  Trash2, Upload, X,
} from 'lucide-react';

export default function StoreCategoriesPage() {
  const { getToken } = useAuth();
  const fileInputRef = useRef(null);

  const [categories,   setCategories]   = useState([]);
  const [pageLoading,  setPageLoading]  = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [viewMode,     setViewMode]     = useState('grid');
  const [showForm,     setShowForm]     = useState(false);
  const [editingId,    setEditingId]    = useState(null);
  const [formData,     setFormData]     = useState({ name: '', description: '' });
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [deleteModal,  setDeleteModal]  = useState({ open: false, id: null, name: '' });
  const [deleting,     setDeleting]     = useState(false);

  const getAuthHeader = async () => {
    const empToken = typeof window !== 'undefined' ? localStorage.getItem('employeeToken') : null;
    if (empToken) return { Authorization: `Bearer ${empToken}` };
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  };

  const fetchCategories = async () => {
    try {
      setPageLoading(true);
      const headers = await getAuthHeader();
      const { data } = await axios.get('/api/categories', { headers });
      setCategories(data.categories || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canModify = (cat) => !cat.isGlobal;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
    clearImage();
    setShowForm(true);
  };

  const openEditForm = (cat) => {
    if (!canModify(cat)) { toast.error('Cannot edit global categories'); return; }
    setEditingId(cat.id);
    setFormData({ name: cat.name, description: cat.description });
    setImageFile(null);
    setImagePreview(cat.image);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '' });
    clearImage();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId && !imageFile) { toast.error('Please upload a category image'); return; }
    try {
      setSubmitting(true);
      const headers = await getAuthHeader();
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('description', formData.description);
      if (imageFile) fd.append('image', imageFile);

      if (editingId) {
        fd.append('id', editingId);
        const { data } = await axios.put('/api/categories', fd, { headers });
        toast.success(data.message || 'Updated!');
        setCategories((p) => p.map((c) => (c.id === editingId ? data.category : c)));
      } else {
        const { data } = await axios.post('/api/categories', fd, { headers });
        toast.success(data.message || 'Created!');
        setCategories((p) => [data.category, ...p]);
      }
      closeForm();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      const headers = await getAuthHeader();
      await axios.delete('/api/categories', { headers, data: { id: deleteModal.id } });
      setCategories((p) => p.filter((c) => c.id !== deleteModal.id));
      toast.success('Category deleted');
      setDeleteModal({ open: false, id: null, name: '' });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const ScopeBadge = ({ cat }) => (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cat.isGlobal ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
      {cat.isGlobal ? <><Globe size={10} /> Global</> : <><Store size={10} /> Mine</>}
    </span>
  );

  // ── Form ──────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div className="px-3 sm:px-6 py-4 sm:py-6">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <button onClick={closeForm} className="p-2 hover:bg-slate-100 rounded-full text-slate-600"><ChevronLeft size={20} /></button>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">{editingId ? 'Edit Category' : 'Add Store Category'}</h2>
            </div>
            <button onClick={closeForm} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Image */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Image {!editingId && <span className="text-red-500">*</span>}
              </label>
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center h-48 relative overflow-hidden cursor-pointer group hover:border-green-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? (
                  <><Image src={imagePreview} alt="Preview" fill className="object-cover group-hover:opacity-80" /><div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><div className="bg-white rounded-full p-2.5"><Upload size={20} className="text-green-600" /></div></div></>
                ) : (
                  <><div className="bg-green-50 p-3 rounded-full mb-2 text-green-500"><ImagePlus size={28} /></div><p className="text-slate-700 text-sm font-medium">Upload image</p></>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
              {imagePreview && <button type="button" onClick={clearImage} className="mt-2 flex items-center gap-1 text-xs text-red-500 hover:text-red-600"><X size={12} /> Remove</button>}
            </div>

            {/* Fields */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name <span className="text-red-500">*</span></label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Premium Shirts" required className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description <span className="text-red-500">*</span></label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} required className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 bg-slate-50 resize-none" />
              </div>
              {!editingId && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                  <Store size={16} className="text-blue-500 flex-shrink-0" />
                  This will be a <strong className="mx-1">store-scoped</strong> category visible to your customers.
                </div>
              )}
            </div>

            <div className="md:col-span-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={closeForm} disabled={submitting} className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm">Cancel</button>
              <button type="submit" disabled={submitting} className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-white flex items-center justify-center gap-1.5 text-sm font-medium disabled:opacity-70 ${editingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : editingId ? <><Pencil size={16} /> Save Changes</> : <><PlusCircle size={16} /> Add Category</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── List View ─────────────────────────────────────────────────
  return (
    <div className="px-3 sm:px-6 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl text-slate-800 font-bold flex items-center gap-2"><div className="p-2 bg-green-50 rounded-lg text-green-600"><Layers size={22} /></div> Product Categories</h1>
          <p className="text-slate-500 text-sm mt-1">
            <span className="text-purple-600 font-medium">Global</span> = admin categories (read-only). <span className="text-blue-600 font-medium">Mine</span> = your store categories (editable).
          </p>
        </div>
        <button onClick={openAddForm} className="w-full sm:w-auto justify-center bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium">
          <PlusCircle size={18} /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative flex-grow max-w-md">
            <input type="text" placeholder="Search categories..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 bg-slate-50" />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="border border-slate-200 rounded-lg flex overflow-hidden self-start">
            <button onClick={() => setViewMode('grid')} className={`p-2.5 ${viewMode === 'grid' ? 'bg-green-50 text-green-600' : 'text-slate-500 hover:bg-slate-50'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2.5 ${viewMode === 'list' ? 'bg-green-50 text-green-600' : 'text-slate-500 hover:bg-slate-50'}`}><List size={18} /></button>
          </div>
        </div>

        {pageLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400"><Loader2 size={20} className="animate-spin" /> Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400"><Layers size={40} className="mb-3 text-slate-300" /><p>No categories found</p></div>
        ) : viewMode === 'grid' ? (
          <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cat) => {
              const owned = canModify(cat);
              return (
                <div key={cat.id} className={`border rounded-xl overflow-hidden hover:shadow-md transition-shadow group ${owned ? 'border-slate-200' : 'border-slate-100 opacity-90'}`}>
                  <div className="relative h-44 bg-slate-100">
                    <Image src={cat.image} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 right-2"><ScopeBadge cat={cat} /></div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-slate-800 mb-1">{cat.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{cat.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{new Date(cat.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {owned && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditForm(cat)} className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"><Pencil size={15} /></button>
                          <button onClick={() => setDeleteModal({ open: true, id: cat.id, name: cat.name })} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Image', 'Name', 'Description', 'Scope', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-3 sm:px-5 py-3.5 font-medium text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat) => {
                  const owned = canModify(cat);
                  return (
                    <tr key={cat.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-3 sm:px-5 py-4"><div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-100"><Image src={cat.image} alt={cat.name} fill className="object-cover" /></div></td>
                      <td className="px-3 sm:px-5 py-4 font-medium text-slate-800">{cat.name}</td>
                      <td className="px-3 sm:px-5 py-4 text-slate-500 max-w-xs"><p className="line-clamp-2">{cat.description}</p></td>
                      <td className="px-3 sm:px-5 py-4"><ScopeBadge cat={cat} /></td>
                      <td className="px-3 sm:px-5 py-4">
                        {owned ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEditForm(cat)} className="p-2 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"><Pencil size={15} /></button>
                            <button onClick={() => setDeleteModal({ open: true, id: cat.id, name: cat.name })} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 flex items-center gap-1"><Globe size={12} /> Read only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <p><span className="font-medium text-blue-800">Tip: </span>Create store categories for your product line. Global categories come from the admin.</p>
      </div>

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteModal({ open: false, id: null, name: '' })} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0"><AlertTriangle size={18} className="text-red-600" /></div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Delete Category</h3>
                <p className="text-slate-500 text-sm mt-1">Delete <span className="font-medium text-slate-700">"{deleteModal.name}"</span>? Products linked to this category will be unlinked.</p>
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