// C:\Users\Siddharathan\Desktop\Grocery-Cart\app\(public)\about\page.jsx
import Link from 'next/link'
import { ourSpecsData } from '@/assets/assets'
import { ArrowRightIcon, StoreIcon } from 'lucide-react'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-16 px-4">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl sm:text-4xl font-semibold text-slate-800">
                        Welcome To <span className="text-green-600">Grocery Cart</span>
                    </h1>
                    <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
                        Grocery Cart is a multi-vendor grocery marketplace connecting customers with trusted local grocery stores. Buy fresh vegetables, fruits, grocery essentials, and organic products from multiple stores in one convenient platform. Enjoy a smooth shopping experience with secure payments and trusted sellers.
                    </p>
                </div>

                {/* Mission */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 mb-12">
                    <h2 className="text-xl font-semibold text-slate-800 mb-3">Our Mission</h2>
                    <p className="text-slate-600">
                        We believe grocery shopping should be simple, fresh, and reliable. Grocery Cart brings together local stores and sellers on a single platform, so you can shop fruits, vegetables, organic produce, and everyday essentials without compromising on quality or convenience. Every store on our platform is reviewed and approved before going live, so you always know who you're buying from.
                    </p>
                </div>

                {/* Why Choose Us */}
                <div className="mb-12">
                    <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">Why Shop With Us</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {ourSpecsData.map((spec, index) => (
                            <div key={index} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-center">
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
                                    style={{ background: `linear-gradient(135deg, ${spec.accent}, ${spec.accent}CC)` }}
                                >
                                    <spec.icon size={22} className="text-white" />
                                </div>
                                <h3 className="text-sm font-semibold text-slate-800 mb-1">{spec.title}</h3>
                                <p className="text-xs text-slate-500">{spec.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seller CTA */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-8 text-center text-white mb-12">
                    <StoreIcon size={32} className="mx-auto mb-3" />
                    <h2 className="text-xl font-semibold mb-2">Own A Grocery Store?</h2>
                    <p className="text-green-50 mb-5 max-w-lg mx-auto">
                        Join Grocery Cart as a seller and reach more customers in your area.
                    </p>
                    <Link
                        href="/create-store"
                        className="inline-flex items-center gap-2 bg-white text-green-700 px-6 py-2.5 rounded-lg font-medium hover:bg-green-50 transition-colors"
                    >
                        Start Selling <ArrowRightIcon size={16} />
                    </Link>
                </div>

                {/* Shop CTA */}
                <div className="text-center">
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-7 py-3 rounded-lg font-medium transition-colors"
                    >
                        Start Shopping <ArrowRightIcon size={16} />
                    </Link>
                </div>

            </div>
        </div>
    )
}