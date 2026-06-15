// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\components\OrdersAreaChart.jsx
'use client';
import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const RANGE_OPTIONS = [
  { key: 7,  label: '7 Days' },
  { key: 10, label: '10 Days' },
  { key: 30, label: '30 Days' },
];

// Convert a Date → IST 'YYYY-MM-DD' key (matches toISTDateKey on the server)
function istDateKey(date) {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export default function OrdersAreaChart({ allOrders }) {
  const [range, setRange] = useState(30);

  if (!allOrders || allOrders.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-slate-400 text-sm">
        No sales data available
      </div>
    );
  }

  // ✅ Build a map keyed by IST date — supports both pre-bucketed
  // { date, count, revenue } objects (from dashboard API) and raw
  // order objects with createdAt
  const byDate = {};
  for (const o of allOrders) {
    if (!o) continue;

    let key = o.date; // already an IST-keyed string from the API
    if (!key) {
      if (!o.createdAt) continue;
      const d = new Date(o.createdAt);
      if (isNaN(d.getTime())) continue;
      key = istDateKey(d);
    }

    if (!byDate[key]) byDate[key] = { count: 0, revenue: 0 };
    byDate[key].count   += o.count   ?? 1;
    byDate[key].revenue += o.revenue ?? 0;
  }

  // ✅ Continuous date range (today back N days, IST) — always renders
  // a full axis even if some/all days have zero orders.
  const fullRange = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = istDateKey(d);
    fullRange.push({
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }),
      orders: byDate[key]?.count ?? 0,
      revenue: byDate[key]?.revenue ?? 0,
    });
  }

  const hasAnyData = fullRange.some((d) => d.orders > 0);

  return (
    <div className="w-full">
      {/* ✅ Range toggle */}
      <div className="flex justify-end gap-2 mb-3">
        {RANGE_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setRange(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              range === key ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!hasAnyData ? (
        <div className="w-full h-[300px] flex items-center justify-center text-slate-400 text-sm">
          No sales data for the last {range} days
        </div>
      ) : (
        <div className="w-full h-[300px] text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fullRange} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={range > 10 ? 'preserveStartEnd' : 0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(v, name) => name === 'orders' ? [`${v} orders`, 'Orders'] : [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
              />
              <Area
                type="monotone" dataKey="orders"
                stroke="#22c55e" strokeWidth={2.5}
                fill="url(#ordersGrad)"
                dot={false} activeDot={{ r: 4, fill: '#22c55e' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}