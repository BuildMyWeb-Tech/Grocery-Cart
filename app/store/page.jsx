
// app/store/page.jsx
'use client';
import Loading from '@/components/Loading';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import {
  IndianRupee, ShoppingBasket, Star, TrendingUp, RefreshCcw,
  Users, ExternalLink, ShoppingCart, Clock, Truck, CheckCircle2,
  XCircle, Package, Layers, CheckCircle, AlertTriangle, BarChart2, Navigation,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const PIE_COLORS = {
  Delivered:       '#22c55e',
  Pending:         '#f59e0b',
  Confirmed:       '#8b5cf6',
  Packed:          '#3b82f6',
  Shipped:         '#06b6d4',
  'Out for Delivery': '#f97316',
  Cancelled:       '#ef4444',
  Returned:        '#a855f7',
};

function StatCard({ title, value, icon: Icon, color, sub }) {
  const colorMap = {
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   border: 'border-blue-100',   val: 'text-blue-700' },
    green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600', border: 'border-green-100',  val: 'text-green-700' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600',border: 'border-purple-100',val: 'text-purple-700' },
    amber:  { bg: 'bg-amber-50',  icon: 'bg-amber-100 text-amber-600', border: 'border-amber-100',  val: 'text-amber-700' },
    red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',     border: 'border-red-100',    val: 'text-red-700' },
    indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-100 text-indigo-600',border: 'border-indigo-100',val: 'text-indigo-700' },
    teal:   { bg: 'bg-teal-50',   icon: 'bg-teal-100 text-teal-600',   border: 'border-teal-100',   val: 'text-teal-700' },
    orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600',border: 'border-orange-100',val: 'text-orange-700' },
    cyan:   { bg: 'bg-cyan-50',   icon: 'bg-cyan-100 text-cyan-600',   border: 'border-cyan-100',   val: 'text-cyan-700' },
    slate:  { bg: 'bg-slate-50',  icon: 'bg-slate-100 text-slate-600', border: 'border-slate-100',  val: 'text-slate-700' },
  };
  const c = colorMap[color] || colorMap.slate;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5 flex items-center gap-4 shadow-sm`}>
      <div className={`rounded-xl p-3 ${c.icon} flex-shrink-0`}><Icon size={22} /></div>
      <div>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{title}</p>
        <p className={`text-2xl font-bold mt-0.5 ${c.val}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const RevenueTooltip = ({ active, payload, label }) => {
  if (active && payload?.length)
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name === 'revenue' ? `₹${p.value.toLocaleString()}` : `${p.value} orders`}
          </p>
        ))}
      </div>
    );
  return null;
};

