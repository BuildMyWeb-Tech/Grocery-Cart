'use client'
import Counter from "@/components/Counter";
import OrderSummary from "@/components/OrderSummary";
import PageTitle from "@/components/PageTitle";
import { deleteItemFromCart } from "@/lib/features/cart/cartSlice";
import { Trash2Icon, ShoppingBagIcon, ArrowLeftIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";

export default function Cart() {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';
    
    const { cartItems } = useSelector(state => state.cart);
    const products = useSelector(state => state.product.list);

    const dispatch = useDispatch();

    const [cartArray, setCartArray] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);

    const createCartArray = () => {
        setTotalPrice(0);
        const cartArray = [];
        for (const [key, value] of Object.entries(cartItems)) {
            const product = products.find(product => product.id === key);
            if (product) {
                cartArray.push({
                    ...product,
                    quantity: value,
                });
                setTotalPrice(prev => prev + product.price * value);
            }
        }
        setCartArray(cartArray);
    }

    const handleDeleteItemFromCart = (productId) => {
        dispatch(deleteItemFromCart({ productId }))
    }

    useEffect(() => {
        if (products.length > 0) {
            createCartArray();
        }
    }, [cartItems, products]);

    return cartArray.length > 0 ? (
        <div className="min-h-screen mx-6 text-slate-800 pb-16">
            <div className="max-w-7xl mx-auto">
                {/* Title */}
                <PageTitle heading="My Cart" text={`${cartArray.length} ${cartArray.length === 1 ? 'item' : 'items'} in your cart`} linkText="Continue Shopping" />

                {/* Breadcrumb - New Addition */}
                <div className="mb-6 flex items-center text-sm text-slate-500">
                    <Link href="/" className="hover:text-slate-800 transition-colors">Home</Link>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-slate-700">Shopping Cart</span>
                </div>

                <div className="flex items-start justify-between gap-8 max-lg:flex-col">
                    {/* Cart Table */}
                    <div className="w-full flex-1 bg-white rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full max-w-4xl text-slate-600 table-auto">
                            <thead className="bg-slate-50 text-slate-700">
                                <tr className="max-sm:text-sm">
                                    <th className="text-left py-4 px-4 font-semibold">Product</th>
                                    <th className="py-4 font-semibold">Quantity</th>
                                    <th className="py-4 font-semibold">Total Price</th>
                                    <th className="py-4 max-md:hidden font-semibold">Remove</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cartArray.map((item, index) => (
                                    <tr 
                                        key={index} 
                                        className={`space-x-2 hover:bg-slate-50 transition-colors ${index !== cartArray.length - 1 ? 'border-b border-slate-100' : ''}`}
                                    >
                                        <td className="flex gap-4 my-4 px-4 py-2">
                                            <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 size-20 rounded-lg shadow-sm group">
                                                <Image 
                                                    src={item.images[0]} 
                                                    className="h-16 w-auto object-contain group-hover:scale-105 transition-transform" 
                                                    alt={item.name} 
                                                    width={60} 
                                                    height={60}
                                                />
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <p className="font-medium text-slate-800 hover:text-green-600 transition-colors cursor-pointer max-sm:text-sm">{item.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-500">{item.category}</span>
                                                    <span className="md:hidden text-xs text-red-500 flex items-center" onClick={() => handleDeleteItemFromCart(item.id)}>
                                                        <Trash2Icon size={12} className="mr-1" /> Remove
                                                    </span>
                                                </div>
                                                <p className="mt-1 font-medium text-slate-700">{currency}{item.price.toLocaleString()}</p>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div className="flex justify-center">
                                                <Counter productId={item.id} />
                                            </div>
                                        </td>
                                        <td className="text-center font-medium">{currency}{(item.price * item.quantity).toLocaleString()}</td>
                                        <td className="text-center max-md:hidden">
                                            <button 
                                                onClick={() => handleDeleteItemFromCart(item.id)} 
                                                className="text-red-500 hover:bg-red-50 p-2.5 rounded-full active:scale-95 transition-all"
                                            >
                                                <Trash2Icon size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile: Continue Shopping */}
                        <div className="md:hidden p-4 pt-0">
                            <Link href="/shop" className="flex items-center justify-center gap-2 text-sm text-slate-600 py-3 px-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                <ArrowLeftIcon size={16} />
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                    
                    {/* Order Summary */}
                    <OrderSummary totalPrice={totalPrice} items={cartArray} />
                </div>
            </div>
        </div>
    ) : (
        <div className="min-h-[80vh] mx-6 flex flex-col items-center justify-center text-slate-400">
            <ShoppingBagIcon size={80} className="text-slate-300 mb-6" strokeWidth={1} />
            <h1 className="text-2xl sm:text-4xl font-semibold mb-3">Your cart is empty</h1>
            <p className="text-slate-500 mb-8 text-center">Looks like you haven't added anything to your cart yet.</p>
            <Link 
                href="/shop" 
                className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors"
            >
                Start Shopping
            </Link>
        </div>
    )
}
