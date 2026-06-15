// app/store/analytics/page.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingCart,
  BarChart2,
  Download,
  RefreshCcw,
  Loader2,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  FileText,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];
const COMPARISONS = [
  { value: '', label: 'No Comparison' },
  { value: 'today_vs_yesterday', label: 'Today vs Yesterday' },
  { value: 'month_vs_last_month', label: 'This Month vs Last Month' },
  { value: 'year_vs_last_year', label: 'This Year vs Last Year' },
];
const PIE_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
];
const CHART_TABS = [
  { value: 'line', label: 'Sales Trend' },
  { value: 'bar', label: 'Daily Revenue' },
];

function KpiCard({ title, value, sub, icon: Icon, color, growth, loading }) {
  const colors = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-100',
      icon: 'bg-green-100 text-green-600',
      val: 'text-green-700',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      icon: 'bg-blue-100 text-blue-600',
      val: 'text-blue-700',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      icon: 'bg-purple-100 text-purple-600',
      val: 'text-purple-700',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      icon: 'bg-amber-100 text-amber-600',
      val: 'text-amber-700',
    },
  };
  const c = colors[color] || colors.green;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5 flex flex-col gap-3 shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${c.icon}`}>
          <Icon size={18} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-slate-200 animate-pulse rounded" />
      ) : (
        <p className={`text-2xl font-bold ${c.val}`}>{value}</p>
      )}
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
      {growth !== undefined && !loading && (
        <div
          className={`flex items-center gap-1 text-xs font-medium ${growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-500' : 'text-slate-400'}`}
        >
          {growth > 0 ? (
            <ArrowUpRight size={13} />
          ) : growth < 0 ? (
            <ArrowDownRight size={13} />
          ) : (
            <Minus size={13} />
          )}
          {Math.abs(growth)}% vs previous period
        </div>
      )}
    </div>
  );
}

function ComparisonBanner({ data }) {
  if (!data) return null;
  const { labels, revenue, orders } = data;
  const RevIcon = revenue.growth > 0 ? TrendingUp : revenue.growth < 0 ? TrendingDown : Minus;
  const OrdIcon = orders.growth > 0 ? TrendingUp : orders.growth < 0 ? TrendingDown : Minus;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[
        {
          label: 'Revenue',
          d: revenue,
          Icon: RevIcon,
          fmt: (v) => `₹${v.toLocaleString('en-IN')}`,
        },
        { label: 'Orders', d: orders, Icon: OrdIcon, fmt: (v) => v },
      ].map(({ label, d, Icon, fmt }) => (
        <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium mb-3">
            {label}: {labels[0]} vs {labels[1]}
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-400">{labels[0]}</p>
              <p className="text-xl font-bold text-slate-800">{fmt(d.current)}</p>
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${d.growth > 0 ? 'bg-green-100 text-green-700' : d.growth < 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}
            >
              <Icon size={12} />
              {d.growth > 0 ? '+' : ''}
              {d.growth}%
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">{labels[1]}</p>
              <p className="text-lg font-semibold text-slate-600">{fmt(d.previous)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name === 'revenue'
            ? `Revenue: ₹${p.value.toLocaleString('en-IN')}`
            : `Orders: ${p.value}`}
        </p>
      ))}
    </div>
  );
};

