// app/(public)/cart/page.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  ShoppingCart, Trash2, Heart, ArrowRight, Plus, Minus, ChevronLeft,
  CheckCircle, X, Gift, Tag, TrendingDown, AlertCircle,
  AlertTriangle, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { removeFromCart, updateCartQuantity } from '@/lib/features/cart/cartSlice';
import { addToWishlist } from '@/lib/features/wishlist/wishlistSlice';
import OrderSummary from '@/components/OrderSummary';

export default function CartPage() {
  const cartItems = useSelector((state) => state.cart.items || []);
  const cartTotal = useSelector((state) => state.cart.totalPrice || 0);
  const dispatch  = useDispatch();

  const [couponCode,       setCouponCode]       = useState('');
  const [appliedCoupon,    setAppliedCoupon]    = useState(null);
  const [stockMap,         setStockMap]         = useState({});
  const [stockLoading,     setStockLoading]     = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [productToRemove,  setProductToRemove]  = useState(null);

  const fetchLiveStock = useCallback(async () => {
    if (!cartItems.length) return;
    try {
      setStockLoading(true);
      // Use credentials:include — no Bearer token needed
      const res  = await fetch('/api/cart', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const map  = {};
      (data.items || []).forEach((item) => {
        map[item.variantId] = item.availableStock ?? item.stock ?? 0;
      });
      setStockMap(map);
    } catch {
      // silent
    } finally {
      setStockLoading(false);
    }
  }, [cartItems.length]);

  useEffect(() => { fetchLiveStock(); }, []);

  const updateQtyHandler = (item, newQty) => {
    if (newQty < 1) return;
    const available = stockMap[item.variantId] ?? Infinity;
    if (newQty > available) {
      toast.error(`Only ${available} in stock`, { icon: '📦' });
      // Fix: use variantId not id
      dispatch(updateCartQuantity({ variantId: item.variantId, quantity: available }));
      return;
    }
    dispatch(updateCartQuantity({ variantId: item.variantId, quantity: newQty }));
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) { toast.error('Please enter a coupon code'); return; }
    try {
      const res  = await fetch('/api/coupon', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid coupon');
      setAppliedCoupon(data.coupon);
      toast.success('Coupon applied!', { icon: '🎉' });
    } catch (error) {
      toast.error(error.message, { icon: '⚠️' });
    }
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCouponCode(''); toast.success('Coupon removed'); };
  const discount     = appliedCoupon ? (cartTotal * appliedCoupon.discount) / 100 : 0;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center rounded-full bg-green-50/50">
            <ShoppingCart size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">Your cart is empty</h1>
          <p className="text-slate-500 mb-8">Looks like you haven't added anything yet.</p>
          <Link href="/shop" className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-8 rounded-full">
            Start Shopping <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {showConfirmation && productToRemove && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Remove Item</h3>
              <button onClick={() => { setShowConfirmation(false); setProductToRemove(null); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5">
              <p className="text-slate-600 mb-4">Remove <span className="font-medium">{productToRemove.productName || productToRemove.name}</span> from cart?</p>
              <div className="flex gap-3">
                <button onClick={() => { setShowConfirmation(false); setProductToRemove(null); }}
                  className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50">Cancel</button>
                <button onClick={() => {
                  // Fix: remove by variantId
                  dispatch(removeFromCart(productToRemove.variantId));
                  setShowConfirmation(false);
                  setProductToRemove(null);
                  toast.success('Removed from cart');
                }} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2">
                  <Trash2 size={16} /> Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1 flex items-center gap-3">
              <ShoppingCart size={24} className="text-green-500" /> My Cart
            </h1>
            <p className="text-slate-500">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchLiveStock} disabled={stockLoading}
              className="flex items-center gap-2 text-sm text-slate-500 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw size={14} className={stockLoading ? 'animate-spin' : ''} />
              {stockLoading ? 'Checking...' : 'Refresh stock'}
            </button>
            <Link href="/shop" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium">
              <ChevronLeft size={16} /> Continue Shopping
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 p-6 border-b border-slate-100 text-sm font-medium text-slate-600 bg-slate-50">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => {
                  const available = stockMap[item.variantId] ?? null;
                  const isOut     = available !== null && available === 0;
                  const isLow     = available !== null && available > 0 && available < 5;
                  const atMax     = available !== null && item.quantity >= available;

                  return (
                    <div key={item.variantId} className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-6 items-center ${isOut ? 'bg-red-50/40' : ''}`}>
                      {/* Product */}
                      <div className="col-span-6 flex gap-4 items-center">
                        <Link href={`/product/${item.productId || item.id}`}
                          className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-slate-50 rounded-lg overflow-hidden">
                          <Image
                            src={item.productImage || item.image || '/placeholder.png'}
                            alt={item.productName || item.name || 'Product'}
                            fill className="object-contain p-2" />
                        </Link>
                        <div>
                          <h3 className="font-medium text-slate-800 mb-1 hover:text-green-600 text-sm">
                            <Link href={`/product/${item.productId || item.id}`}>
                              {item.productName || item.name}
                            </Link>
                          </h3>
                          {(item.color || item.size) && (
                            <div className="flex gap-1.5 mb-1">
                              {item.color && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{item.color}</span>}
                              {item.size  && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">{item.size}</span>}
                            </div>
                          )}
                          <div className="flex items-center gap-3 flex-wrap">
                            <button onClick={() => {
                              dispatch(addToWishlist({
                                id:    item.productId || item.id,
                                name:  item.productName || item.name,
                                price: item.price,
                                image: item.productImage || item.image,
                              }));
                              toast.success('Saved to wishlist', { icon: '❤️' });
                            }} className="text-slate-400 hover:text-red-500 text-xs flex items-center gap-1 transition-colors">
                              <Heart size={12} /> Save for later
                            </button>
                          </div>
                          {isOut && <span className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} /> Out of stock</span>}
                          {isLow && !isOut && <span className="mt-1 text-xs text-amber-600 flex items-center gap-1"><AlertTriangle size={11} /> Only {available} left!</span>}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="col-span-2 md:text-center">
                        <span className="font-medium text-slate-800">₹{Number(item.price).toLocaleString('en-IN')}</span>
                      </div>

                      {/* Qty */}
                      <div className="col-span-2">
                        <div className="flex items-center justify-center">
                          <button onClick={() => updateQtyHandler(item, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isOut}
                            className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50">
                            <Minus size={16} />
                          </button>
                          <span className={`w-12 text-center font-medium ${isOut ? 'text-red-500 line-through' : 'text-slate-800'}`}>
                            {item.quantity}
                          </span>
                          <button onClick={() => updateQtyHandler(item, item.quantity + 1)}
                            disabled={isOut || atMax}
                            className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50">
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Total & Remove */}
                      <div className="col-span-2 flex justify-between md:justify-end items-center gap-3">
                        <span className="font-medium text-slate-800">
                          ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                        </span>
                        <button onClick={() => { setProductToRemove(item); setShowConfirmation(true); }}
                          className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Gift size={18} className="text-purple-500" /> Apply Coupon
              </h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-green-600" />
                    <div>
                      <p className="font-semibold text-green-700">{appliedCoupon.code} — {appliedCoupon.discount}% OFF</p>
                      <p className="text-xs text-green-600 flex items-center gap-1"><TrendingDown size={12} /> You saved ₹{discount.toFixed(2)}</p>
                    </div>
                  </div>
                  <button onClick={removeCoupon} className="text-slate-500 hover:text-red-500 p-2"><X size={18} /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" placeholder="Enter coupon code" value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                    className="flex-1 p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 uppercase" />
                  <button onClick={applyCoupon} className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-5 rounded-lg">Apply</button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary totalPrice={cartTotal} items={cartItems} appliedCoupon={appliedCoupon} discount={discount} />
          </div>
        </div>
      </div>
    </>
  );
}