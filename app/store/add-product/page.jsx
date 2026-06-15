// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\app\store\add-product\page.jsx
'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingBag, Tag, Package, UploadCloud, X,
  PlusCircle, Loader2, Pencil, Zap, Plus, Trash2, Layers,
} from 'lucide-react';

const PRESET_COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Grey', 'Navy', 'Brown'];
const PRESET_SIZES  = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];

// ✅ Cost removed — costPrice always sent as 0
const emptyVariant = () => ({ color: '', size: '', price: '', sku: '', stock: '' });

export default function AddProductPage() {
  const { getToken } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editId       = searchParams.get('id');
  const isEdit       = Boolean(editId);

  const [loading,        setLoading]        = useState(false);
  const [pageLoading,    setPageLoading]    = useState(isEdit);
  const [categories,     setCategories]     = useState([]);
  const [catLoading,     setCatLoading]     = useState(true);
  const [imagePreviews,  setImagePreviews]  = useState([]);
  const [imageFiles,     setImageFiles]     = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [keyFeatures,    setKeyFeatures]    = useState(['']);
  const [variants,       setVariants]       = useState([emptyVariant()]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    brand: '',
    selectedCategoryIds: [],
  });

  const getAuthHeader = async () => {
    const empToken = typeof window !== 'undefined' ? localStorage.getItem('employeeToken') : null;
    if (empToken) return { Authorization: `Bearer ${empToken}` };
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const headers = await getAuthHeader();
        const { data } = await axios.get('/api/categories', { headers });
        setCategories(data.categories || []);
      } catch {
        toast.error('Failed to load categories');
      } finally {
        setCatLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const fetchProduct = async () => {
      try {
        setPageLoading(true);
        const headers = await getAuthHeader();
        const { data } = await axios.get('/api/store/product', { headers });
        const product = (data.products || []).find((p) => p.id === editId);
        if (!product) { toast.error('Product not found'); router.replace('/store/manage-product'); return; }

        setForm({
          name: product.name,
          description: product.description,
          brand: product.brand || '',
          selectedCategoryIds: (product.categories || []).map((c) => c.category?.id || c.categoryId).filter(Boolean),
        });
        setExistingImages(product.images || []);
        setKeyFeatures(product.keyFeatures?.length ? product.keyFeatures : ['']);

        if (product.variants?.length) {
          setVariants(product.variants.map((v) => ({
            id: v.id,
            color: v.color,
            size: v.size,
            price: v.price,
            sku: v.sku,
            stock: v.stock,
          })));
        }
      } catch {
        toast.error('Failed to load product');
      } finally {
        setPageLoading(false);
      }
    };
    fetchProduct();
  }, [isEdit, editId]);

  const addVariant = () => setVariants((prev) => [...prev, emptyVariant()]);
  const removeVariant = (i) => setVariants((prev) => prev.filter((_, idx) => idx !== i));
  const updateVariant = (i, field, value) =>
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)));

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const total = existingImages.length + imageFiles.length + files.length;
    if (total > 10) { toast.error('Maximum 10 images allowed'); return; }
    setImageFiles((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };
  const removeNewImage      = (i) => { setImageFiles((p) => p.filter((_, idx) => idx !== i)); setImagePreviews((p) => { URL.revokeObjectURL(p[i]); return p.filter((_, idx) => idx !== i); }); };
  const removeExistingImage = (i) => setExistingImages((p) => p.filter((_, idx) => idx !== i));

  const addFeature    = () => setKeyFeatures((p) => [...p, '']);
  const updateFeature = (i, v) => setKeyFeatures((p) => p.map((f, idx) => (idx === i ? v : f)));
  const removeFeature = (i) => setKeyFeatures((p) => p.filter((_, idx) => idx !== i));

  const toggleCategory = (id) =>
    setForm((p) => ({
      ...p,
      selectedCategoryIds: p.selectedCategoryIds.includes(id)
        ? p.selectedCategoryIds.filter((c) => c !== id)
        : [...p.selectedCategoryIds, id],
    }));

  const validateVariants = () => {
    if (!variants.length) { toast.error('At least one variant is required'); return false; }
    const skus = variants.map((v) => v.sku?.trim()).filter(Boolean);
    if (new Set(skus).size !== variants.length) { toast.error('All SKUs must be unique'); return false; }
    for (const [i, v] of variants.entries()) {
      if (!v.color?.trim()) { toast.error(`Variant ${i + 1}: color is required`); return false; }
      if (!v.size?.trim())  { toast.error(`Variant ${i + 1}: size is required`); return false; }
      if (!v.sku?.trim())   { toast.error(`Variant ${i + 1}: SKU is required`); return false; }
      if (!v.price || Number(v.price) <= 0) { toast.error(`Variant ${i + 1}: valid price required`); return false; }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalImages = existingImages.length + imageFiles.length;
    if (totalImages < 1) { toast.error('At least 1 image required'); return; }
    if (totalImages > 10) { toast.error('Maximum 10 images allowed'); return; }
    if (!form.selectedCategoryIds.length) { toast.error('Select at least one category'); return; }
    if (!validateVariants()) return;

    const cleanFeatures = keyFeatures.filter((f) => f.trim());

    try {
      setLoading(true);
      const headers = await getAuthHeader();

      const formData = new FormData();
      formData.append('name',         form.name);
      formData.append('description',  form.description);
      formData.append('brand',        form.brand);
      formData.append('categoryIds',  JSON.stringify(form.selectedCategoryIds));
      formData.append('keyFeatures',  JSON.stringify(cleanFeatures));
      formData.append('variants',     JSON.stringify(variants.map((v) => ({
        ...v,
        price:     Number(v.price),
        costPrice: 0, // ✅ Cost field removed from UI — always 0
        stock:     Math.max(0, Number(v.stock || 0)),
      }))));

      if (isEdit) {
        formData.append('existingImages', JSON.stringify(existingImages));
        imageFiles.forEach((f) => formData.append('images', f));
        const { data } = await axios.put(`/api/store/product?id=${editId}`, formData, { headers });
        toast.success(data.message || 'Product updated');
        router.push('/store/manage-product');
      } else {
        imageFiles.forEach((f) => formData.append('images', f));
        const { data } = await axios.post('/api/store/product', formData, { headers });
        toast.success(data.message || 'Product added');
        setForm({ name: '', description: '', brand: '', selectedCategoryIds: [] });
        imagePreviews.forEach((url) => URL.revokeObjectURL(url));
        setImageFiles([]);
        setImagePreviews([]);
        setKeyFeatures(['']);
        setVariants([emptyVariant()]);
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400"><Loader2 size={20} className="animate-spin" /> Loading product...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-3 sm:px-6 py-4 sm:py-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 flex items-center gap-2">
            {isEdit ? <><Pencil size={22} className="text-indigo-500" /> Edit Product</> : <><PlusCircle size={22} className="text-indigo-500" /> Add New Product</>}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Fill in details, add multiple color/size variants</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Images */}
          <div>
            <p className="font-medium text-slate-700 flex items-center gap-2 mb-3">
              <UploadCloud size={16} className="text-indigo-500" /> Product Images
              <span className="text-xs text-slate-400">(1–10 images)</span>
            </p>
            {existingImages.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-slate-400 mb-2">Current images</p>
                <div className="flex flex-wrap gap-3">
                  {existingImages.map((src, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200">
                      <Image width={96} height={96} src={src} alt="" className="h-20 w-20 sm:h-24 sm:w-24 object-cover" />
                      <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {imagePreviews.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2">New images</p>
                <div className="flex flex-wrap gap-3">
                  {imagePreviews.map((src, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200">
                      <Image width={96} height={96} src={src} alt="" className="h-20 w-20 sm:h-24 sm:w-24 object-cover" />
                      <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-5 sm:p-6 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
              <UploadCloud size={26} className="text-slate-400 mb-2" />
              <span className="text-sm text-slate-500">Click to upload images</span>
              <span className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP (max 10 total)</span>
              <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          {/* Name */}
          <label className="flex flex-col gap-2">
            <span className="font-medium text-slate-700 flex items-center gap-2"><ShoppingBag size={16} className="text-purple-500" /> Product Name</span>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter product name" required className="w-full p-3 px-4 outline-none border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 bg-slate-50" />
          </label>

          {/* Brand */}
          <label className="flex flex-col gap-2">
            <span className="font-medium text-slate-700 flex items-center gap-2"><Tag size={16} className="text-amber-500" /> Brand <span className="text-slate-400 text-xs font-normal">(optional)</span></span>
            <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Nike, Samsung" className="w-full p-3 px-4 outline-none border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 bg-slate-50" />
          </label>

          {/* Description */}
          <label className="flex flex-col gap-2">
            <span className="font-medium text-slate-700 flex items-center gap-2"><Tag size={16} className="text-amber-500" /> Description</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your product" rows={4} required className="w-full p-3 px-4 outline-none border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-100 bg-slate-50" />
          </label>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-slate-700 flex items-center gap-2">
                <Layers size={16} className="text-indigo-500" /> Variants
                <span className="text-xs text-slate-400 hidden sm:inline">(color + size + price + SKU + stock)</span>
              </p>
              <button type="button" onClick={addVariant} className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100">
                <Plus size={14} /> Add Variant
              </button>
            </div>

            {/* ✅ Desktop: grid table. Mobile: stacked cards */}
            <div className="space-y-3">
              {/* Desktop header row — hidden on mobile */}
              <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_1fr_1fr_32px] gap-2 px-1">
                {['Color', 'Size', 'Price (₹)', 'SKU', 'Stock', ''].map((h) => (
                  <span key={h} className="text-xs font-semibold text-slate-500 uppercase">{h}</span>
                ))}
              </div>

              {variants.map((v, i) => (
                <div key={i} className="bg-indigo-50/40 border border-indigo-100 rounded-lg p-3">
                  {/* Mobile: labeled stacked fields */}
                  <div className="flex sm:hidden items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-indigo-600">Variant {i + 1}</span>
                    <button type="button" onClick={() => removeVariant(i)} disabled={variants.length === 1}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_1fr_1fr_32px] gap-2 items-end sm:items-center">
                    {/* Color */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase sm:hidden">Color</label>
                      <input
                        type="text"
                        list={`colors-${i}`}
                        placeholder="Black"
                        value={v.color}
                        onChange={(e) => updateVariant(i, 'color', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                      />
                      <datalist id={`colors-${i}`}>
                        {PRESET_COLORS.map((c) => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                    {/* Size */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase sm:hidden">Size</label>
                      <input
                        type="text"
                        list={`sizes-${i}`}
                        placeholder="M"
                        value={v.size}
                        onChange={(e) => updateVariant(i, 'size', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                      />
                      <datalist id={`sizes-${i}`}>
                        {PRESET_SIZES.map((s) => <option key={s} value={s} />)}
                      </datalist>
                    </div>
                    {/* Price */}
                    <div className="relative">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase sm:hidden">Price (₹)</label>
                      {/* <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm sm:top-[60%]">₹</span> */}
                      <input type="number" placeholder="499" min="0" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} className="w-full pl-6 pr-2 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 bg-white" />
                    </div>
                    {/* SKU */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase sm:hidden">SKU</label>
                      <input type="text" placeholder="BLK-M-001" value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 bg-white font-mono" />
                    </div>
                    {/* Stock */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase sm:hidden">Stock</label>
                      <input type="number" placeholder="0" min="0" value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 bg-white" />
                    </div>
                    {/* Remove — desktop only (mobile has it in header) */}
                    <button type="button" onClick={() => removeVariant(i)} disabled={variants.length === 1} className="hidden sm:flex p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed items-center justify-center">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div>
            <p className="font-medium text-slate-700 flex items-center gap-2 mb-3">
              <Zap size={16} className="text-yellow-500" /> Key Features <span className="text-xs text-slate-400 font-normal">(optional)</span>
            </p>
            <div className="space-y-2">
              {keyFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-500 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <input type="text" value={f} onChange={(e) => updateFeature(i, e.target.value)} placeholder="e.g. Water resistant" className="flex-1 p-2.5 px-4 outline-none border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 bg-slate-50 text-sm" />
                  {keyFeatures.length > 1 && (
                    <button type="button" onClick={() => removeFeature(i)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addFeature} className="mt-3 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium px-3 py-2 rounded-lg hover:bg-indigo-50 transition-all border border-dashed border-indigo-200">
              <Plus size={15} /> Add Feature
            </button>
          </div>

          {/* Categories */}
          <div>
            <p className="font-medium text-slate-700 flex items-center gap-2 mb-3">
              <Package size={16} className="text-blue-500" /> Categories
              {form.selectedCategoryIds.length > 0 && (
                <span className="ml-1 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{form.selectedCategoryIds.length} selected</span>
              )}
            </p>
            {catLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-4"><Loader2 size={16} className="animate-spin" /> Loading...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isSelected = form.selectedCategoryIds.includes(cat.id);
                  return (
                    <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}>
                      {isSelected && <span className="mr-1">✓</span>}
                      {cat.name}
                      <span className={`ml-1.5 text-xs ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {cat.isGlobal ? '(Global)' : '(Mine)'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 pb-6">
            {isEdit && (
              <button type="button" onClick={() => router.push('/store/manage-product')} className="w-full sm:w-auto px-6 py-3 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all">
                Cancel
              </button>
            )}
            <button type="submit" disabled={loading} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> {isEdit ? 'Saving...' : 'Adding...'}</>
              ) : isEdit ? (
                <><Pencil size={18} /> Save Changes</>
              ) : (
                <><PlusCircle size={18} /> Add Product</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}