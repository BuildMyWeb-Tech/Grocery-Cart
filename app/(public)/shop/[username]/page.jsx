// app/(public)/shop/[username]/page.jsx
'use client';
import ProductCard from '@/components/ProductCard';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MailIcon, MapPinIcon, CheckCircleIcon, StarIcon, ShieldCheck, Package, Truck } from 'lucide-react';
import Loading from '@/components/Loading';
import Image from 'next/image';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function StoreShop() {
  const { username } = useParams();
  const [products,  setProducts]  = useState([]);
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const { data } = await axios.get(`/api/store/data?username=${username}`);
        setStoreInfo(data.store);
        setProducts(data.store.Product || data.store.products || []);
      } catch (error) {
        toast.error(error?.response?.data?.error || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreData();
  }, [username]);

  // Categories from join table
  const categories = [
    'All',
    ...new Set(
      products.flatMap((p) =>
        (p.categories || []).map((c) => c.category?.name || c.name).filter(Boolean)
      )
    ),
  ];

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter((p) => {
        const names = (p.categories || []).map((c) => c.category?.name || c.name);
        return names.includes(activeCategory);
      });

  if (loading) return <Loading />;

  return (
    <div className="min-h-[70vh] mx-6">
      {/* Store Banner */}
      {storeInfo && (
        <div className="max-w-7xl mx-auto bg-gradient-to-r from-slate-50 via-white to-slate-100 rounded-xl p-6 md:p-10 mt-6 flex flex-col md:flex-row items-center gap-6 shadow-md border border-slate-100 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-green-50 rounded-full opacity-30 z-0" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-50 rounded-full opacity-30 z-0" />

          {storeInfo.logo && (
            <div className="relative z-10">
              <div className="relative inline-block">
                <Image src={storeInfo.logo} alt={storeInfo.name} className="size-32 sm:size-40 object-cover border-4 border-white rounded-xl shadow-md" width={200} height={200} style={{ objectFit: 'cover' }} />
                <div className="absolute -bottom-3 -right-3 bg-white rounded-full p-1.5 shadow-lg">
                  <CheckCircleIcon size={24} className="text-green-500" />
                </div>
              </div>
            </div>
          )}

          <div className="text-center md:text-left relative z-10 flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{storeInfo.name}</h1>
                <div className="flex items-center gap-2 justify-center md:justify-start mt-2 mb-3">
                  <div className="flex">{[1,2,3,4,5].map((s) => <StarIcon key={s} size={16} className="text-yellow-400" fill="#FBBF24" strokeWidth={0} />)}</div>
                  <span className="text-sm text-slate-600"><span className="font-medium">4.8</span> (reviews)</span>
                </div>
              </div>
              <div className="flex gap-4 justify-center md:justify-start text-sm">
                <div className="flex flex-col items-center bg-white py-2 px-4 rounded-lg shadow-sm border border-slate-100">
                  <span className="font-bold text-slate-800">{products.length}</span>
                  <span className="text-xs text-slate-500">Products</span>
                </div>
              </div>
            </div>

            {storeInfo.description && (
              <p className="text-sm text-slate-600 mt-4 max-w-2xl leading-relaxed">{storeInfo.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {storeInfo.address && (
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg shadow-sm border border-slate-100">
                  <div className="bg-slate-100 p-2 rounded-full"><MapPinIcon className="w-4 h-4 text-slate-700" /></div>
                  <span className="text-sm text-slate-700 font-medium">{storeInfo.address}</span>
                </div>
              )}
              {storeInfo.email && (
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg shadow-sm border border-slate-100">
                  <div className="bg-slate-100 p-2 rounded-full"><MailIcon className="w-4 h-4 text-slate-700" /></div>
                  <span className="text-sm text-slate-700 font-medium">{storeInfo.email}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <div className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full flex items-center gap-1.5"><ShieldCheck size={12} className="text-blue-600" /> Verified Seller</div>
              <div className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full flex items-center gap-1.5"><Truck size={12} className="text-green-600" /> Fast Delivery</div>
              <div className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full flex items-center gap-1.5"><Package size={12} className="text-amber-600" /> Quality Products</div>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      {categories.length > 1 && (
        <div className="max-w-7xl mx-auto mt-8 overflow-x-auto">
          <div className="flex space-x-1.5 min-w-max pb-1">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${activeCategory === cat ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="max-w-7xl mx-auto mb-40">
        <div className="flex items-center justify-between mt-12">
          <h1 className="text-2xl">Shop <span className="text-slate-800 font-semibold">{activeCategory !== 'All' ? activeCategory : 'Products'}</span></h1>
          <p className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{filteredProducts.length} products</p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 xl:gap-8">
            {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-10 h-10 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No products found</h3>
            <button onClick={() => setActiveCategory('All')} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium mt-4">View All Products</button>
          </div>
        )}
      </div>
    </div>
  );
}