'use client'
import React from 'react'
import { CheckIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
    const { isSignedIn } = useAuth()
    const router = useRouter()
    
    const handleSubscribe = async (plan) => {
        if (!isSignedIn) {
            router.push('/sign-in?redirect_url=/pricing')
            return
        }
        
        // Here you would integrate with your payment provider
        // For now, we'll just show an alert
        alert(`Subscribing to ${plan} plan. In a real app, this would redirect to a payment page.`)
    }

    const pricingPlans = [
        {
            name: "Free",
            description: "Essential features for individuals",
            price: 0,
            period: "forever",
            features: [
                { name: "Basic product browsing", included: true },
                { name: "Up to 10 orders per month", included: true },
                { name: "Standard shipping", included: true },
                { name: "Email support", included: true },
                { name: "Priority shipping", included: false },
                { name: "Exclusive discounts", included: false },
                { name: "Priority customer support", included: false },
                { name: "Early access to new products", included: false },
            ],
            cta: "Get Started",
            most_popular: false,
            bgGradient: "from-slate-50 to-slate-100",
            borderColor: "border-slate-200",
            ctaColor: "bg-slate-800 hover:bg-slate-900 text-white"
        },
        {
            name: "Plus",
            description: "Advanced features for regular shoppers",
            price: 9.99,
            period: "month",
            features: [
                { name: "Basic product browsing", included: true },
                { name: "Unlimited orders", included: true },
                { name: "Free standard shipping", included: true },
                { name: "Email and chat support", included: true },
                { name: "Priority shipping", included: true },
                { name: "5% discount on all products", included: true },
                { name: "Priority customer support", included: false },
                { name: "Early access to new products", included: false },
            ],
            cta: "Subscribe",
            most_popular: true,
            bgGradient: "from-green-50 to-green-100",
            borderColor: "border-green-200",
            ctaColor: "bg-green-600 hover:bg-green-700 text-white"
        },
        {
            name: "Premium",
            description: "Everything you need for the best experience",
            price: 19.99,
            period: "month",
            features: [
                { name: "Basic product browsing", included: true },
                { name: "Unlimited orders", included: true },
                { name: "Free express shipping", included: true },
                { name: "24/7 priority support", included: true },
                { name: "Priority shipping", included: true },
                { name: "10% discount on all products", included: true },
                { name: "Premium customer support", included: true },
                { name: "Early access to new products", included: true },
            ],
            cta: "Subscribe",
            most_popular: false,
            bgGradient: "from-blue-50 to-blue-100",
            borderColor: "border-blue-200",
            ctaColor: "bg-blue-600 hover:bg-blue-700 text-white"
        }
    ]

    return (
        <div className='px-6 py-20 max-w-7xl mx-auto'>
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold text-slate-800 mb-4">Choose Your Plan</h1>
                <p className="text-slate-600 max-w-2xl mx-auto">
                    Select the perfect plan for your shopping needs. Upgrade or downgrade anytime.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {pricingPlans.map((plan, index) => (
                    <div 
                        key={index} 
                        className={`relative rounded-2xl shadow-sm border ${plan.borderColor} overflow-hidden transition-all hover:shadow-md transform hover:-translate-y-1 bg-gradient-to-br ${plan.bgGradient}`}
                    >
                        {plan.most_popular && (
                            <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-3 py-1">
                                MOST POPULAR
                            </div>
                        )}
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-slate-800">{plan.name}</h2>
                            <p className="text-slate-600 mt-1 h-12">{plan.description}</p>
                            <div className="mt-4 mb-6">
                                <span className="text-4xl font-bold text-slate-800">
                                    ${plan.price}
                                </span>
                                <span className="text-slate-600 ml-2">
                                    /{plan.period}
                                </span>
                            </div>
                            
                            <button 
                                onClick={() => handleSubscribe(plan.name)}
                                className={`w-full py-3 rounded-lg font-medium transition-colors ${plan.ctaColor}`}
                            >
                                {plan.cta}
                            </button>
                        </div>
                        
                        <div className="border-t border-slate-200 bg-white p-6">
                            <h3 className="font-semibold text-slate-800 mb-4">What's included:</h3>
                            <ul className="space-y-3">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className={`mt-0.5 ${feature.included ? 'text-green-500' : 'text-slate-300'}`}>
                                            {feature.included ? 
                                                <CheckIcon size={18} className="text-green-500" /> : 
                                                <XIcon size={18} className="text-slate-300" />
                                            }
                                        </div>
                                        <span className={feature.included ? 'text-slate-700' : 'text-slate-400'}>
                                            {feature.name}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-16 bg-slate-50 rounded-xl p-8 text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Need a custom plan?</h2>
                <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                    If you're looking for specific features or have special requirements, we're here to help create a tailored solution for you.
                </p>
                <Link
                    href="/contact"
                    className="inline-block px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
                >
                    Contact Sales
                </Link>
            </div>
            
            <div className="mt-16 text-center">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Frequently Asked Questions</h3>
                <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 text-left">
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h4 className="font-medium text-slate-800 mb-2">Can I change my plan later?</h4>
                        <p className="text-slate-600 text-sm">Yes, you can upgrade or downgrade your plan at any time. Changes will be applied to your next billing cycle.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h4 className="font-medium text-slate-800 mb-2">How do discounts work?</h4>
                        <p className="text-slate-600 text-sm">Discounts are automatically applied to your orders at checkout based on your subscription plan.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h4 className="font-medium text-slate-800 mb-2">Do you offer refunds?</h4>
                        <p className="text-slate-600 text-sm">Yes, we offer a 30-day money-back guarantee if you're not satisfied with your subscription.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h4 className="font-medium text-slate-800 mb-2">What payment methods are accepted?</h4>
                        <p className="text-slate-600 text-sm">We accept major credit cards, PayPal, and Apple Pay. All payments are processed securely.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
