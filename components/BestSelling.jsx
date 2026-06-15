// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\components\BestSelling.jsx
'use client'
import Title from './Title'
import ProductCard from './ProductCard'
import { useSelector } from 'react-redux'
import { ArrowRightIcon, TrendingUpIcon, AwardIcon } from 'lucide-react'
import Link from 'next/link'

const BestSelling = () => {
  const displayQuantity = 6;
  const products = useSelector((state) => state.product.list);

  return (
    <div className="px-6 my-30 max-w-6xl mx-auto">
      {/* Header */}
      <div className="relative mb-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-2">
            <AwardIcon className="text-amber-500 mr-2" size={20} />
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Best Selling</h2>
            <AwardIcon className="text-amber-500 ml-2" size={20} />
          </div>
          <p className="text-slate-500 mx-auto max-w-xl text-sm">
            Showing {Math.min(products.length, displayQuantity)} of {products.length} products. Our customers' favorite picks!
          </p>
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden sm:block">
          <Link href="/shop"
            className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium transition-colors group bg-white py-2 px-4 rounded-full shadow-sm hover:shadow">
            View more
            <ArrowRightIcon size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Decorative line */}
      <div className="hidden md:flex justify-center mb-10">
        <div className="h-1 w-32 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300 rounded" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
        {products.length === 0 ? (
          Array(displayQuantity).fill(0).map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-80 animate-pulse" />
          ))
        ) : (
          products
            .slice()
            // ✅ Fixed: use ratings (plural) with safe fallback
            .sort((a, b) => (b.ratings?.length ?? 0) - (a.ratings?.length ?? 0))
            .slice(0, displayQuantity)
            .map((product, index) => (
              <div key={product.id || index} className="relative">
                {index === 0 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold py-1 px-3 rounded-full shadow-md flex items-center">
                    <AwardIcon size={14} className="mr-1" /> #1 MOST POPULAR
                  </div>
                )}
                <ProductCard
                  product={product}
                  badgeText={index < 3 ? `#${index + 1} Best Seller` : 'Best Seller'}
                  badgeIcon={<TrendingUpIcon size={12} />}
                />
              </div>
            ))
        )}
      </div>

      {/* Mobile button */}
      <div className="mt-8 sm:hidden">
        <Link href="/shop"
          className="flex items-center justify-center gap-1.5 w-full py-3 px-4 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium">
          View All Best Selling Products
          <ArrowRightIcon size={16} />
        </Link>
      </div>
    </div>
  );
};

export default BestSelling;