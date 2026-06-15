// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\components\LatestProducts.jsx
'use client'
import React from 'react'
import Title from './Title'
import ProductCard from './ProductCard'
import { useSelector } from 'react-redux'
import { ArrowRightIcon, ClockIcon, SparklesIcon } from 'lucide-react'
import Link from 'next/link'

const LatestProducts = () => {
    const displayQuantity = 6 // 2 rows of 3 products
    const products = useSelector(state => state.product.list)

    return (
        <div className='px-6 my-30 max-w-6xl mx-auto'>
            {/* Header Section with Centered Title */}
            <div className="relative mb-8">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center mb-2">
                        <SparklesIcon className="text-yellow-500 mr-2" size={20} />
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Latest Products</h2>
                        <SparklesIcon className="text-yellow-500 ml-2" size={20} />
                    </div>
                    <p className="text-slate-500 mx-auto max-w-xl text-sm">
                        Showing {Math.min(products.length, displayQuantity)} of {products.length} products. Discover our newest arrivals.
                    </p>
                </div>
                
                {/* View More Button - Positioned Absolutely to the Right */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden sm:block">
                    <Link 
                        href="/shop" 
                        className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium transition-colors group bg-white py-2 px-3 rounded-full shadow-sm hover:shadow"
                    >
                        View more 
                        <ArrowRightIcon size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
            
            {/* Decorative Element */}
            <div className="hidden md:flex justify-center mb-8">
                <div className="h-1 w-24 bg-gradient-to-r from-transparent via-green-500 to-transparent rounded"></div>
            </div>
            
            {/* Product Grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8'>
                {products.length === 0 ? (
                    // Loading state or empty state
                    Array(displayQuantity).fill(0).map((_, index) => (
                        <div key={index} className="bg-slate-100 rounded-2xl h-80 animate-pulse"></div>
                    ))
                ) : (
                    // Products
                    products
                        .slice()
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, displayQuantity)
                        .map((product, index) => (
                            <ProductCard 
                                key={index} 
                                product={product} 
                                badgeText="New Arrival" 
                                badgeIcon={<ClockIcon size={12} />} 
                            />
                        ))
                )}
            </div>

            
            
            {/* Mobile View All Button */}
            <div className="mt-8 sm:hidden">
                <Link 
                    href="/shop" 
                    className="flex items-center justify-center gap-1.5 w-full py-3 px-4 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                    View All Latest Products 
                    <ArrowRightIcon size={16} />
                </Link>
            </div>
        </div>
    )
}

export default LatestProducts
