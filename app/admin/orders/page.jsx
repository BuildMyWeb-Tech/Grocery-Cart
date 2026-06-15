// app/admin/orders/page.jsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import Loading from '@/components/Loading';
import OrderTimeline from '@/components/OrderTimeline';
import toast from 'react-hot-toast';
import {
  Package, Eye, RefreshCw, X, MapPin, User, CreditCard,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  History, Filter, ShieldCheck, Ban, Truck, CheckCircle2,
  PackageCheck, RotateCcw, ClipboardList, Download,
  FileSpreadsheet, Box, Navigation,
} from 'lucide-react';
import * as XLSX from 'xlsx';

const STATUS_CONFIG = {
  PENDING:          { label: 'Pending',          color: 'bg-blue-100 text-blue-700 border-blue-200',      Icon: ClipboardList },
  CONFIRMED:        { label: 'Confirmed',        color: 'bg-violet-100 text-violet-700 border-violet-200', Icon: CheckCircle2 },
  PACKED:           { label: 'Packed',           color: 'bg-amber-100 text-amber-700 border-amber-200',    Icon: Box },
  SHIPPED:          { label: 'Shipped',          color: 'bg-cyan-100 text-cyan-700 border-cyan-200',       Icon: Truck },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700 border-orange-200', Icon: Navigation },
  DELIVERED:        { label: 'Delivered',        color: 'bg-emerald-100 text-emerald-700 border-emerald-200', Icon: PackageCheck },
  CANCELLED:        { label: 'Cancelled',        color: 'bg-red-100 text-red-700 border-red-200',          Icon: Ban },
  RETURNED:         { label: 'Returned',         color: 'bg-purple-100 text-purple-700 border-purple-200', Icon: RotateCcw },
};

const ADMIN_TRANSITIONS = {
  PENDING:          ['CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  CONFIRMED:        ['PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
  PACKED:           ['SHIPPED', 'DELIVERED', 'CANCELLED'],
  SHIPPED:          ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED:        ['RETURNED'],
  CANCELLED:        ['PENDING'],
  RETURNED:         [],
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
      <Icon size={12} className="mr-1" /> {cfg.label}
    </span>
  );
}

