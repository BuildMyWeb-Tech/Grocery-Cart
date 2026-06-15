// app/(public)/orders/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
import {
  ShoppingBagIcon, FilterIcon, X, MapPin, User, CreditCard,
  History, Package, CheckCircle2, Truck, ClipboardList, Ban,
  RotateCcw, PackageCheck, Box, Navigation, Clock, AlertTriangle, Star,
} from 'lucide-react';
import Link from 'next/link';
import OrderTimeline from '@/components/OrderTimeline';
import RatingModal from '@/components/RatingModal';
import { fetchUserRatings } from '@/lib/features/rating/ratingSlice';

const STATUS_FILTERS = [
  { key: 'all',       label: 'All Orders' },
  { key: 'active',    label: 'Active' },
  { key: 'shipped',   label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_CONFIG = {
  PENDING:          { label: 'Pending',          color: 'bg-blue-100 text-blue-700 border-blue-200',         Icon: ClipboardList },
  CONFIRMED:        { label: 'Confirmed',        color: 'bg-violet-100 text-violet-700 border-violet-200',    Icon: CheckCircle2 },
  PACKED:           { label: 'Packed',           color: 'bg-amber-100 text-amber-700 border-amber-200',       Icon: Box },
  SHIPPED:          { label: 'Shipped',          color: 'bg-cyan-100 text-cyan-700 border-cyan-200',          Icon: Truck },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700 border-orange-200',    Icon: Navigation },
  DELIVERED:        { label: 'Delivered',        color: 'bg-emerald-100 text-emerald-700 border-emerald-200', Icon: PackageCheck },
  CANCELLED:        { label: 'Cancelled',        color: 'bg-red-100 text-red-700 border-red-200',             Icon: Ban },
  RETURNED:         { label: 'Returned',         color: 'bg-purple-100 text-purple-700 border-purple-200',    Icon: RotateCcw },
};

// Customer can cancel only at these statuses
const CANCELLABLE_STATUSES = new Set(['PENDING', 'CONFIRMED']);
// ✅ Customer can request return only when DELIVERED
const RETURNABLE_STATUSES  = new Set(['DELIVERED']);

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

function StarRating({ value }) {
  return (
    <div className="flex gap-0.5">
      {Array(5).fill('').map((_, i) => (
        <Star key={i} size={13} fill={value >= i + 1 ? '#fbbf24' : '#e5e7eb'} strokeWidth={0} />
      ))}
    </div>
  );
}

export default function Orders() {
  const { user, isLoaded }    = useUser();
  const router                = useRouter();
  const dispatch              = useDispatch();
  const { ratings }           = useSelector((state) => state.rating);

  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab,     setActiveTab]     = useState('details');
  const [cancelling,    setCancelling]    = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [returning,     setReturning]     = useState(false);
  const [confirmReturn, setConfirmReturn] = useState(false);
  const [ratingModal,   setRatingModal]   = useState(null);

  const fetchOrders = async () => {
    try {
      const res  = await fetch('/api/orders', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setOrders(data.orders || []);
      // Keep modal in sync with fresh data if open
      if (selectedOrder) {
        const fresh = (data.orders || []).find((o) => o.id === selectedOrder.id);
        if (fresh) setSelectedOrder(fresh);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push('/'); return; }
    fetchOrders();
    dispatch(fetchUserRatings()); // ✅ populate ratings so "already reviewed" detection works
  }, [isLoaded, user]);

  // ── Cancel order (PENDING/CONFIRMED → CANCELLED) ────────────────
  const handleCancelOrder = async (orderId) => {
    try {
      setCancelling(true);
      const res  = await fetch('/api/orders/status', {
        method:      'PUT',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ orderId, newStatus: 'CANCELLED', note: 'Cancelled by customer' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');
      toast.success('Order cancelled successfully');
      setConfirmCancel(false);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCancelling(false);
    }
  };

  // ── ✅ Request return (DELIVERED → RETURNED) ────────────────────
  const handleReturnOrder = async (orderId) => {
    try {
      setReturning(true);
      const res  = await fetch('/api/orders/status', {
        method:      'PUT',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ orderId, newStatus: 'RETURNED', note: 'Return requested by customer' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request return');
      toast.success('Return requested — the store will process it shortly');
      setConfirmReturn(false);
      await fetchOrders();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setReturning(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    switch (activeFilter) {
      case 'active':    return ['PENDING','CONFIRMED','PACKED','SHIPPED','OUT_FOR_DELIVERY'].includes(o.status);
      case 'shipped':   return ['SHIPPED','OUT_FOR_DELIVERY'].includes(o.status);
      case 'delivered': return o.status === 'DELIVERED';
      case 'cancelled': return ['CANCELLED','RETURNED'].includes(o.status);
      default:          return true;
    }
  });

  if (!isLoaded || loading) return <Loading />;

  if (orders.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
        <div className="bg-slate-100 p-5 rounded-full mb-6"><ShoppingBagIcon size={48} className="text-slate-300" /></div>
        <h1 className="text-2xl font-semibold mb-3 text-slate-700">No orders yet</h1>
        <p className="text-slate-500 mb-8 max-w-md">Your order history will appear here once you make your first purchase.</p>
        <Link href="/shop" className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] mx-6">
      <div className="my-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Orders</h1>
            <p className="text-slate-500 text-sm mt-1">Showing {filteredOrders.length} of {orders.length} orders</p>
          </div>
          <div className="hidden md:flex bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
            {STATUS_FILTERS.map((f) => (
              <button key={f.key} onClick={() => setActiveFilter(f.key)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${activeFilter === f.key ? 'bg-slate-800 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="md:hidden flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
            <FilterIcon size={16} className="text-slate-500" />
            <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="text-sm border-none bg-transparent focus:outline-none w-full">
              {STATUS_FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
          <table className="w-full text-slate-500 table-auto">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase">
              <tr>
                <th className="text-left px-6 py-4 font-semibold">Order</th>
                <th className="text-center px-6 py-4 font-semibold max-md:hidden">Total</th>
                <th className="text-left px-6 py-4 font-semibold max-md:hidden">Address</th>
                <th className="text-left px-6 py-4 font-semibold max-md:hidden">Status</th>
                <th className="text-left px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded inline-block mb-1">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{order.store?.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center max-md:hidden">
                    <p className="font-semibold text-slate-800">₹{order.total.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-400">{order.paymentMethod}</p>
                  </td>
                  <td className="px-6 py-4 max-md:hidden">
                    {order.address && (
                      <p className="text-xs text-slate-600 max-w-[160px] truncate">
                        {order.address.city}, {order.address.state}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 max-md:hidden">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => { setSelectedOrder(order); setActiveTab('details'); setConfirmCancel(false); setConfirmReturn(false); }}
                      className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div onClick={() => setSelectedOrder(null)} className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-y-auto max-h-[90vh]">

            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-6 pt-6 pb-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Order #{selectedOrder.id.slice(0, 8)}</h2>
                  <p className="text-blue-200 text-xs mt-0.5">{selectedOrder.store?.name}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="bg-white/20 p-1.5 rounded-full hover:bg-white/30">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <StatusBadge status={selectedOrder.status} />
                {CANCELLABLE_STATUSES.has(selectedOrder.status) && (
                  <span className="text-xs text-blue-200">Cancellable</span>
                )}
                {RETURNABLE_STATUSES.has(selectedOrder.status) && (
                  <span className="text-xs text-blue-200">Eligible for return</span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-6">
              {[
                { key: 'details',  label: 'Details',  icon: <Package size={14} /> },
                { key: 'timeline', label: 'Timeline', icon: <History size={14} /> },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition -mb-px ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'details' && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1"><User size={12} /> Customer</p>
                      <p className="text-sm font-medium text-slate-800">{selectedOrder.user?.name || user?.fullName}</p>
                      <p className="text-xs text-slate-500">{selectedOrder.user?.email || user?.emailAddresses?.[0]?.emailAddress}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1"><CreditCard size={12} /> Payment</p>
                      <p className="text-sm font-bold text-slate-800">₹{selectedOrder.total.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-500 mt-1">{selectedOrder.paymentMethod}</p>
                      <p className="text-xs mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${selectedOrder.isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {selectedOrder.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {selectedOrder.address && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-5">
                      <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><MapPin size={12} /> Delivery Address</p>
                      <p className="text-sm text-slate-700 font-medium">{selectedOrder.address.name}</p>
                      <p className="text-sm text-slate-600">{selectedOrder.address.street}, {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.zip}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedOrder.address.phone}</p>
                    </div>
                  )}

                  <h3 className="font-semibold text-slate-800 text-sm mb-3">Order Items ({selectedOrder.orderItems?.length})</h3>
                  <div className="space-y-2">
                    {selectedOrder.orderItems?.map((item, i) => {
                      const productId = item.variant?.productId || item.variant?.product?.id;
                      const existingRating = ratings.find(
                        (r) => selectedOrder.id === r.orderId && productId === r.productId
                      );
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                          {item.variant?.product?.images?.[0] && (
                            <img src={item.variant.product.images[0]} alt="" className="w-10 h-10 rounded object-cover border border-slate-200" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{item.variant?.product?.name}</p>
                            <div className="flex gap-1.5 mt-0.5">
                              <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{item.variant?.color}</span>
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">{item.variant?.size}</span>
                              <span className="text-xs text-slate-400 font-mono">{item.variant?.sku}</span>
                            </div>
                            {/* ✅ Rating UI — Write Review / show stars */}
                            {selectedOrder.status === 'DELIVERED' && productId && (
                              existingRating ? (
                                <div className="mt-1.5"><StarRating value={existingRating.rating} /></div>
                              ) : (
                                <button
                                  onClick={() => setRatingModal({ orderId: selectedOrder.id, productId })}
                                  className="mt-1.5 text-green-600 hover:bg-green-50 text-xs px-2 py-1 rounded border border-green-200 w-fit"
                                >
                                  Write a Review
                                </button>
                              )
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-800">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                            <p className="text-xs text-slate-400">×{item.quantity}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cancel Section */}
                  {CANCELLABLE_STATUSES.has(selectedOrder.status) && (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      {!confirmCancel ? (
                        <button
                          onClick={() => setConfirmCancel(true)}
                          className="flex items-center gap-2 text-sm text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-lg transition-colors font-medium"
                        >
                          <Ban size={15} /> Cancel Order
                        </button>
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <div className="flex items-start gap-3 mb-4">
                            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-red-700">Cancel this order?</p>
                              <p className="text-xs text-red-500 mt-1">This action cannot be undone. Your payment will be refunded if applicable.</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => setConfirmCancel(false)}
                              className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50">
                              Keep Order
                            </button>
                            <button onClick={() => handleCancelOrder(selectedOrder.id)} disabled={cancelling}
                              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                              {cancelling ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Ban size={14} />}
                              {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ✅ Return Section — DELIVERED → RETURNED */}
                  {RETURNABLE_STATUSES.has(selectedOrder.status) && (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      {!confirmReturn ? (
                        <button
                          onClick={() => setConfirmReturn(true)}
                          className="flex items-center gap-2 text-sm text-purple-600 border border-purple-200 bg-purple-50 hover:bg-purple-100 px-4 py-2.5 rounded-lg transition-colors font-medium"
                        >
                          <RotateCcw size={15} /> Return Order
                        </button>
                      ) : (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                          <div className="flex items-start gap-3 mb-4">
                            <AlertTriangle size={18} className="text-purple-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-purple-700">Request a return for this order?</p>
                              <p className="text-xs text-purple-500 mt-1">The store will be notified and will process your return request.</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => setConfirmReturn(false)}
                              className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50">
                              Cancel
                            </button>
                            <button onClick={() => handleReturnOrder(selectedOrder.id)} disabled={returning}
                              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                              {returning ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <RotateCcw size={14} />}
                              {returning ? 'Requesting...' : 'Yes, Request Return'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'timeline' && <OrderTimeline timeline={selectedOrder.timeline || []} />}

              <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                <button onClick={() => setSelectedOrder(null)} className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {ratingModal && <RatingModal ratingModal={ratingModal} setRatingModal={setRatingModal} />}
    </div>
  );
}