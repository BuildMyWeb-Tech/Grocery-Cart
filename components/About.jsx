// C:\Users\Siddharathan\Desktop\Grocery-Cart\components\About.jsx
'use client'
import React from 'react'
import Title from './Title'

const About = () => {
    return (
        <div className='px-6 my-30 max-w-6xl mx-auto'>
            <div className="text-center max-w-3xl mx-auto mb-4">
                <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-sm font-semibold rounded-full mb-3 border border-green-100">
                    WHO WE ARE
                </span>
                <Title
                    visibleButton={false}
                    title='Welcome To Grocery Cart'
                    description="Grocery Cart is a multi-vendor grocery marketplace connecting customers with trusted local grocery stores. Buy fresh vegetables, fruits, grocery essentials, and organic products from multiple stores in one convenient platform. Enjoy a smooth shopping experience with secure payments and trusted sellers."
                    className="mb-4"
                />
                <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-green-600 mx-auto mt-5 rounded-full" />
            </div>
        </div>
    )
}

export default About