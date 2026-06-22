// C:\Users\Siddharathan\Desktop\Grocery-Cart\app\(public)\wishlist\page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Heart, ShoppingCart, Trash2, ArrowRight, ChevronLeft,
  AlertTriangle, X, Tag, Eye,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { removeFromWishlist, clearWishlist } from '@/lib/features/wishlist/wishlistSlice';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
  const wishlistItems = useSelector((state) => state.wishlist.items || []);
  const dispatch      = useDispatch();
  const router        = useRouter();

  const [productToRemove,  setProductToRemove]  = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedItems,    setSelectedItems]    = useState([]);

  // Normalize item — handles both { productId, product } and flat shape
  const normalize = (item) => {
    if (item.product) {
      return {
        id:       item.productId || item.product.id,
        name:     item.product.name,
        price:    item.product.price ?? item.product.variants?.[0]?.price ?? 0,
        image:    item.product.images?.[0] || item.product.image || null,
        category: item.product.category || '',
      };
    }
    // Flat shape (added via addToWishlist from cart/product page)
    return {
      id:       item.id || item.productId,
      name:     item.name,
      price:    item.price ?? 0,
      image:    item.image || null,
      category: item.category || '',
    };
  };

  const normalizedItems = wishlistItems.map(normalize);

  useEffect(() => {
    setSelectedItems(normalizedItems.map((i) => i.id));
  }, [wishlistItems.length]);

  const toggleSelect = (id) =>
    setSelectedItems((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleSelectAll = () =>
    setSelectedItems(selectedItems.length === normalizedItems.length ? [] : normalizedItems.map((i) => i.id));

  const handleRemove = (item) => {
    // removeFromWishlist expects productId
    dispatch(removeFromWishlist(item.id));
    setProductToRemove(null);
    toast.success('Removed from wishlist', { icon: '💔' });
  };

  if (normalizedItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center rounded-full bg-red-50/50">
            <Heart size={40} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">Your wishlist is empty</h1>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Discover and save items you love.</p>
          <Link href="/shop" className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium py-3 px-8 rounded-full">
            Discover Products <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Remove Confirmation */}
      {productToRemove && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-full"><AlertTriangle size={20} /></div>
                <h3 className="text-lg font-semibold text-slate-800">Remove Item</h3>
              </div>
              <button onClick={() => setProductToRemove(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5">
              <p className="text-slate-600 mb-4">Remove <span className="font-medium">{productToRemove.name}</span> from wishlist?</p>
              <div className="flex gap-3">
                <button onClick={() => setProductToRemove(null)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50">Cancel</button>
                <button onClick={() => handleRemove(productToRemove)}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2">
                  <Trash2 size={16} /> Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-full"><AlertTriangle size={20} /></div>
                <h3 className="text-lg font-semibold text-slate-800">Clear Wishlist</h3>
              </div>
              <button onClick={() => setShowClearConfirm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5">
              <p className="text-slate-600 mb-4">Are you sure you want to clear all items?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50">Cancel</button>
                <button onClick={() => { dispatch(clearWishlist()); setShowClearConfirm(false); toast.success('Wishlist cleared', { icon: '🗑️' }); }}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2">
                  <Trash2 size={16} /> Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1 flex items-center gap-3">
              <Heart size={24} className="text-red-500" /> My Wishlist
            </h1>
            <p className="text-slate-500">{normalizedItems.length} items saved</p>
          </div>
          <Link href="/shop" className="mt-4 md:mt-0 inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Continue Shopping
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded h-5 w-5 accent-green-600"
                checked={selectedItems.length === normalizedItems.length && normalizedItems.length > 0}
                onChange={handleSelectAll} />
              <span className="text-sm font-medium text-slate-700">
                {selectedItems.length === normalizedItems.length ? 'Deselect All' : 'Select All'}
              </span>
            </label>
            {selectedItems.length > 0 && (
              <button onClick={() => router.push('/shop')}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center gap-2">
                <ShoppingCart size={16} /> Shop Selected
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {normalizedItems.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-10 gap-4 p-6 items-center">
                <div className="col-span-1 flex justify-start">
                  <input type="checkbox" className="rounded h-5 w-5 accent-green-600"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelect(item.id)} />
                </div>

                <div className="col-span-6 flex gap-4 items-center">
                  <Link href={`/product/${item.id}`}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                    {item.image ? (
                      <Image src={item.image} alt={item.name || 'Product'} fill className="object-contain p-2" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Heart size={24} />
                      </div>
                    )}
                  </Link>
                  <div>
                    <h3 className="font-medium text-slate-800 mb-1 hover:text-red-600 transition-colors">
                      <Link href={`/product/${item.id}`}>{item.name}</Link>
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      {item.category && (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                          <Tag size={10} /> {item.category}
                        </span>
                      )}
                      <Link href={`/product/${item.id}`} className="text-slate-400 hover:text-blue-500 text-xs flex items-center gap-1">
                        <Eye size={12} /> View details
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 text-center">
                  {item.price > 0 ? (
                    <span className="font-medium text-slate-800">₹{Number(item.price).toLocaleString('en-IN')}</span>
                  ) : (
                    <span className="text-xs text-slate-400">See product</span>
                  )}
                </div>

                <div className="col-span-1 flex justify-end gap-2">
                  <button onClick={() => router.push(`/product/${item.id}`)}
                    className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors" title="View product">
                    <ShoppingCart size={16} />
                  </button>
                  <button onClick={() => setProductToRemove(item)}
                    className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center flex-wrap gap-4">
          <button onClick={() => router.push('/shop')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-6 rounded-lg shadow-sm">
            <ShoppingCart size={18} /> Shop All Items
          </button>
          <button onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-6 rounded-lg">
            <Trash2 size={18} /> Clear Wishlist
          </button>
        </div>
      </div>
    </>
  );
}