export default function StoreSalesReport() {
  const { getToken } = useAuth();

  const [period, setPeriod] = useState('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [comparison, setComparison] = useState('');
  const [chartTab, setChartTab] = useState('line');

  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [products, setProducts] = useState([]);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const buildQS = useCallback(
    (extra = {}) => {
      const p = new URLSearchParams({ period });
      if (period === 'custom' && customFrom && customTo) {
        p.set('from', customFrom);
        p.set('to', customTo);
      }
      if (comparison) p.set('comparison', comparison);
      Object.entries(extra).forEach(([k, v]) => p.set(k, v));
      return p.toString();
    },
    [period, customFrom, customTo, comparison]
  );

  const fetchAll = useCallback(async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      setLoadingSummary(true);
      setLoadingTrend(true);
      setLoadingProducts(true);

      const [summaryRes, trendRes, productsRes] = await Promise.allSettled([
        axios.get(`/api/reports/summary?${buildQS()}`, { headers }),
        axios.get(`/api/reports/sales-trend?${buildQS()}`, { headers }),
        axios.get(`/api/reports/top-products?${buildQS()}`, { headers }),
      ]);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data.summary);
      if (trendRes.status === 'fulfilled') setTrend(trendRes.value.data.trend || []);
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value.data.products || []);
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoadingSummary(false);
      setLoadingTrend(false);
      setLoadingProducts(false);
    }
  }, [getToken, buildQS]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleExport = async (format) => {
    try {
      setExporting(true);
      setShowExportMenu(false);
      const token = await getToken();
      if (format === 'csv') {
        const res = await axios.get(`/api/reports/export?${buildQS({ format: 'csv' })}`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        });
        const url = URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `sales-report-${period}-${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('CSV downloaded');
      } else {
        const res = await axios.get(`/api/reports/export?${buildQS({ format: 'pdf' })}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        generatePDF(res.data);
      }
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const generatePDF = ({ summary: s, rows, columns }) => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Sales Report</title>
      <style>body{font-family:sans-serif;padding:24px;color:#1e293b}h1{font-size:22px}
      .meta{color:#64748b;font-size:12px;margin-bottom:20px}.kpis{display:flex;gap:16px;margin-bottom:24px}
      .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;flex:1}
      .kpi-label{font-size:11px;color:#94a3b8;text-transform:uppercase}.kpi-value{font-size:22px;font-weight:700;color:#15803d;margin-top:4px}
      table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f1f5f9;padding:8px 10px;text-align:left;font-weight:600;color:#475569}
      td{padding:7px 10px;border-bottom:1px solid #f1f5f9}@media print{button{display:none}}</style></head><body>
      <button onclick="window.print()" style="margin-bottom:16px;padding:8px 16px;background:#16a34a;color:white;border:none;border-radius:6px;cursor:pointer">Print / Save as PDF</button>
      <h1>Sales Report — ${s.period}</h1>
      <div class="meta">Generated: ${new Date(s.generatedAt).toLocaleString('en-IN')} | ${s.from} to ${s.to}</div>
      <div class="kpis">
        <div class="kpi"><div class="kpi-label">Revenue</div><div class="kpi-value">₹${s.totalRevenue.toLocaleString('en-IN')}</div></div>
        <div class="kpi"><div class="kpi-label">Orders</div><div class="kpi-value">${s.totalOrders}</div></div>
        <div class="kpi"><div class="kpi-label">AOV</div><div class="kpi-value">₹${s.aov.toLocaleString('en-IN')}</div></div>
      </div>
      <table><thead><tr>${columns.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead>
      <tbody>${rows
        .slice(0, 500)
        .map((r) => `<tr>${columns.map((c) => `<td>${r[c.key] ?? ''}</td>`).join('')}</tr>`)
        .join('')}</tbody>
      </table></body></html>`);
    win.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 size={24} className="text-green-600" /> Sales Report
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your store revenue and order performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg text-slate-700 text-sm"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Export <ChevronDown size={13} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden w-44">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <FileSpreadsheet size={15} className="text-green-600" /> Download CSV
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <FileText size={15} className="text-red-500" /> Download PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Time Period</label>
            <div className="flex flex-wrap gap-1.5">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
                    ${
                      period === p.value
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-green-300'
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-100"
                />
              </div>
              <button
                onClick={fetchAll}
                className="mt-4 bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Apply
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1 ml-auto">
            <label className="text-xs font-medium text-slate-500">Compare</label>
            <select
              value={comparison}
              onChange={(e) => setComparison(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-100 bg-white"
            >
              {COMPARISONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue"
          value={`₹${(summary?.revenue || 0).toLocaleString('en-IN')}`}
          sub={`${summary?.orders || 0} transactions`}
          icon={IndianRupee}
          color="green"
          growth={summary?.comparison?.revenue?.growth}
          loading={loadingSummary}
        />
        <KpiCard
          title="Total Orders"
          value={summary?.orders || 0}
          sub="in selected period"
          icon={ShoppingCart}
          color="blue"
          growth={summary?.comparison?.orders?.growth}
          loading={loadingSummary}
        />
        <KpiCard
          title="Avg Order Value"
          value={`₹${(summary?.aov || 0).toLocaleString('en-IN')}`}
          sub="per transaction"
          icon={TrendingUp}
          color="purple"
          loading={loadingSummary}
        />
        <KpiCard
          title="Top Product"
          value={
            products[0]?.name
              ? products[0].name.slice(0, 18) + (products[0].name.length > 18 ? '…' : '')
              : '—'
          }
          sub={products[0] ? `₹${products[0].revenue.toLocaleString('en-IN')} revenue` : 'No data'}
          icon={Package}
          color="amber"
          loading={loadingProducts}
        />
      </div>

      {summary?.comparison && <ComparisonBanner data={summary.comparison} />}

      {/* Employee Breakdown — Store Owner sees all employees */}
      {summary?.employeeBreakdown && summary.employeeBreakdown.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-base">Employee Sales Breakdown</h2>
            <span className="text-xs text-slate-400">{summary.employeeBreakdown.length} staff</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">Employee</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">Bills</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">Revenue</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs hidden sm:table-cell">Avg/Bill</th>
                </tr>
              </thead>
              <tbody>
                {summary.employeeBreakdown.map((emp) => (
                  <tr key={emp.employeeId} className="border-t border-slate-50 hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-slate-800 font-medium text-xs">{emp.name}</p>
                        <p className="text-slate-400 text-xs">{emp.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">{emp.bills}</td>
                    <td className="px-5 py-3.5 text-green-700 font-semibold text-xs">
                      ₹{emp.revenue.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell text-xs">
                      ₹{emp.bills > 0 ? Math.round(emp.revenue / emp.bills).toLocaleString('en-IN') : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales Trend Chart */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 className="font-semibold text-slate-800 text-base">Sales Trend</h2>
          <div className="flex gap-1.5">
            {CHART_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setChartTab(t.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${chartTab === t.value ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {loadingTrend ? (
          <div className="h-64 flex items-center justify-center text-slate-400 gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading chart...
          </div>
        ) : trend.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            No sales data for this period
          </div>
        ) : chartTab === 'line' ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="revenue"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trend} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="revenue" name="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie + Products Table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 text-base mb-4">Revenue by Product</h2>
          {loadingProducts ? (
            <div className="h-48 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 size={16} className="animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No data
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={products.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="revenue"
                  >
                    {products.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
                {products.slice(0, 8).map((p, i) => (
                  <div key={p.productId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-slate-600 truncate max-w-[130px]">{p.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700 ml-2">{p.share}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-base">Top Products</h2>
          </div>
          {loadingProducts ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 size={16} className="animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
              No products sold in this period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">#</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">
                      Product
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">
                      Revenue
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs hidden sm:table-cell">
                      Qty
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs hidden sm:table-cell">
                      Share
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={p.productId} className="border-t border-slate-50 hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 text-slate-400 text-xs font-medium">{i + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {p.image && (
                            <div className="relative w-8 h-8 rounded-md overflow-hidden border border-slate-100 flex-shrink-0">
                              <Image src={p.image} alt={p.name} fill className="object-cover" />
                            </div>
                          )}
                          <span className="text-slate-800 font-medium line-clamp-1 max-w-[140px] text-xs">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-green-700 font-semibold text-xs">
                        ₹{p.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell text-xs">
                        {p.quantity}
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-[60px]">
                            <div
                              className="bg-green-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min(p.share, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{p.share}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}