export default function AdminOrders() {
  const [orders,        setOrders]        = useState([]);
  const [stores,        setStores]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab,     setActiveTab]     = useState('details');
  const [statusFilter,  setStatusFilter]  = useState('ALL');
  const [storeFilter,   setStoreFilter]   = useState('ALL');
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [page,          setPage]          = useState(1);
  const [total,         setTotal]         = useState(0);
  const [noteInput,     setNoteInput]     = useState('');
  const [updating,      setUpdating]      = useState(false);
  const LIMIT = 20;

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (storeFilter  !== 'ALL') params.set('storeId', storeFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo)   params.set('dateTo',   dateTo);

      const res  = await fetch(`/api/admin/orders?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, storeFilter, dateFrom, dateTo, page]);

  const fetchStores = useCallback(async () => {
    try {
      const res  = await fetch('/api/admin/stores', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setStores(data.stores || []);
    } catch {}
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      setUpdating(true);
      const res = await fetch('/api/orders/status', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus, note: noteInput || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      toast.success(`Status → ${newStatus}`);
      setNoteInput('');
      setSelectedOrder(null);
      await fetchOrders();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const exportExcel = () => {
    const rows = orders.map((o) => ({
      'Order ID': o.id, Date: new Date(o.createdAt).toLocaleDateString(),
      Store: o.store?.name || 'N/A', Customer: o.user?.name || 'Unknown',
      Total: o.total, Commission: o.commissionAmt, Status: o.status, Payment: o.paymentMethod,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, 'Admin_Orders.xlsx');
    toast.success('Excel downloaded');
    setExportMenuOpen(false);
  };

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { fetchStores(); }, [fetchStores]);

  if (loading) return <Loading />;

  const totalPages = Math.ceil(total / LIMIT);
  const allowedNext = selectedOrder ? ADMIN_TRANSITIONS[selectedOrder.status] || [] : [];

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl text-slate-800 font-bold flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-violet-600" /> All Orders
          <span className="text-sm font-normal text-slate-500 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">Admin</span>
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={fetchOrders} className="flex items-center gap-1.5 text-xs text-violet-600 bg-violet-50 border border-violet-200 px-3 py-2 rounded-lg">
            <RefreshCw size={13} /> Refresh
          </button>
          <div className="relative">
            <button onClick={() => setExportMenuOpen(!exportMenuOpen)} className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Download size={16} /> Export
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg z-10 border border-gray-200 py-1">
                <button onClick={exportExcel} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-green-500" /> Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={15} className="text-slate-400" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white outline-none">
            <option value="ALL">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <select value={storeFilter} onChange={(e) => { setStoreFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white outline-none">
            <option value="ALL">All Stores</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none" />
          <span className="text-slate-400 text-xs">to</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none" />
          <span className="ml-auto text-xs text-slate-400">{total} orders</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
          <Package size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">No orders found</h3>
        </div>
      ) : (
        <>
          <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="bg-violet-50 text-gray-700 text-xs uppercase border-b border-gray-200">
                  <tr>
                    {['Order', 'Store', 'Customer', 'Date', 'Total', 'Commission', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-violet-50/20">
                      <td className="px-4 py-3"><span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">#{order.id.slice(0, 8)}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">{order.store?.name || 'N/A'}</span></td>
                      <td className="px-4 py-3 font-medium text-slate-700">{order.user?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">₹{order.total.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-blue-600 text-xs">₹{(order.commissionAmt || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelectedOrder(order); setActiveTab('details'); }} className="p-2 bg-violet-50 rounded-lg text-violet-600 hover:bg-violet-100 border border-violet-200">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <button onClick={() => setPage(1)} disabled={page === 1} className="p-1 border rounded-lg bg-white disabled:opacity-50"><ChevronsLeft size={18} /></button>
            <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} className="p-1 border rounded-lg bg-white disabled:opacity-50"><ChevronLeft size={18} /></button>
            <span className="px-3 py-1 bg-violet-600 text-white rounded-lg text-sm">{page} / {totalPages || 1}</span>
            <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page >= totalPages} className="p-1 border rounded-lg bg-white disabled:opacity-50"><ChevronRight size={18} /></button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="p-1 border rounded-lg bg-white disabled:opacity-50"><ChevronsRight size={18} /></button>
          </div>
        </>
      )}

      {selectedOrder && (
        <div onClick={() => setSelectedOrder(null)} className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-y-auto max-h-[90vh]">
            <div className="bg-violet-600 text-white px-6 pt-6 pb-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Order #{selectedOrder.id.slice(0, 8)}</h2>
                <button onClick={() => setSelectedOrder(null)} className="bg-white/20 p-1.5 rounded-full hover:bg-white/30"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-2 flex items-center gap-3"><StatusBadge status={selectedOrder.status} /><span className="text-xs text-white/70">{selectedOrder.store?.name}</span></div>
            </div>

            <div className="flex border-b border-slate-200 px-6">
              {[
                { key: 'details',  label: 'Details',  icon: <Package size={14} /> },
                { key: 'timeline', label: 'Timeline', icon: <History size={14} /> },
                { key: 'actions',  label: 'Override', icon: <ShieldCheck size={14} /> },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition -mb-px ${activeTab === tab.key ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500'}`}>
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
                      <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1"><CreditCard size={12} /> Payment</p>
                      <p className="text-sm font-bold text-slate-800">₹{selectedOrder.total.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-blue-600">Commission: ₹{(selectedOrder.commissionAmt || 0).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-500 mt-1">{selectedOrder.paymentMethod}</p>
                    </div>
                  </div>
                  {selectedOrder.address && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-5">
                      <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><MapPin size={12} /> Address</p>
                      <p className="text-sm text-slate-600">{selectedOrder.address.street}, {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.zip}</p>
                    </div>
                  )}
                  <h3 className="font-semibold text-slate-800 text-sm mb-3">Items ({selectedOrder.orderItems?.length})</h3>
                  <div className="space-y-2">
                    {selectedOrder.orderItems?.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        {item.variant?.product?.images?.[0] && <img src={item.variant.product.images[0]} alt="" className="w-10 h-10 rounded object-cover border border-slate-200" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.variant?.product?.name}</p>
                          <p className="text-xs text-slate-500">{item.variant?.color} / {item.variant?.size}</p>
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

              {activeTab === 'actions' && (
                <div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800">Admin override — all changes are logged.</p>
                  </div>
                  <div className="mb-4">
                    <label className="text-sm font-medium text-slate-700 block mb-1">Note (optional):</label>
                    <input type="text" value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Reason for override..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-200" />
                  </div>
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
                  ) : <p className="text-sm text-slate-400 italic">No further transitions available.</p>}
                </div>
              )}

              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                <button onClick={() => setSelectedOrder(null)} className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}