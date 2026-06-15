// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\components\Navbar.jsx
'use client'
import { PackageIcon, Search, ShoppingCart, HomeIcon, MenuIcon, XIcon, UserIcon, LayoutGridIcon, ShoppingBagIcon, Heart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useUser, useClerk, UserButton, Protect } from "@clerk/nextjs";
import Image from "next/image";
import toast from "react-hot-toast";

const Navbar = () => {
    const { user } = useUser();
    const { openSignIn } = useClerk();
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useDispatch();

    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    
    // Get cart and wishlist counts from redux
    const cartItems = useSelector(state => state.cart.items || []);
    const wishlistItems = useSelector(state => state.wishlist.items || []);
    const cartCount = cartItems.length;
    const wishlistCount = wishlistItems.length;

    // Handle scroll behavior for navbar
    const [isScrolled, setIsScrolled] = useState(false);
    
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const trimmed = search.trim();
        if (trimmed) {
            router.push(`/shop?search=${encodeURIComponent(trimmed)}`);
        } else {
            router.push('/shop');
        }
        setShowSearch(false);
    };

    // Rest of your component remains the same
    // ...


    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 bg-white z-50 ${isScrolled ? 'shadow-md' : ''} transition-all duration-300`}>
                <div className="mx-6">
                    <div className="flex items-center justify-between max-w-7xl mx-auto py-4 transition-all">
                        {/* Logo */}
                        <Link href="/" className="relative text-4xl font-bold text-slate-800 flex items-center">
                            <span className="text-green-600">King</span>cart
                            <span className="text-green-600 text-5xl leading-0">.</span>
                            <Protect plan='plus'>
                                <div className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-gradient-to-r from-green-500 to-green-600 shadow-sm">
                                    plus
                                </div>
                            </Protect>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden sm:flex items-center gap-4 lg:gap-8 text-slate-600">
                            <Link 
                                href="/" 
                                className={`hover:text-green-600 transition-colors relative font-medium ${pathname === '/' ? 'text-green-600' : ''}`}
                            >
                                Home
                                {pathname === '/' && <span className="absolute -bottom-1.5 left-0 w-full h-0.5 bg-green-600 rounded-full"></span>}
                            </Link>
                            <Link 
                                href="/shop" 
                                className={`hover:text-green-600 transition-colors relative font-medium ${pathname === '/shop' ? 'text-green-600' : ''}`}
                            >
                                Shop
                                {pathname === '/shop' && <span className="absolute -bottom-1.5 left-0 w-full h-0.5 bg-green-600 rounded-full"></span>}
                            </Link>
                            <Link 
                                href="/about" 
                                className="hover:text-green-600 transition-colors font-medium"
                            >
                                About
                            </Link>
                            <Link 
                                href="/contact" 
                                className="hover:text-green-600 transition-colors font-medium"
                            >
                                Contact
                            </Link>

                            {/* Desktop Search */}
                            <form 
                                onSubmit={handleSearch} 
                                className="hidden xl:flex items-center w-xs text-sm gap-2 bg-slate-100 hover:bg-slate-200 focus-within:bg-slate-200 px-4 py-3 rounded-full transition-colors"
                            >
                                <Search size={18} className="text-slate-600" />
                                <input 
                                    className="w-full bg-transparent outline-none placeholder-slate-500 text-slate-800" 
                                    type="text" 
                                placeholder="Search products" 
                                    value={search} 
                                    onChange={(e) => setSearch(e.target.value)} 
                                />
                                {search && (
                                    <button type="button" onClick={() => { setSearch(''); router.push('/shop'); }} className="text-slate-400 hover:text-slate-600">
                                        <XIcon size={16} />
                                    </button>
                                )}
                            </form>

                            {/* Desktop Wishlist */}
                            <Link 
                                href="/wishlist" 
                                className="relative flex items-center gap-2 text-slate-600 hover:text-green-600 transition-colors font-medium group"
                            >
                                <div className="relative">
                                    <Heart size={20} />
                                    {wishlistCount > 0 && (
                                        <div className="absolute -top-2 -right-2 text-[10px] font-bold text-white bg-red-500 group-hover:bg-red-600 transition-colors min-w-5 h-5 rounded-full flex items-center justify-center">
                                            {wishlistCount}
                                        </div>
                                    )}
                                </div>
                                Wishlist
                            </Link>

                            {/* Desktop Cart */}
                            <Link 
                                href="/cart" 
                                className="relative flex items-center gap-2 text-slate-600 hover:text-green-600 transition-colors font-medium group"
                            >
                                <div className="relative">
                                    <ShoppingCart size={20} />
                                    {cartCount > 0 && (
                                        <div className="absolute -top-2 -right-2 text-[10px] font-bold text-white bg-green-600 group-hover:bg-green-700 transition-colors min-w-5 h-5 rounded-full flex items-center justify-center">
                                            {cartCount}
                                        </div>
                                    )}
                                </div>
                                Cart
                            </Link>

                            {/* Desktop Login/User */}
                            {!user ? (
                                <button 
                                    onClick={openSignIn} 
                                    className="px-8 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition text-white rounded-full shadow-sm hover:shadow-md font-medium"
                                >
                                    Login
                                </button>
                            ) : (
                                <div className="relative">
                                    <UserButton afterSignOutUrl="/">
                                        <UserButton.MenuItems>
                                            <UserButton.Action 
                                                labelIcon={<PackageIcon size={16}/>} 
                                                label="My Orders" 
                                                onClick={()=> router.push('/orders')}
                                            />
                                        </UserButton.MenuItems>
                                    </UserButton>
                                </div>
                            )}
                        </div>

                        {/* Mobile Top Right Controls */}
                        <div className="flex sm:hidden items-center gap-3">
                            {/* Mobile Wishlist */}
                            <Link 
                                href="/wishlist" 
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
                            >
                                <Heart size={20} />
                                {wishlistCount > 0 && (
                                    <div className="absolute -top-0.5 -right-0.5 text-[10px] font-bold text-white bg-red-500 min-w-4 h-4 rounded-full flex items-center justify-center">
                                        {wishlistCount}
                                    </div>
                                )}
                            </Link>
                        
                            <button 
                                onClick={() => setShowSearch(!showSearch)} 
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <Search size={20} />
                            </button>
                            
                            {user ? (
                                <UserButton afterSignOutUrl="/">
                                    <UserButton.MenuItems>
                                        <UserButton.Action 
                                            labelIcon={<HomeIcon size={16}/>} 
                                            label="Home" 
                                            onClick={()=> router.push('/')}
                                        />
                                        <UserButton.Action 
                                            labelIcon={<ShoppingBagIcon size={16}/>} 
                                            label="Shop" 
                                            onClick={()=> router.push('/shop')}
                                        />
                                        <UserButton.Action 
                                            labelIcon={<Heart size={16}/>} 
                                            label="Wishlist" 
                                            onClick={()=> router.push('/wishlist')}
                                        />
                                        <UserButton.Action 
                                            labelIcon={<PackageIcon size={16}/>} 
                                            label="My Orders" 
                                            onClick={()=> router.push('/orders')}
                                        />
                                        <UserButton.Action 
                                            labelIcon={<ShoppingCart size={16}/>} 
                                            label="Cart" 
                                            onClick={()=> router.push('/cart')}
                                        />
                                    </UserButton.MenuItems>
                                </UserButton>
                            ) : (
                                <button 
                                    onClick={openSignIn} 
                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <UserIcon size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                {showSearch && (
                    <div className="sm:hidden bg-slate-50 p-3 border-t border-slate-100 transition-all">
                        <form 
                            onSubmit={handleSearch} 
                            className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm"
                        >
                            <Search size={18} className="text-slate-400" />
                            <input 
                                className="w-full bg-transparent outline-none placeholder-slate-400 text-slate-800" 
                                type="text" 
                                placeholder="Search for products..." 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                                autoFocus
                            />
                            <button 
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    setShowSearch(false);
                                    if (search) router.push('/shop');
                                }}
                                className="text-slate-400"
                            >
                                <XIcon size={18} />
                            </button>
                        </form>
                    </div>
                )}

                <hr className="border-gray-200" />
            </nav>

            {/* Mobile Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 sm:hidden shadow-lg">
                <div className="grid grid-cols-5 py-1">
                    <Link href="/" className={`flex flex-col items-center justify-center py-2 text-xs ${pathname === '/' ? 'text-green-600' : 'text-slate-600'}`}>
                        <HomeIcon size={20} className={`mb-1 ${pathname === '/' ? 'text-green-600' : 'text-slate-500'}`} />
                        <span className="font-medium">Home</span>
                    </Link>
                    
                    <Link href="/shop" className={`flex flex-col items-center justify-center py-2 text-xs ${pathname.includes('/shop') ? 'text-green-600' : 'text-slate-600'}`}>
                        <LayoutGridIcon size={20} className={`mb-1 ${pathname.includes('/shop') ? 'text-green-600' : 'text-slate-500'}`} />
                        <span className="font-medium">Shop</span>
                    </Link>
                    
                    <Link href="/wishlist" className={`flex flex-col items-center justify-center py-2 text-xs ${pathname.includes('/wishlist') ? 'text-red-500' : 'text-slate-600'} relative`}>
                        <div className="relative">
                            <Heart size={20} className={`mb-1 ${pathname.includes('/wishlist') ? 'text-red-500 fill-red-500' : 'text-slate-500'}`} />
                            {wishlistCount > 0 && (
                                <div className="absolute -top-2 -right-2 text-[10px] font-bold text-white bg-red-500 min-w-4 h-4 rounded-full flex items-center justify-center">
                                    {wishlistCount}
                                </div>
                            )}
                        </div>
                        <span className="font-medium">Wishlist</span>
                    </Link>
                    
                    <Link href="/orders" className={`flex flex-col items-center justify-center py-2 text-xs ${pathname.includes('/orders') ? 'text-green-600' : 'text-slate-600'}`}>
                        <PackageIcon size={20} className={`mb-1 ${pathname.includes('/orders') ? 'text-green-600' : 'text-slate-500'}`} />
                        <span className="font-medium">Orders</span>
                    </Link>
                    
                    <Link href="/cart" className={`flex flex-col items-center justify-center py-2 text-xs ${pathname.includes('/cart') ? 'text-green-600' : 'text-slate-600'} relative`}>
                        <div className="relative">
                            <ShoppingCart size={20} className={`mb-1 ${pathname.includes('/cart') ? 'text-green-600' : 'text-slate-500'}`} />
                            {cartCount > 0 && (
                                <div className="absolute -top-2 -right-2 text-[10px] font-bold text-white bg-green-600 min-w-4 h-4 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </div>
                            )}
                        </div>
                        <span className="font-medium">Cart</span>
                    </Link>
                </div>
            </div>
            
            {/* Page content spacing to accommodate fixed navbar */}
            <div className="h-16 sm:h-20"></div>
            
            {/* Page content spacing to accommodate fixed bottom nav on mobile */}
            <div className=" sm:h-0 "></div>
        </>
    );
};

export default Navbar;