export default function StoreDashboard() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState('revenue');
  const [dash, setDash] = useState(null);

  const getAuthHeader = async () => {
    const empToken = typeof window !== 'undefined' ? localStorage.getItem('employeeToken') : null;
    if (empToken) return { Authorization: `Bearer ${empToken}` };
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeader();
      const { data } = await axios.get('/api/store/dashboard', { headers });
      setDash(data.dashboardData);
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading || !dash) return <Loading />;

  const avgRating = dash.recentRatings?.length
    ? (dash.recentRatings.reduce((s, r) => s + r.rating, 0) / dash.recentRatings.length).toFixed(1)
    : '—';

  const conversionRate = dash.totalOrders > 0
    ? ((dash.orderStatus.delivered / dash.totalOrders) * 100).toFixed(1)
    : '0.0';

  const pieData = [
    { name: 'Delivered',        value: dash.orderStatus.delivered },
    { name: 'Pending',          value: dash.orderStatus.pending },
    { name: 'Confirmed',        value: dash.orderStatus.confirmed },
    { name: 'Packed',           value: dash.orderStatus.packed },
    { name: 'Shipped',          value: dash.orderStatus.shipped },
    { name: 'Out for Delivery', value: dash.orderStatus.outForDelivery },
    { name: 'Cancelled',        value: dash.orderStatus.cancelled },
  ].filter((d) => d.value > 0);

  const barData = [
    { status: 'Pending',          count: dash.orderStatus.pending },
    { status: 'Confirmed',        count: dash.orderStatus.confirmed },
    { status: 'Packed',           count: dash.orderStatus.packed },
    { status: 'Shipped',          count: dash.orderStatus.shipped },
    { status: 'Out for Delivery', count: dash.orderStatus.outForDelivery },
    { status: 'Delivered',        count: dash.orderStatus.delivered },
    { status: 'Cancelled',        count: dash.orderStatus.cancelled },
  ];

  const chartData = (dash.dailyData || []).slice(-14);

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-6 text-slate-600 pb-28 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Store Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time overview of your store performance</p>
        </div>
        <button onClick={fetchDashboard}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-slate-700 text-sm transition-all">
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {/* Revenue breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue',    value: dash.totalRevenue,    color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
          { label: 'Commission Paid',  value: dash.totalCommission, color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
          { label: 'Net Earnings',     value: dash.netRevenue,      color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
        ].map((item) => (
          <div key={item.label} className={`${item.bg} border ${item.border} rounded-xl p-4`}>
            <p className="text-xs text-slate-500 font-medium">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.color}`}>
              ₹{Number(item.value || 0).toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>

      {/* Stats grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <ShoppingCart size={14} /> Orders & Products
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <StatCard title="Total Products"   value={dash.totalProducts}   icon={ShoppingBasket} color="blue" />
          <StatCard title="Total Categories" value={dash.totalCategories} icon={Layers}         color="indigo" />
          <StatCard title="Total Orders"     value={dash.totalOrders}     icon={ShoppingCart}   color="purple" />
          <StatCard title="Total Customers"  value={dash.totalCustomers}  icon={Users}          color="teal" />
          <StatCard title="Today's Orders"   value={dash.todayOrders}     icon={TrendingUp}     color="orange" />
          <StatCard title="Pending"          value={dash.orderStatus.pending}        icon={Clock}         color="amber" />
          <StatCard title="Confirmed"        value={dash.orderStatus.confirmed}      icon={CheckCircle}   color="violet" sub="order" />
          <StatCard title="Packed"           value={dash.orderStatus.packed}         icon={Package}       color="blue" />
          <StatCard title="Shipped"          value={dash.orderStatus.shipped}        icon={Truck}         color="cyan" />
          <StatCard title="Out for Delivery" value={dash.orderStatus.outForDelivery} icon={Navigation}    color="orange" />
          <StatCard title="Delivered"        value={dash.orderStatus.delivered}      icon={CheckCircle2}  color="green" />
          <StatCard title="Cancelled"        value={dash.orderStatus.cancelled}      icon={XCircle}       color="red" />
          <StatCard title="Conversion Rate"  value={`${conversionRate}%`}            icon={TrendingUp}    color="slate" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h3 className="font-semibold text-slate-800">Trends (Last 14 Days)</h3>
            <div className="flex gap-2">
              {['revenue', 'orders'].map((tab) => (
                <button key={tab} onClick={() => setChartTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${chartTab === tab ? (tab === 'revenue' ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white') : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {chartData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-slate-400 text-sm">No data for the last 14 days</div>
          ) : chartTab === 'revenue' ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<RevenueTooltip />} />
                <Line type="monotone" dataKey="revenue" name="revenue" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<RevenueTooltip />} />
                <Bar dataKey="orders" name="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-5">Order Distribution</h3>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No orders yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#94a3b8'} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} orders`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[entry.name] || '#94a3b8' }} />
                      <span className="text-slate-600">{entry.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Selling Variants */}
      {dash.topVariants?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <BarChart2 size={18} className="text-indigo-500" /> Top Selling Variants (This Month)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Product</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Color / Size</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">SKU</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium">Qty Sold</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {dash.topVariants.slice(0, 8).map((v, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {v.productImage && <img src={v.productImage} alt={v.productName} className="w-8 h-8 rounded object-cover border border-slate-200" />}
                        <span className="font-medium text-slate-800">{v.productName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">{v.color}</span>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">{v.size}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 font-mono">{v.sku}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-700">{v.totalQty}</td>
                    <td className="px-5 py-3 text-right font-semibold text-green-700">₹{Number(v.totalRevenue || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {dash.lowStockAlerts?.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-amber-100 bg-amber-50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" /> Low Stock Alerts
            </h2>
            <span className="bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {dash.lowStockAlerts.length} variants
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Product</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Color / Size</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">SKU</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium">Stock</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {dash.lowStockAlerts.slice(0, 10).map((v, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-slate-800">{v.productName}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">{v.color}</span>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs font-bold">{v.size}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 font-mono">{v.sku}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-bold text-base ${v.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>{v.stock}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${v.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {v.stock === 0 ? 'Out of stock' : 'Low stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders by Status Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-5">Orders by Status</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="status" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" name="Orders" radius={[6, 6, 0, 0]}>
              {barData.map((entry) => <Cell key={entry.status} fill={PIE_COLORS[entry.status] || '#94a3b8'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="bg-amber-100 rounded-xl p-3"><Star size={20} className="text-amber-500" /></div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Avg. Rating</p>
            <p className="text-2xl font-bold text-slate-800">{avgRating}</p>
            <p className="text-xs text-slate-400">{dash.recentRatings?.length || 0} reviews</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="bg-green-100 rounded-xl p-3"><IndianRupee size={20} className="text-green-500" /></div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Today's Revenue</p>
            <p className="text-2xl font-bold text-slate-800">₹{Number(dash.todayRevenue || 0).toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-400">{dash.todayOrders} orders today</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="bg-blue-100 rounded-xl p-3"><TrendingUp size={20} className="text-blue-500" /></div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Delivery Rate</p>
            <p className="text-2xl font-bold text-slate-800">{conversionRate}%</p>
            <p className="text-xs text-slate-400">Delivered / Total</p>
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Recent Customer Reviews</h2>
          <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
            {dash.recentRatings?.length || 0} total
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {!dash.recentRatings?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Star size={24} className="text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No reviews yet</p>
            </div>
          ) : (
            dash.recentRatings.slice(0, 5).map((review, i) => (
              <div key={i} className="p-5 hover:bg-slate-50">
                <div className="flex gap-3 items-start mb-2">
                  {review.user?.image && (
                    <Image src={review.user.image} alt={review.user.name || 'User'} className="w-10 h-10 rounded-full object-cover border border-slate-200" width={40} height={40} />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 text-sm">{review.user?.name}</p>
                    <div className="flex items-center gap-0.5 my-1">
                      {Array(5).fill('').map((_, j) => (
                        <Star key={j} size={13} className="text-transparent" fill={review.rating >= j + 1 ? '#FBBF24' : '#D1D5DB'} />
                      ))}
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">{review.review}</p>
                    <p className="text-xs text-slate-400 mt-1">{review.product?.name}</p>
                  </div>
                  <button onClick={() => router.push(`/product/${review.product?.id}`)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    View <ExternalLink size={11} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}