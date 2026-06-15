// components/OrderTimeline.jsx
'use client';
import {
  ClipboardList, CheckCircle2, Package, Truck, Navigation,
  PackageCheck, XCircle, RotateCcw, User, ShieldCheck, Cpu,
} from 'lucide-react';

const STATUS_CONFIG = {
  PENDING:          { label: 'Order Placed',     Icon: ClipboardList,  color: 'bg-blue-100 text-blue-600',    dot: 'bg-blue-500' },
  CONFIRMED:        { label: 'Order Confirmed',  Icon: CheckCircle2,   color: 'bg-violet-100 text-violet-600', dot: 'bg-violet-500' },
  PACKED:           { label: 'Packed',           Icon: Package,        color: 'bg-amber-100 text-amber-600',   dot: 'bg-amber-500' },
  SHIPPED:          { label: 'Shipped',          Icon: Truck,          color: 'bg-cyan-100 text-cyan-600',     dot: 'bg-cyan-500' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', Icon: Navigation,     color: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500' },
  DELIVERED:        { label: 'Delivered',        Icon: PackageCheck,   color: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500' },
  CANCELLED:        { label: 'Cancelled',        Icon: XCircle,        color: 'bg-red-100 text-red-600',       dot: 'bg-red-500' },
  RETURNED:         { label: 'Returned',         Icon: RotateCcw,      color: 'bg-purple-100 text-purple-600', dot: 'bg-purple-500' },
};

const ACTOR_CONFIG = {
  ADMIN:  { label: 'Admin',  Icon: ShieldCheck, color: 'text-violet-600 bg-violet-50' },
  STORE:  { label: 'Store',  Icon: User,        color: 'text-blue-600 bg-blue-50' },
  SYSTEM: { label: 'System', Icon: Cpu,         color: 'text-slate-500 bg-slate-100' },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export default function OrderTimeline({ timeline = [], loading = false }) {
  if (loading) {
    return (
      <div className="space-y-4 py-2">
        {[1,2,3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1"><div className="h-3 bg-slate-200 rounded w-32" /><div className="h-2 bg-slate-100 rounded w-48" /></div>
          </div>
        ))}
      </div>
    );
  }

  if (!timeline?.length) {
    return <div className="text-center py-6 text-slate-400 text-sm">No timeline history yet.</div>;
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent" />
      <div className="space-y-5">
        {timeline.map((entry, idx) => {
          const cfg   = STATUS_CONFIG[entry.status] || STATUS_CONFIG.PENDING;
          const actor = ACTOR_CONFIG[entry.changedBy] || ACTOR_CONFIG.SYSTEM;
          const { Icon } = cfg;
          const { Icon: ActorIcon } = actor;
          const isLast = idx === timeline.length - 1;

          return (
            <div key={entry.id || idx} className="relative flex gap-4 pl-1">
              <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: 'white', border: '2px solid #e2e8f0' }}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.color}`}><Icon size={14} /></div>
              </div>
              <div className={`flex-1 pb-1 ${!isLast ? 'border-b border-slate-100' : ''}`}>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${actor.color}`}>
                    <ActorIcon size={10} /> {actor.label}
                  </span>
                </div>
                {entry.note && <p className="text-xs text-slate-500 mb-1 italic">"{entry.note}"</p>}
                <p className="text-xs text-slate-400">{formatDate(entry.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}