// app/(public)/product/[productId]/page.jsx
'use client';
import ProductDetails from '@/components/ProductDetails';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import axios from 'axios';
import { Loader2, Home, ChevronRight, AlertTriangle, CheckCircle, Package } from 'lucide-react';

// ProductDescription as inline component (reviews + features)
function ProductDescription({ product }) {
  const ratings = product.ratings || [];
  const avgRating = ratings.length
    ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
    : 0;

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Description */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Product Description</h2>
        <p className="text-slate-600 leading-relaxed whitespace-pre-line">{product.description}</p>

        {product.keyFeatures?.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-slate-700 mb-3">Key Features</h3>
            <ul className="space-y-2">
              {product.keyFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Customer Reviews</h2>
        <div className="text-center mb-5">
          <p className="text-4xl font-bold text-slate-800">{avgRating}</p>
          <div className="flex justify-center gap-1 mt-1">
            {Array(5).fill('').map((_, i) => (
              <span key={i} className={`text-lg ${Number(avgRating) >= i + 1 ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-1">{ratings.length} reviews</p>
        </div>
        {ratings.length === 0 ? (
          <p className="text-center text-slate-400 text-sm">No reviews yet</p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {ratings.slice(0, 10).map((r, i) => (
              <div key={i} className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex gap-0.5">
                    {Array(5).fill('').map((_, j) => <span key={j} className={`text-sm ${r.rating >= j + 1 ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>)}
                  </div>
                  <span className="text-xs text-slate-500">{r.user?.name || 'Customer'}</span>
                </div>
                {r.review && <p className="text-xs text-slate-600">{r.review}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductPage() {
  const { productId } = useParams();
  const products      = useSelector((state) => state.product.list);
  const [product,     setProduct]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [liveProduct, setLiveProduct] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);

  useEffect(() => { scrollTo(0, 0); }, [productId]);

  useEffect(() => {
    if (products.length > 0) {
      const found = products.find((p) => p.id === productId);
      setProduct(found || null);
      setLoading(false);
    }
  }, [productId, products]);

  // Fetch live product data with current variant stock
  useEffect(() => {
    if (!productId) return;
    const fetch = async () => {
      try {
        setStockLoading(true);
        const { data } = await axios.get(`/api/products?id=${productId}`);
        setLiveProduct(data.product || data.products?.[0] || null);
      } catch {
        // Fallback to Redux
      } finally {
        setStockLoading(false);
      }
    };
    fetch();
  }, [productId]);

  const displayProduct = liveProduct || product;

  const categoryDisplay = displayProduct
    ? (displayProduct.categories || []).map((c) => c.category?.name || c.name).filter(Boolean).join(' + ') ||
      (Array.isArray(displayProduct.category) ? displayProduct.category.join(' + ') : displayProduct.category || '')
    : '';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400"><Loader2 size={22} className="animate-spin" /> Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500 gap-3">
        <p className="text-lg font-medium">Product not found</p>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">← Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="mx-6 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-8 mb-5 flex-wrap">
          <Link href="/" className="flex items-center gap-1 hover:text-slate-700"><Home size={14} /> Home</Link>
          <ChevronRight size={14} className="text-slate-300" />
          <Link href="/shop" className="hover:text-slate-700">Products</Link>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="text-indigo-600 font-medium">{categoryDisplay}</span>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="text-slate-700 font-medium line-clamp-1 max-w-[200px]">{product.name}</span>
        </div>

        {stockLoading && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-400"><Loader2 size={13} className="animate-spin" /> Checking availability...</span>
          </div>
        )}

        <ProductDetails product={displayProduct || product} />
        <ProductDescription product={displayProduct || product} />
      </div>
    </div>
  );
}