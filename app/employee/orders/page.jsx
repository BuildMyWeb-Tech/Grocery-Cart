// app/employee/orders/page.jsx
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Loading from '@/components/Loading';
import {
  ShoppingBag, ShieldAlert, RefreshCw, Eye, X,
  MapPin, User, FileText, History, ClipboardList,
  Truck, CheckCircle2, Ban, RotateCcw, PackageCheck,
  Box, Navigation,
} from 'lucide-react';
import { PERMISSIONS } from '@/middlewares/authEmployee';
import OrderTimeline from '@/components/OrderTimeline';

// Full enum kept for display — legacy/admin-set statuses must still render correctly
const STATUS_CONFIG = {
  PENDING:          { label: 'Pending',          color: 'bg-blue-100 text-blue-700',      Icon: ClipboardList },
  CONFIRMED:        { label: 'Confirmed',        color: 'bg-violet-100 text-violet-700',   Icon: CheckCircle2 },
  PACKED:           { label: 'Packed',           color: 'bg-amber-100 text-amber-700',     Icon: Box },
  SHIPPED:          { label: 'Shipped',          color: 'bg-cyan-100 text-cyan-700',       Icon: Truck },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700',   Icon: Navigation },
  DELIVERED:        { label: 'Delivered',        color: 'bg-emerald-100 text-emerald-700', Icon: PackageCheck },
  CANCELLED:        { label: 'Cancelled',        color: 'bg-red-100 text-red-700',         Icon: Ban },
  RETURNED:         { label: 'Returned',         color: 'bg-purple-100 text-purple-700',   Icon: RotateCcw },
};

// Grocery primary flow only — matches the same restriction applied to the store-side orders page
const STORE_TRANSITIONS = {
  PENDING:          ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['PACKED',    'CANCELLED'],
  PACKED:           ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED:        [],
  CANCELLED:        [],
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

export default function EmployeeOrdersPage() {
  const [employee,      setEmployee]      = useState(null);
  const [allowed,       setAllowed]       = useState(false);
  const [canUpdate,     setCanUpdate]     = useState(false);
  const [token,         setToken]         = useState(null);
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab,     setActiveTab]     = useState('details');
  const [updating,      setUpdating]      = useState(false);

  useEffect(() => {
    const empData  = localStorage.getItem('employeeData');
    const empToken = localStorage.getItem('employeeToken');
    if (!empData || !empToken) { setLoading(false); return; }
    const parsed = JSON.parse(empData);
    setEmployee(parsed);
    setToken(empToken);
    setAllowed(parsed.isOwner === true || parsed.permissions?.[PERMISSIONS.VIEW_ORDERS] === true);
    setCanUpdate(parsed.isOwner === true || parsed.permissions?.[PERMISSIONS.UPDATE_ORDER_STATUS] === true);
  }, []);

  useEffect(() => {
    if (!token || !allowed) { setLoading(false); return; }
    axios.get('/api/store/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setOrders(data.orders || []))
      .catch((err) => toast.error(err?.response?.data?.error || 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, [token, allowed]);

  const updateStatus = async (orderId, status) => {
    if (!canUpdate) { toast.error('You do not have permission to update order status'); return; }
    try {
      setUpdating(true);
      await axios.post('/api/store/orders', { orderId, status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Status → ${status}`);
      setSelectedOrder(null);
      const { data } = await axios.get('/api/store/orders', { headers: { Authorization: `Bearer ${token}` } });
      setOrders(data.orders || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Loading />;

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4"><ShieldAlert size={36} className="text-red-400" /></div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-slate-500 text-sm">You don't have permission to view orders.</p>
      </div>
    );
  }

  const allowedNext = selectedOrder ? STORE_TRANSITIONS[selectedOrder.status] || [] : [];

  return (
    <div className="space-y-5 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><ShoppingBag size={22} className="text-green-600" /> Orders</h1>
          <p className="text-slate-500 text-sm mt-1">{orders.length} orders found</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <ShoppingBag size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No orders yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-xs text-slate-400 font-mono">#{order.id.slice(0, 8)}</td>
                    <td className="px-5 py-3 font-medium text-slate-700">{order.user?.name || 'Unknown'}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{order.orderItems?.length || 0} items</span>
                    </td>
                    <td className="px-5 py-3 text-green-700 font-semibold">₹{order.total.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => { setSelectedOrder(order); setActiveTab('details'); }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div onClick={() => setSelectedOrder(null)} className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-y-auto max-h-[90vh]">
            <div className="bg-green-600 text-white px-6 pt-6 pb-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Order #{selectedOrder.id.slice(0, 8)}</h2>
                <button onClick={() => setSelectedOrder(null)} className="bg-white/20 p-1.5 rounded-full hover:bg-white/30"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-2"><StatusBadge status={selectedOrder.status} /></div>
            </div>

            <div className="flex border-b border-slate-200 px-6">
              {[
                { key: 'details',  label: 'Details',  icon: <FileText size={14} /> },
                { key: 'timeline', label: 'Timeline', icon: <History size={14} /> },
                ...(canUpdate ? [{ key: 'actions', label: 'Update Status', icon: <ShoppingBag size={14} /> }] : []),
              ].map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition -mb-px ${activeTab === tab.key ? 'border-green-600 text-green-700' : 'border-transparent text-slate-500'}`}>
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
                      <p className="text-sm font-medium text-slate-800">{selectedOrder.user?.name}</p>
                      <p className="text-xs text-slate-500">{selectedOrder.user?.email}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Payment</p>
                      <p className="text-sm font-bold text-slate-800">₹{selectedOrder.total.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-500">{selectedOrder.paymentMethod}</p>
                    </div>
                  </div>

                  {selectedOrder.address && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-5">
                      <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><MapPin size={12} /> Address</p>
                      <p className="text-sm text-slate-600">{selectedOrder.address.street}, {selectedOrder.address.city}, {selectedOrder.address.state}</p>
                    </div>
                  )}

                  <h3 className="font-semibold text-slate-800 text-sm mb-3">Order Items ({selectedOrder.orderItems?.length})</h3>
                  <div className="space-y-2">
                    {selectedOrder.orderItems?.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        {item.variant?.product?.images?.[0] && (
                          <img src={item.variant.product.images[0]} alt="" className="w-10 h-10 rounded object-cover border border-slate-200" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.variant?.product?.name}</p>
                          <div className="flex gap-1.5 mt-0.5 items-center">
                            <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-semibold">{item.variant?.variantName}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-800">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                          <p className="text-xs text-slate-400">×{item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'timeline' && <OrderTimeline timeline={selectedOrder.timeline || []} />}

              {activeTab === 'actions' && canUpdate && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">Current: <StatusBadge status={selectedOrder.status} /></p>
                  {allowedNext.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {allowedNext.map((s) => {
                        const cfg = STATUS_CONFIG[s];
                        const { Icon } = cfg;
                        return (
                          <button key={s} onClick={() => updateStatus(selectedOrder.id, s)} disabled={updating}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition hover:opacity-80 disabled:opacity-50 ${cfg.color}`}>
                            <Icon size={14} /> {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No further transitions available.</p>
                  )}
                </div>
              )}

              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                <button onClick={() => setSelectedOrder(null)} className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}