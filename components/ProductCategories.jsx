// components/ProductCategories.jsx
'use client';
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Title from './Title';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

const SKELETON_COUNT = 4;

const ProductCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [animateOnScroll, setAnimateOnScroll] = useState([]);
  const [autoScroll, setAutoScroll] = useState(false);
  const carouselRef = useRef(null);

  // ── ✅ Faster load: cache in sessionStorage, render skeleton immediately ──
  useEffect(() => {
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem('categories_all_v1') : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setCategories(parsed);
        setLoading(false);
      } catch {
        // fall through to fetch
      }
    }

    fetch('/api/categories/all')
      .then((res) => res.json())
      .then((data) => {
        const cats = data.categories || [];
        setCategories(cats);
        try {
          sessionStorage.setItem('categories_all_v1', JSON.stringify(cats));
        } catch {
          // storage full or unavailable — ignore
        }
      })
      .catch(() => setCategories((prev) => prev))
      .finally(() => setLoading(false));
  }, []);

  // ── Measure real content overflow to decide scroll mode ─────────
  useLayoutEffect(() => {
    const checkOverflow = () => {
      const el = carouselRef.current;
      if (!el) return;
      setAutoScroll(el.scrollWidth > el.clientWidth + 1);
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [categories, loading]);

  // ── Intersection observer for scroll animations ─────────────────
  useEffect(() => {
    if (categories.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setAnimateOnScroll((prev) => [...prev, parseInt(entry.target.dataset.index)]);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.category-card').forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [categories]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    carouselRef.current.scrollLeft = scrollLeft - (x - startX) * 2;
  };

  const scroll = (direction) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
      <style jsx>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <div className="container px-4 sm:px-6 mx-auto max-w-7xl relative">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-green-100 blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-green-100 blur-3xl translate-x-1/3 translate-y-1/3" />
        </div>

        {/* Header — always renders immediately, no loading dependency */}
        <div className="text-center max-w-3xl mx-auto relative z-10 mb-5">
          <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-sm font-semibold rounded-full mb-3 border border-green-100">
            BROWSE CATEGORIES
          </span>
          <Title
            visibleButton={false}
            title="Shop By Category"
            description="Explore our wide range of products organized into intuitive categories for easier shopping."
            className="mb-4"
          />
          <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-green-500 mx-auto mt-5 rounded-full" />
        </div>

        {/* ✅ Skeleton row — renders instantly while fetch is in flight, same layout as real cards */}
        {loading && categories.length === 0 ? (
          <div className="flex space-x-6 overflow-x-auto scrollbar-none py-4" style={{ scrollbarWidth: 'none' }}>
            {Array(SKELETON_COUNT).fill(0).map((_, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center" style={{ width: '180px' }}>
                <div className="rounded-full bg-slate-200 animate-pulse mb-4" style={{ width: '180px', height: '180px' }} />
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-32 bg-slate-100 rounded animate-pulse hidden sm:block" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ShoppingBag size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No categories available yet</p>
          </div>
        ) : (
          <div className="relative">
            {autoScroll && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:text-slate-900 lg:-left-5"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {/* ✅ Always flex-nowrap + overflow-x-auto on mobile — never wraps vertically */}
            <div
              ref={carouselRef}
              className={`flex flex-nowrap space-x-6 relative z-10 overflow-x-auto scrollbar-none scroll-smooth py-4 ${
                autoScroll ? 'cursor-grab active:cursor-grabbing' : 'sm:justify-center'
              }`}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onMouseDown={autoScroll ? handleMouseDown : null}
              onMouseLeave={autoScroll ? handleMouseLeave : null}
              onMouseUp={autoScroll ? handleMouseUp : null}
              onMouseMove={autoScroll ? handleMouseMove : null}
            >
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  className="category-card flex-shrink-0"
                  data-index={index}
                  initial="hidden"
                  animate={animateOnScroll.includes(index) ? 'visible' : 'hidden'}
                  variants={cardVariants}
                  whileHover={{ scale: 1.03 }}
                  onMouseEnter={() => setActiveCategory(index)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  <Link
                    href={`/shop?category=${encodeURIComponent(category.name)}`}
                    className="block"
                  >
                    <div className="flex flex-col items-center group">
                      {/* Circle image */}
                      <div
                        className="relative rounded-full overflow-hidden mb-4 border-4 border-green-100 shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:border-green-300"
                        style={{ width: '180px', height: '180px' }}
                      >
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          sizes="180px"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        {/* Overlay */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-t from-green-700/60 to-transparent transition-opacity duration-300 ${
                            activeCategory === index ? 'opacity-30' : 'opacity-60'
                          }`}
                        />
                      </div>

                      {/* Name */}
                      <h3 className="text-lg font-medium text-slate-800 text-center mb-1 group-hover:text-green-600 transition-colors">
                        {category.name}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-slate-500 text-center max-w-[180px] hidden sm:block line-clamp-2">
                        {category.description}
                      </p>

                      {/* CTA */}
                      <div
                        className={`mt-3 inline-flex items-center justify-center text-xs font-medium rounded-full px-3 py-1 transition-all duration-200 ${
                          activeCategory === index
                            ? 'opacity-100 bg-green-50 text-green-600'
                            : 'opacity-0 bg-transparent text-transparent'
                        }`}
                      >
                        View Products <ChevronRight size={14} className="ml-1" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {autoScroll && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:text-slate-900 lg:-right-5"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
          >
            <ShoppingBag size={18} className="mr-2" />
            View All Categories
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductCategories;