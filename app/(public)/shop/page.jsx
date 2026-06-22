// C:\Users\Siddharathan\Desktop\Grocery-Cart\app\(public)\shop\page.jsx
'use client';
import { Suspense, useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import { FilterIcon, Search, AlertCircle, ArrowUpDown, RefreshCw, CheckCircle2, X, SlidersHorizontal, ChevronDown, Store } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '@/lib/features/product/productSlice';

function ShopContent() {
  const searchParams = useSearchParams();
  const search       = searchParams.get('search') || '';
  const router       = useRouter();
  const dispatch     = useDispatch();
  const products     = useSelector((state) => state.product.list);
  const loading      = useSelector((state) => state.product.loading);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange,        setPriceRange]        = useState([0, 10000]);
  const [showFilters,       setShowFilters]        = useState(false);
  const [sortBy,            setSortBy]             = useState('featured');

  const [allCategoryNames, setAllCategoryNames] = useState([]);
  const [activeStores,     setActiveStores]     = useState([]);
  const [selectedStoreId,  setSelectedStoreId]  = useState('All');

  // ✅ FIX: Re-fetch products whenever `search` param changes — including
  // when it's cleared (empty string → fetches ALL products again).
  useEffect(() => {
    dispatch(fetchProducts({ search: search || undefined }));
  }, [search, dispatch]);

  useEffect(() => {
    fetch('/api/categories/all')
      .then((res) => res.json())
      .then((data) => {
        const names = (data.categories || []).map((c) => c.name);
        setAllCategoryNames([...new Set(names)]);
      })
      .catch(() => setAllCategoryNames([]));

    fetch('/api/stores/active')
      .then((res) => res.json())
      .then((data) => setActiveStores(data.stores || []))
      .catch(() => setActiveStores([]));
  }, []);

  const productCategoryNames = [...new Set(products.flatMap((p) =>
    (p.categories || []).map((c) => c.category?.name || c.name).filter(Boolean)
  ))];

  const categories = ['All', ...(allCategoryNames.length ? allCategoryNames : productCategoryNames)];

  const allPrices = products.flatMap((p) => (p.variants || []).map((v) => Number(v.price) || 0));
  const minP = allPrices.length ? Math.min(...allPrices) : 0;
  const maxP = allPrices.length ? Math.max(...allPrices) : 10000;

  useEffect(() => { setPriceRange([minP, maxP]); }, [products.length]);

  const getMinPrice = (p) => {
    const prices = (p.variants || []).map((v) => Number(v.price) || 0);
    return prices.length ? Math.min(...prices) : 0;
  };

  // ✅ Since the API already filters by `search`, we don't need to
  // re-filter by search client-side — but keep category/price/store
  // filters client-side as before.
  const filteredProducts = products.filter((p) => {
    const cats          = (p.categories || []).map((c) => c.category?.name || c.name);
    const matchCat      = selectedCategory === 'All' || cats.includes(selectedCategory);
    const mp            = getMinPrice(p);
    const matchPrice    = mp >= priceRange[0] && mp <= priceRange[1];
    const matchStore    = selectedStoreId === 'All' || p.storeId === selectedStoreId || p.store?.id === selectedStoreId;
    return matchCat && matchPrice && matchStore;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low')  return getMinPrice(a) - getMinPrice(b);
    if (sortBy === 'price-high') return getMinPrice(b) - getMinPrice(a);
    if (sortBy === 'newest')     return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (sortBy === 'rating') {
      const avg = (p) => p.ratings?.length ? p.ratings.reduce((s, r) => s + r.rating, 0) / p.ratings.length : 0;
      return avg(b) - avg(a);
    }
    return 0;
  });

  const hasActiveFilters = selectedCategory !== 'All' || selectedStoreId !== 'All' || priceRange[0] !== minP || priceRange[1] !== maxP;

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedStoreId('All');
    setPriceRange([minP, maxP]);
    setSortBy('featured');
    if (search) router.push('/shop');
  };

  return (
    <div className="min-h-[70vh] max-w-7xl mx-auto px-4 sm:px-6 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {search ? <>Results for "<span className="text-green-600">{search}</span>"</> : 'All Products'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {loading ? 'Loading...' : `Showing ${sortedProducts.length} products`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="text-sm text-slate-700 bg-transparent outline-none cursor-pointer">
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              showFilters || hasActiveFilters
                ? 'bg-green-600 text-white border-green-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}>
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && <span className="bg-white/30 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">ON</span>}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-green-600 text-white border-green-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-green-300 hover:text-green-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Active filters bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-slate-500">Active:</span>
          {selectedCategory !== 'All' && (
            <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">
              {selectedCategory}
              <button onClick={() => setSelectedCategory('All')}><X size={11} /></button>
            </span>
          )}
          {selectedStoreId !== 'All' && (
            <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
              <Store size={11} /> {activeStores.find((s) => s.id === selectedStoreId)?.name || 'Store'}
              <button onClick={() => setSelectedStoreId('All')}><X size={11} /></button>
            </span>
          )}
          <button onClick={resetFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 ml-1">
            <RefreshCw size={11} /> Clear all
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {showFilters && (
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <SlidersHorizontal size={15} className="text-green-600" /> Filters
                </h2>
                <button onClick={resetFilters} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                  <RefreshCw size={11} /> Reset
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Category</h3>
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                        selectedCategory === cat
                          ? 'bg-green-50 text-green-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}>
                      {cat}
                      {selectedCategory === cat && <CheckCircle2 size={14} className="text-green-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {activeStores.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Store size={12} /> Store
                  </h3>
                  <select value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-100">
                    <option value="All">All Stores</option>
                    {activeStores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Price Range</h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
                    <p className="text-[10px] text-slate-400">Min</p>
                    <p className="text-sm font-semibold text-slate-700">₹{priceRange[0]}</p>
                  </div>
                  <span className="text-slate-300">–</span>
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
                    <p className="text-[10px] text-slate-400">Max</p>
                    <p className="text-sm font-semibold text-slate-700">₹{priceRange[1]}</p>
                  </div>
                </div>
                <input type="range" min={minP} max={maxP} value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full accent-green-600 h-1.5 rounded-full cursor-pointer" />
              </div>

              <div className="md:hidden">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Sort By</h3>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 p-2.5 rounded-xl text-sm outline-none">
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              <button onClick={() => setShowFilters(false)} className="md:hidden w-full mt-4 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-medium">
                Done
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="h-40 sm:h-52 bg-slate-100" />
                  <div className="p-3 space-y-2.5">
                    <div className="h-3.5 bg-slate-100 rounded-full w-3/4" />
                    <div className="h-3.5 bg-slate-100 rounded-full w-1/2" />
                    <div className="h-10 bg-slate-100 rounded-xl mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedProducts.length > 0 ? (
            <div className={`grid gap-4 md:gap-5 ${showFilters ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-5">
                <AlertCircle size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No products found</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-xs">Try adjusting your filters or search for something else.</p>
              <button onClick={resetFilters} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                <RefreshCw size={15} /> Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="h-52 bg-slate-100" />
              <div className="p-4 space-y-2.5">
                <div className="h-3.5 bg-slate-100 rounded-full w-3/4" />
                <div className="h-3.5 bg-slate-100 rounded-full w-1/2" />
                <div className="h-10 bg-slate-100 rounded-xl mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}