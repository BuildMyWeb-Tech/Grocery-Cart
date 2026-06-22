// C:\Users\Siddharathan\Desktop\Grocery-Cart\components\Hero.jsx
'use client'
import { assets } from '@/assets/assets'
import { ArrowRight, ChevronRight, Zap, Star, Tag, Award } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import CategoriesMarquee from './CategoriesMarquee'

const Hero = () => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'
    const [scrolled, setScrolled] = useState(false)

    // Add scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <section className='overflow-hidden'>
            {/* Main Hero Container */}
            <div className='mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl'>
                <div className=''>
                    {/* Main Content Container */}
                    <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
                        {/* Main Hero Section - Left side */}
                        <div className='lg:col-span-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 shadow-lg hover:shadow-xl transition-all duration-500'>
                            <div className='h-full flex flex-col relative z-10 p-6 sm:p-10 lg:p-12'>
                                {/* Floating Badge */}
                                <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm max-w-max mb-6 shadow-lg ${scrolled ? 'animate-pulse' : ''} transition-all duration-300`}>
                                    <Zap className='w-3 h-3 sm:w-4 sm:h-4' />
                                    <span className="font-medium tracking-wide">FRESH PICKS DAILY</span> 
                                </div>
                                
                                {/* Main Heading with animated gradient */}
                                <h2 className='text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-4 lg:mb-6 max-w-xl'>
                                    <span className='bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-700 bg-clip-text text-transparent animate-gradient'>
                                        Fresh Groceries Delivered Daily
                                    </span>
                                </h2>
                                
                                {/* Subheading */}
                                <p className='text-slate-700 text-lg mb-6 lg:mb-8 max-w-xl'>
                                    Shop farm-fresh vegetables, fruits, and daily grocery essentials from trusted local stores. Discover fresh produce, organic products, and household essentials all in one place.
                                </p>
                                
                                
                                
                                {/* CTA Buttons */}
                                <div className='flex flex-wrap gap-4 mt-auto'>
                                    <Link href="/shop" className='relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-3 rounded-lg font-medium tracking-wide group inline-flex items-center'>
                                        <span className='relative z-10 flex items-center'>
                                            Start Shopping
                                            <ArrowRight className='ml-2 group-hover:translate-x-1 transition-transform' size={18} />
                                        </span>
                                        <span className='absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></span>
                                    </Link>
                                    
                                    <Link href="/shop" className='bg-white/40 backdrop-blur-sm border border-emerald-200 hover:bg-white/70 text-slate-700 px-6 py-3 rounded-lg font-medium tracking-wide transition-all duration-300 inline-flex items-center'>
                                        Browse Stores
                                    </Link>
                                </div>
                                
                                {/* Free Shipping Badge */}
                                <div className='absolute top-8 right-8 bg-white/70 backdrop-blur-md px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 border border-emerald-100 shadow-sm'>
                                    <Tag className='w-3 h-3 text-emerald-600' />
                                    <span className='text-slate-700'>Free Delivery on Orders Above {currency}50</span>
                                </div>
                            </div>
                            
                            {/* Decorative Elements */}
                            <div className='absolute inset-0 pointer-events-none overflow-hidden'>
                                <div className='absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-r from-teal-200 to-emerald-200 opacity-30'></div>
                                <div className='absolute top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-r from-cyan-200 to-teal-200 opacity-30'></div>
                                <div className='absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-cyan-300 opacity-20 animate-float'></div>
                                <div className='absolute bottom-1/4 right-1/4 w-10 h-10 rounded-full bg-emerald-300 opacity-20 animate-float-delay'></div>
                            </div>
                            
                            {/* Product Image */}
                            <Image 
                                className='absolute bottom-0 right-0 w-full max-w-md xl:max-w-lg object-contain drop-shadow-2xl animate-image-float' 
                                src={assets.hero_model_img} 
                                alt="Fresh grocery basket" 
                                priority
                            />
                        </div>

                        {/* Side Cards - Right side */}
                        <div className='lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6'>
                            {/* Best Products Card */}
                            <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 shadow-lg hover:shadow-xl transition-all duration-500 group'>
                                <div className='p-6 sm:p-8 flex flex-col h-full'>
                                    <div className='mb-auto'>
                                        <div className='flex items-center gap-2 mb-4'>
                                            <Award className='text-amber-500 w-5 h-5' />
                                            <span className='text-amber-600 text-sm font-medium uppercase tracking-wider'>Best Sellers</span>
                                        </div>
                                        
                                        <h3 className='text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent mb-2'>
                                            Farm Fresh Favorites
                                        </h3>
                                        
                                        <p className='text-slate-600 mb-6'>
                                            Hand-picked fresh produce, loved by thousands of happy customers
                                        </p>
                                    </div>
                                    
                                    <Link href="/shop" className='flex items-center text-amber-700 font-medium text-sm group-hover:text-amber-900 transition-all duration-300 mt-auto'>
                                        Explore Collection
                                        <ArrowRight className='ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform' />
                                    </Link>
                                </div>
                                
                                {/* Background Elements */}
                                <div className='absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden'>
                                    <div className='absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-r from-amber-200 to-orange-200 opacity-30'></div>
                                </div>
                                
                                {/* Product Image */}
                                <Image 
                                    className='absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-32 sm:w-40 object-contain drop-shadow-lg transform group-hover:scale-110 transition-transform duration-500' 
                                    src={assets.hero_product_img1} 
                                    alt="Best selling grocery item" 
                                />
                            </div>

                            {/* Discounts Card */}
                            <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100 shadow-lg hover:shadow-xl transition-all duration-500 group'>
                                <div className='p-6 sm:p-8 flex flex-col h-full'>
                                    <div className='mb-auto'>
                                        <div className='inline-flex items-center gap-1 bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-medium mb-4'>
                                            <span>SALE</span>
                                            <span className='font-bold'>20% OFF</span>
                                        </div>
                                        
                                        <h3 className='text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-700 to-blue-600 bg-clip-text text-transparent mb-2'>
                                            Weekly Fresh Offers
                                        </h3>
                                        
                                        <p className='text-slate-600 mb-6'>
                                            Save big on fruits, veggies, and daily essentials
                                        </p>
                                    </div>
                                    
                                    <Link href="/shop" className='flex items-center text-indigo-700 font-medium text-sm group-hover:text-indigo-900 transition-all duration-300 mt-auto'>
                                        View Offers
                                        <ArrowRight className='ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform' />
                                    </Link>
                                </div>
                                
                                {/* Background Elements */}
                                <div className='absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden'>
                                    <div className='absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-r from-blue-200 to-indigo-200 opacity-30'></div>
                                </div>
                                
                                {/* Product Image */}
                                <Image 
                                    className='absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-32 sm:w-40 object-contain drop-shadow-lg transform group-hover:scale-110 transition-transform duration-500' 
                                    src={assets.hero_product_img2} 
                                    alt="Discounted grocery item" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Categories Section */}
            <div className='mt-8 md:mt-6'>
                <CategoriesMarquee />
            </div>
            
            {/* Add styles for animations */}
            <style jsx global>{`
                @keyframes gradient {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }
                
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-20px);
                    }
                }
                
                @keyframes float-delay {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-15px);
                    }
                }
                
                @keyframes image-float {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }
                
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 8s ease infinite;
                }
                
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                
                .animate-float-delay {
                    animation: float-delay 7s ease-in-out infinite;
                }
                
                .animate-image-float {
                    animation: image-float 6s ease-in-out infinite;
                }
            `}</style>
        </section>
    )
}

export default Hero