// components/CategoriesMarquee.jsx
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const CategoriesMarquee = () => {
  const [categoryNames, setCategoryNames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('/api/categories/all')
      .then(({ data }) => {
        const names = (data.categories || []).map((c) => c.name);
        setCategoryNames(names);
      })
      .catch(() => {
        setCategoryNames([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    // ✅ Lightweight skeleton instead of nothing — addresses "loads quickly" perception
    return (
      <div className="max-w-7xl mx-auto sm:my-20 px-4">
        <div className="flex gap-3 overflow-hidden">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-slate-100 rounded-lg animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (categoryNames.length === 0) return null;

  const repeated = [...categoryNames, ...categoryNames, ...categoryNames, ...categoryNames];

  return (
    <div className="max-w-7xl mx-auto sm:my-20 px-4">
      {/* ✅ Section header with View All Categories button — TC-S02-004 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Shop By Category</h2>
        <Link href="/shop" className="flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 transition-colors">
          View All Categories <ArrowRight size={14} />
        </Link>
      </div>

      <div className="overflow-hidden w-full relative select-none group">
        <div className="absolute left-0 top-0 h-full w-20 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
        <div className="flex min-w-[200%] animate-[marqueeScroll_10s_linear_infinite] sm:animate-[marqueeScroll_40s_linear_infinite] group-hover:[animation-play-state:paused] gap-4">
          {repeated.map((name, index) => (
            <Link
              key={index}
              href={`/shop?search=${encodeURIComponent(name)}`}
              className="px-5 py-2 bg-slate-100 rounded-lg text-slate-500 text-xs sm:text-sm hover:bg-slate-600 hover:text-white active:scale-95 transition-all duration-300 whitespace-nowrap"
            >
              {name}
            </Link>
          ))}
        </div>
        <div className="absolute right-0 top-0 h-full w-20 md:w-40 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />
      </div>
    </div>
  );
};

export default CategoriesMarquee;