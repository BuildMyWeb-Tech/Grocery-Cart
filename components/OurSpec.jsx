'use client'
import React, { useState, useEffect } from 'react'
import Title from './Title'
import { ourSpecsData } from '@/assets/assets'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react'

const OurSpecs = () => {
    const [activeSpec, setActiveSpec] = useState(null)
    const [animateOnScroll, setAnimateOnScroll] = useState([])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setAnimateOnScroll(prev => [...prev, parseInt(entry.target.dataset.index)])
                    }
                })
            },
            { threshold: 0.1 }
        )

        document.querySelectorAll('.spec-card').forEach(card => {
            observer.observe(card)
        })

        return () => observer.disconnect()
    }, [])

    // Card hover animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    }

    return (
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
            <div className='container px-4 sm:px-6 mx-auto max-w-6xl relative'>
                {/* Decorative background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                    <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-teal-100 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-indigo-100 blur-3xl translate-x-1/3 translate-y-1/3"></div>
                </div>

                {/* Section Header with improved styling */}
                <div className="text-center max-w-3xl mx-auto relative z-10 mb-16">
                    <span className="inline-block px-3 py-1 bg-gradient-to-r from-teal-50 to-indigo-50 text-teal-700 text-sm font-semibold rounded-full mb-3 border border-teal-100">
                        WHY CHOOSE US
                    </span>
                    <Title 
                        visibleButton={false} 
                        title='Our Specifications' 
                        description="We offer top-tier service and convenience to ensure your shopping experience is smooth, secure and completely hassle-free." 
                        className="mb-4"
                    />
                    <div className="w-20 h-1 bg-gradient-to-r from-teal-500 to-indigo-500 mx-auto mt-5 rounded-full"></div>
                </div>

                {/* Feature cards with improved layout and animations */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10'>
                    {ourSpecsData.map((spec, index) => (
                        <motion.div 
                            key={index}
                            className="spec-card"
                            data-index={index}
                            initial="hidden"
                            animate={animateOnScroll.includes(index) ? "visible" : "hidden"}
                            variants={cardVariants}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            onMouseEnter={() => setActiveSpec(index)}
                            onMouseLeave={() => setActiveSpec(null)}
                        >
                            <div 
                                className={`relative h-full rounded-xl bg-white overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group`}
                                style={{ 
                                    borderLeft: `4px solid ${spec.accent}`
                                }}
                            >
                                {/* Card content */}
                                <div className="p-8 h-full flex flex-col">
                                    {/* Icon */}
                                    <div className='flex items-center justify-start mb-6'>
                                        <div 
                                            className="flex items-center justify-center size-14 rounded-lg group-hover:scale-110 transition-all duration-300" 
                                            style={{ 
                                                background: `linear-gradient(135deg, ${spec.accent}, ${spec.accent}CC)`
                                            }}
                                        >
                                            <spec.icon size={24} className="text-white" />
                                        </div>
                                    </div>
                                    
                                    {/* Title */}
                                    <h3 className='text-xl font-semibold text-slate-800 mb-3 group-hover:text-teal-700 transition-colors'>
                                        {spec.title}
                                    </h3>
                                    
                                    {/* Description */}
                                    <p className='text-slate-600 mb-5 flex-grow'>
                                        {spec.description}
                                    </p>
                                    
                                    {/* Features list */}
                                    <ul className='space-y-2 mb-6'>
                                        {['Feature 1', 'Feature 2'].map((feature, i) => (
                                            <li key={i} className='flex items-start'>
                                                <CheckCircle2 
                                                    size={16} 
                                                    className="mr-2 mt-0.5 text-teal-500 flex-shrink-0" 
                                                />
                                                <span className='text-sm text-slate-600'>
                                                    {feature} for {spec.title.toLowerCase()}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    
                                    
                                    {/* Subtle accent top corner decoration */}
                                    <div 
                                        className="absolute top-0 right-0 w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10"
                                        style={{ backgroundColor: spec.accent }}
                                    ></div>
                                </div>
                                
                                {/* Animated progress bar on hover */}
                                <div 
                                    className='absolute bottom-0 left-0 h-1 transition-all duration-500 ease-out'
                                    style={{ 
                                        width: activeSpec === index ? '100%' : '0%',
                                        background: `linear-gradient(90deg, ${spec.accent}99, ${spec.accent})` 
                                    }}
                                ></div>
                            </div>
                        </motion.div>
                    ))}
                </div>
                
                
            </div>
        </section>
    )
}

export default OurSpecs
