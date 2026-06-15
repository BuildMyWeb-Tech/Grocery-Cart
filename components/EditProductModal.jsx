// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\components\EditProductModal.jsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import {
  X,
  ShoppingBag,
  Tag,
  IndianRupee,
  Package,
  Save,
  Camera,
  Loader2,
  Hash,
} from 'lucide-react';

export default function EditProductModal({ isOpen, onClose, product, onProductUpdated }) {
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [productInfo, setProductInfo] = useState({
    name: '',
    description: '',
    mrp: '',
    price: '',
    quantity: '',
    selectedCategories: [],
  });

  // Fetch categories from DB
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/api/admin/categories');
        setCategories(data.categories || []);
      } catch {
        toast.error('Failed to load categories');
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Pre-fill form when product changes
  useEffect(() => {
    if (product) {
      setProductInfo({
        name: product.name || '',
        description: product.description || '',
        mrp: product.mrp || '',
        price: product.price || '',
        quantity: product.quantity ?? '',
        // Support both old String and new String[] category
        selectedCategories: Array.isArray(product.category)
          ? product.category
          : product.category
            ? [product.category]
            : [],
      });
    }
  }, [product]);

  const onChangeHandler = (e) => {
    setProductInfo({ ...productInfo, [e.target.name]: e.target.value });
  };

  const toggleCategory = (categoryName) => {
    setProductInfo((prev) => {
      const already = prev.selectedCategories.includes(categoryName);
      return {
        ...prev,
        selectedCategories: already
          ? prev.selectedCategories.filter((c) => c !== categoryName)
          : [...prev.selectedCategories, categoryName],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;

    if (productInfo.selectedCategories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', productInfo.name);
      formData.append('description', productInfo.description);
      formData.append('mrp', productInfo.mrp);
      formData.append('price', productInfo.price);
      formData.append('quantity', productInfo.quantity || 0);
      formData.append('category', JSON.stringify(productInfo.selectedCategories));

      const token = await getToken();
      const { data } = await axios.put(`/api/store/product?id=${product.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(data.message || 'Product updated successfully');

      onProductUpdated({
        ...product,
        name: productInfo.name,
        description: productInfo.description,
        mrp: Number(productInfo.mrp),
        price: Number(productInfo.price),
        quantity: Number(productInfo.quantity),
        category: productInfo.selectedCategories,
        inStock: Number(productInfo.quantity) > 0,
      });

      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-3xl bg-white rounded-xl shadow-xl overflow-hidden z-10"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800">Edit Product</h3>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Current Images (read-only) */}
            <div>
              <p className="font-medium text-slate-700 flex items-center gap-2 mb-3">
                <Camera size={16} className="text-blue-500" />
                Current Images
              </p>
              <div className="flex flex-wrap gap-3">
                {product?.images?.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-lg overflow-hidden border border-slate-200"
                  >
                    <Image
                      width={96}
                      height={96}
                      src={img}
                      alt={`Image ${idx + 1}`}
                      className="h-24 w-24 object-cover"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2 italic">
                To change images, delete this product and create a new one.
              </p>
            </div>

            {/* Name */}
            <label className="flex flex-col gap-2">
              <span className="font-medium text-slate-700 flex items-center gap-2">
                <ShoppingBag size={16} className="text-purple-500" />
                Product Name
              </span>
              <input
                type="text"
                name="name"
                value={productInfo.name}
                onChange={onChangeHandler}
                placeholder="Enter product name"
                className="w-full p-3 px-4 outline-none border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 bg-slate-50 placeholder:text-slate-400"
                required
              />
            </label>

            {/* Description */}
            <label className="flex flex-col gap-2">
              <span className="font-medium text-slate-700 flex items-center gap-2">
                <Tag size={16} className="text-amber-500" />
                Description
              </span>
              <textarea
                name="description"
                value={productInfo.description}
                onChange={onChangeHandler}
                placeholder="Enter product description"
                rows={4}
                className="w-full p-3 px-4 outline-none border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-100 bg-slate-50 placeholder:text-slate-400"
                required
              />
            </label>

            {/* Prices + Quantity */}
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex flex-col gap-2 flex-1">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <IndianRupee size={16} className="text-red-500" />
                  Actual Price (MRP)
                </span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="mrp"
                    value={productInfo.mrp}
                    onChange={onChangeHandler}
                    className="w-full p-3 pl-8 outline-none border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 bg-slate-50"
                    required
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2 flex-1">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <IndianRupee size={16} className="text-green-500" />
                  Offer Price
                </span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="price"
                    value={productInfo.price}
                    onChange={onChangeHandler}
                    className="w-full p-3 pl-8 outline-none border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 bg-slate-50"
                    required
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2 flex-1">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <Hash size={16} className="text-blue-500" />
                  Stock Qty
                </span>
                <input
                  type="number"
                  name="quantity"
                  value={productInfo.quantity}
                  onChange={onChangeHandler}
                  min="0"
                  className="w-full p-3 px-4 outline-none border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 bg-slate-50"
                  required
                />
              </label>
            </div>

            {/* Category Multi-Select */}
            <div>
              <p className="font-medium text-slate-700 flex items-center gap-2 mb-3">
                <Package size={16} className="text-blue-500" />
                Categories
                {productInfo.selectedCategories.length > 0 && (
                  <span className="ml-1 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                    {productInfo.selectedCategories.length} selected
                  </span>
                )}
              </p>

              {categoriesLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm py-3">
                  <Loader2 size={14} className="animate-spin" />
                  Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                  No categories available.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isSelected = productInfo.selectedCategories.includes(cat.name);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.name)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                        }`}
                      >
                        {isSelected && <span className="mr-1">✓</span>}
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
