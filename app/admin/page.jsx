// app/admin/page.jsx
'use client';
import Loading from '@/components/Loading';
import OrdersAreaChart from '@/components/OrdersAreaChart';
import {
  IndianRupee, ShoppingBag, StoreIcon, TrendingUpIcon,
  UsersIcon, BarChart3Icon, AlertTriangle, CheckCircle2, Clock,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data,    setData]    = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard', {
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load dashboard');
      }
      const json = await res.json();
      setData(json.dashboardData);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) return <Loading />;
  if (!data) return null;

  const cards = [
    { title: 'Total Revenue',    value: `₹${Number(data.totalRevenue).toLocaleString('en-IN')}`,    icon: IndianRupee,   color: 'bg-green-50 text-green-600' },
    { title: 'Platform Revenue', value: `₹${Number(data.platformRevenue).toLocaleString('en-IN')}`, icon: TrendingUpIcon, color: 'bg-emerald-50 text-emerald-600' },
    { title: 'Total Orders',     value: data.totalOrders,                                            icon: ShoppingBag,   color: 'bg-blue-50 text-blue-600' },
    { title: 'Active Stores',    value: `${data.activeStores} / ${data.totalStores}`,                icon: StoreIcon,     color: 'bg-amber-50 text-amber-600' },
    { title: 'Total Products',   value: data.totalProducts,                                          icon: BarChart3Icon, color: 'bg-purple-50 text-purple-600' },
    { title: 'Customers',        value: data.totalCustomers,                                         icon: UsersIcon,     color: 'bg-pink-50 text-pink-600' },
  ];

  const orderPipeline = [
    { label: 'Pending',          value: data.orderStatus.pending,       color: 'bg-blue-100 text-blue-700' },
    { label: 'Confirmed',        value: data.orderStatus.confirmed,     color: 'bg-violet-100 text-violet-700' },
    { label: 'Packed',           value: data.orderStatus.packed,        color: 'bg-amber-100 text-amber-700' },
    { label: 'Shipped',          value: data.orderStatus.shipped,       color: 'bg-cyan-100 text-cyan-700' },
    { label: 'Out for Delivery', value: data.orderStatus.outForDelivery,color: 'bg-orange-100 text-orange-700' },
    { label: 'Delivered',        value: data.orderStatus.delivered,     color: 'bg-green-100 text-green-700' },
    { label: 'Cancelled',        value: data.orderStatus.cancelled,     color: 'bg-red-100 text-red-700' },
    { label: 'Returned',         value: data.orderStatus.returned,      color: 'bg-purple-100 text-purple-700' },
  ];

  return (
    <div className="text-slate-500 pt-4 md:p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl">
          Admin <span className="text-slate-800 font-semibold">Dashboard</span>
        </h1>
        {data.pendingStores > 0 && (
          <Link href="/admin/approve"
            className="flex items-center gap-2 text-sm bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition">
            <Clock size={14} />
            {data.pendingStores} store{data.pendingStores > 1 ? 's' : ''} pending approval
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="flex flex-col gap-2 border border-slate-200 p-4 rounded-xl shadow-sm bg-white hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{card.title}</p>
              <card.icon className={`w-8 h-8 p-2 ${card.color} rounded-lg`} />
            </div>
            <b className="text-lg font-semibold text-slate-800">{card.value}</b>
          </div>
        ))}
      </div>

      {/* Revenue breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue',     value: data.totalRevenue,    color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
          { label: 'Commission Earned', value: data.totalCommission, color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
          { label: 'Store Payouts',     value: data.storeRevenue,    color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
        ].map((item) => (
          <div key={item.label} className={`${item.bg} border ${item.border} rounded-xl p-4`}>
            <p className="text-xs text-slate-500 font-medium">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.color}`}>₹{Number(item.value).toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      {/* Order Pipeline — full legacy status set shown deliberately; Admin retains
          broader transition rights, so Shipped/Returned counts are meaningful here
          even though they're not active store-facing steps. */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800 text-base mb-4">Order Pipeline</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {orderPipeline.map((item) => (
            <div key={item.label} className={`${item.color} rounded-lg p-3 text-center`}>
              <p className="text-xl font-bold">{item.value}</p>
              <p className="text-xs mt-1 font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Stores + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 text-base">Top Stores (This Month)</h2>
            <Link href="/admin/sales-report" className="text-xs text-green-600 hover:underline">Full Report →</Link>
          </div>
          {data.topStores?.length > 0 ? (
            <div className="space-y-3">
              {data.topStores.map((store, i) => (
                <div key={store.storeId} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-400 w-5">{i + 1}</span>
                  {store.logo && <img src={store.logo} alt={store.name} className="w-7 h-7 rounded-full object-cover border border-slate-200" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{store.name}</p>
                    <p className="text-xs text-slate-400">{store.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-700">₹{store.revenue.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-blue-500">+₹{store.commission.toLocaleString('en-IN')} comm.</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No sales this month</p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 text-base flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> Low Stock Alerts
            </h2>
            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
              {data.lowStockAlerts?.length || 0} variants
            </span>
          </div>
          {data.lowStockAlerts?.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.lowStockAlerts.map((alert) => (
                <div key={alert.variantId} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{alert.productName}</p>
                    <p className="text-xs text-slate-500">{alert.variantName} — {alert.storeName}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${alert.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {alert.stock === 0 ? 'Out' : alert.stock}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <CheckCircle2 size={32} className="text-green-300 mb-2" />
              <p className="text-sm">All variants are well stocked</p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="font-semibold text-slate-800 text-base mb-4">Sales Analytics (Last 30 Days)</h2>
        <OrdersAreaChart allOrders={data.dailyData} />
      </div>

      {/* Recent Orders */}
      {data.recentOrders?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-base">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-green-600 hover:underline">View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Order ID', 'Customer', 'Store', 'Total', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">#{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{order.user?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-500">{order.store?.name || 'N/A'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">₹{order.total.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        order.status === 'PENDING'   ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}