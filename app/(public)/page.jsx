// C:\Users\Siddharathan\Desktop\Grocery-Cart\app\(public)\page.jsx
'use client'
import BestSelling from "@/components/BestSelling";
import Hero from "@/components/Hero";
import Newsletter from "@/components/Newsletter";
import OurSpecs from "@/components/OurSpec";
import LatestProducts from "@/components/LatestProducts";
import About from "@/components/About";
import ProductCategories from "@/components/ProductCategories";


export default function Home() {
    return (
        <div>
            <Hero />
            <ProductCategories />
            <BestSelling />
            <LatestProducts />
            <About />
            <OurSpecs />
            <Newsletter />
        </div>
    );
}