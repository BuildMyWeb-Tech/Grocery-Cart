// C:\Users\Siddharathan\Desktop\Grocery-Cart\components\Newsletter.jsx
'use client'
import React, { useState } from 'react'
import Title from './Title'
import toast from 'react-hot-toast'

const Newsletter = () => {
    const [email, setEmail] = useState('')

    const handleSubscribe = (e) => {
        e.preventDefault()
        if (!email.trim()) {
            toast.error('Please enter your email address')
            return
        }
        toast.success('Thanks for subscribing!')
        setEmail('')
    }

    return (
        <div className='flex flex-col items-center mx-4 my-36'>
            <Title title="Stay Updated With Fresh Deals" description="Subscribe to receive updates about fresh arrivals, seasonal products, and grocery news." visibleButton={false} />
            <form onSubmit={handleSubscribe} className='flex bg-slate-100 text-sm p-1 rounded-full w-full max-w-xl my-10 border-2 border-white ring ring-slate-200'>
                <input
                    className='flex-1 pl-5 outline-none bg-transparent'
                    type="email"
                    placeholder='Enter your email address'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" className='font-medium bg-green-500 text-white px-7 py-3 rounded-full hover:scale-103 active:scale-95 transition'>Subscribe</button>
            </form>
        </div>
    )
}

export default Newsletter