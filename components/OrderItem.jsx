// components/OrderItem.jsx
'use client';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import { useState } from 'react';
import RatingModal from './RatingModal';
import OrderStatusTracker from './OrderStatusTracker';
import OrderTimeline from './OrderTimeline';
import { History, ChevronDown, ChevronUp, Star, Ban, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  PENDING:          'Pending',
  CONFIRMED:        'Confirmed',
  PACKED:           'Packed',
  SHIPPED:          'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED:        'Delivered',
  CANCELLED:        'Cancelled',
  RETURNED:         'Returned',
};

const STATUS_COLORS = {
  PENDING:          'bg-blue-100 text-blue-700',
  CONFIRMED:        'bg-violet-100 text-violet-700',
  PACKED:           'bg-amber-100 text-amber-700',
  SHIPPED:          'bg-cyan-100 text-cyan-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED:        'bg-emerald-100 text-emerald-700',
  CANCELLED:        'bg-red-100 text-red-700',
  RETURNED:         'bg-purple-100 text-purple-700',
};

const CANCELLABLE_STATUSES = new Set(['PENDING', 'CONFIRMED']);

function StarRating({ value }) {
  return (
    <div className="flex gap-0.5">
      {Array(5).fill('').map((_, i) => (
        <Star key={i} size={13} fill={value >= i + 1 ? '#fbbf24' : '#e5e7eb'} strokeWidth={0} />
      ))}
    </div>
  );
}

export default function OrderItem({ order, onOrderUpdated }) {
  const [ratingModal,  setRatingModal]  = useState(null);
  const [showTracker,  setShowTracker]  = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling,    setCancelling]    = useState(false);
  const { ratings } = useSelector((state) => state.rating);

  const statusLabel = STATUS_LABELS[order.status] || order.status?.replace(/_/g, ' ');
  const statusColor = STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-700';

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      const res  = await fetch('/api/orders/status', {
        method:      'PUT',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ orderId: order.id, newStatus: 'CANCELLED', note: 'Cancelled by customer' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');
      toast.success('Order cancelled successfully');
      setConfirmCancel(false);
      onOrderUpdated?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <tr className="text-sm">
        {/* Products */}
        <td className="text-left px-6 py-4">
          <div className="flex flex-col gap-5">
            {order.orderItems.map((item, i) => {
              const variant = item.variant;
              const productImage = variant?.product?.images?.[0] || item.product?.images?.[0];
              const productName  = variant?.product?.name || item.product?.name;
              const productId    = variant?.productId || item.product?.id;

              const existingRating = ratings.find(
                (r) => order.id === r.orderId && productId === r.productId
              );

              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-20 aspect-square bg-slate-100 flex items-center justify-center rounded-md flex-shrink-0 overflow-hidden border border-slate-200">
                    {productImage && (
                      <Image src={productImage} alt={productName || 'Product'} width={56} height={56} className="object-contain" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 text-sm">
                    <p className="font-medium text-slate-700">{productName}</p>
                    {variant && (
                      <div className="flex gap-1.5">
                        {variant.color && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{variant.color}</span>}
                        {variant.size  && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">{variant.size}</span>}
                      </div>
                    )}
                    <p className="text-slate-500 text-xs">₹{item.price} × {item.quantity}</p>
                    <p className="text-slate-400 text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    {existingRating ? (
                      <StarRating value={existingRating.rating} />
                    ) : (
                      order.status === 'DELIVERED' && productId && (
                        <button onClick={() => setRatingModal({ orderId: order.id, productId })}
                          className="text-green-500 hover:bg-green-50 text-xs px-2 py-1 rounded w-fit">
                          Rate Product
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </td>

        {/* Total */}
        <td className="text-center px-6 py-4 max-md:hidden font-medium">₹{order.total.toLocaleString('en-IN')}</td>

        {/* Address */}
        <td className="text-left px-6 py-4 max-md:hidden text-xs text-slate-500">
          {order.address ? (
            <><p>{order.address.street}</p><p>{order.address.city}, {order.address.state} {order.address.zip}</p><p>{order.address.phone}</p></>
          ) : <span>No address</span>}
        </td>

        {/* Status + controls */}
        <td className="text-left px-6 py-4 max-md:hidden">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
          <div className="flex flex-col gap-1 mt-2">
            <button onClick={() => { setShowTracker(!showTracker); setShowTimeline(false); }}
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
              {showTracker ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showTracker ? 'Hide tracker' : 'Track order'}
            </button>
            {order.timeline?.length > 0 && (
              <button onClick={() => { setShowTimeline(!showTimeline); setShowTracker(false); }}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
                <History size={12} />
                {showTimeline ? 'Hide history' : `History (${order.timeline.length})`}
              </button>
            )}
            {/* ✅ Cancel order — preserved from old modal */}
            {CANCELLABLE_STATUSES.has(order.status) && !confirmCancel && (
              <button onClick={() => setConfirmCancel(true)}
                className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                <Ban size={12} /> Cancel order
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Cancel confirmation row */}
      {confirmCancel && (
        <tr><td colSpan={4} className="px-6 py-3 bg-red-50">
          <div className="max-w-md flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">Cancel this order?</p>
              <p className="text-xs text-red-500 mt-1 mb-3">This action cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmCancel(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium hover:bg-white bg-white">
                  Keep Order
                </button>
                <button onClick={handleCancelOrder} disabled={cancelling}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium disabled:opacity-60 flex items-center gap-1.5">
                  {cancelling && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </td></tr>
      )}

      {showTracker && (
        <tr><td colSpan={4} className="px-6 py-2 bg-slate-50"><div className="max-w-xl"><OrderStatusTracker status={order.status} /></div></td></tr>
      )}
      {showTimeline && (
        <tr><td colSpan={4} className="px-6 py-3 bg-slate-50"><div className="max-w-md"><p className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-1"><History size={12} /> Order Timeline</p><OrderTimeline timeline={order.timeline || []} /></div></td></tr>
      )}

      {/* Mobile row */}
      <tr className="md:hidden">
        <td colSpan={5} className="px-6 pb-4">
          {order.address && (
            <p className="text-xs text-slate-500 mb-2">{order.address.street}, {order.address.city}, {order.address.state}</p>
          )}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
            <span className="text-sm font-medium text-slate-800">₹{order.total.toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-2 flex justify-center gap-4">
            <button onClick={() => setShowTracker(!showTracker)} className="text-xs text-blue-500 flex items-center gap-1">
              {showTracker ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showTracker ? 'Hide tracker' : 'Track order'}
            </button>
            {CANCELLABLE_STATUSES.has(order.status) && !confirmCancel && (
              <button onClick={() => setConfirmCancel(true)} className="text-xs text-red-500 flex items-center gap-1">
                <Ban size={12} /> Cancel
              </button>
            )}
          </div>
        </td>
      </tr>
      {showTracker && (
        <tr className="md:hidden"><td colSpan={5} className="px-2 py-2 bg-slate-50"><OrderStatusTracker status={order.status} /></td></tr>
      )}

      <tr><td colSpan={4}><div className="border-b border-slate-200 w-11/12 mx-auto" /></td></tr>

      {ratingModal && <RatingModal ratingModal={ratingModal} setRatingModal={setRatingModal} />}
    </>
  );
}