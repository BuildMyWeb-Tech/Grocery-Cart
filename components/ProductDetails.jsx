// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\components\ProductDetails.jsx
'use client';
import {
  StarIcon, ShieldCheckIcon, TruckIcon, ShoppingCartIcon,
  ShareIcon, Zap, RefreshCw, Check, AlertTriangle, Heart,
  Minus, Plus, Package,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/lib/features/cart/cartSlice';
import { addToWishlist, removeFromWishlist } from '@/lib/features/wishlist/wishlistSlice';
import toast from 'react-hot-toast';

export default function ProductDetails({ product }) {
  const dispatch  = useDispatch();
  const router    = useRouter();
  const cartItems     = useSelector((state) => state.cart.items || []);
  const wishlistItems = useSelector((state) => state.wishlist.items || []);

  const [mainImage,     setMainImage]     = useState(product.images?.[0]);
  const [imageLoading,  setImageLoading]  = useState(true);
  const [quantity,      setQuantity]      = useState(1);
  const [isZoomed,      setIsZoomed]      = useState(false);
  const [mousePos,      setMousePos]      = useState({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize,  setSelectedSize]  = useState(null);
  const imageContainerRef = useRef(null);

  const colors       = [...new Set((product.variants || []).map((v) => v.color).filter(Boolean))];
  const sizesForColor = selectedColor
    ? (product.variants || []).filter((v) => v.color === selectedColor).map((v) => v.size)
    : [...new Set((product.variants || []).map((v) => v.size).filter(Boolean))];

  const selectedVariant = selectedColor && selectedSize
    ? (product.variants || []).find((v) => v.color === selectedColor && v.size === selectedSize)
    : null;

  const variantStock  = selectedVariant?.stock ?? 0;
  const variantPrice  = selectedVariant ? Number(selectedVariant.price) : null;
  const allPrices     = (product.variants || []).map((v) => Number(v.price) || 0).filter((p) => p > 0);
  const displayPrice  = variantPrice ?? (allPrices.length ? Math.min(...allPrices) : 0);

  const categoryDisplay =
    (product.categories || []).map((c) => c.category?.name || c.name).filter(Boolean).join(' • ') ||
    (Array.isArray(product.category) ? product.category.join(' • ') : product.category || '');

  const ratings    = product.ratings || [];
  const avgRating  = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
  const totalStock = (product.variants || []).reduce((s, v) => s + (v.stock || 0), 0);

  const isInWishlist = wishlistItems.some((i) => (i.id || i.productId) === product.id);
  const isInCart     = selectedVariant ? cartItems.some((i) => i.variantId === selectedVariant.id) : false;

  useEffect(() => {
    if (colors.length === 1) setSelectedColor(colors[0]);
    else setSelectedColor(null);
    setSelectedSize(null);
  }, [product.id]);

  useEffect(() => {
    if (sizesForColor.length === 1) setSelectedSize(sizesForColor[0]);
    else setSelectedSize(null);
  }, [selectedColor]);

  const addToCartHandler = () => {
    if (!selectedColor)   { toast.error('Please select a color'); return; }
    if (!selectedSize)    { toast.error('Please select a size'); return; }
    if (!selectedVariant) { toast.error('Select a valid variant'); return; }
    if (variantStock === 0) { toast.error('Out of stock'); return; }
    if (quantity > variantStock) { toast.error(`Only ${variantStock} available`); return; }

    dispatch(addToCart({
      variantId:    selectedVariant.id,
      productId:    product.id,
      name:         product.name,
      productName:  product.name,
      price:        Number(selectedVariant.price),
      image:        product.images?.[0] || '/placeholder.png',
      productImage: product.images?.[0] || '/placeholder.png',
      quantity,
      category:     categoryDisplay,
      color:        selectedColor,
      size:         selectedSize,
      sku:          selectedVariant.sku,
      stock:        variantStock,
      storeId:      product.storeId || product.store?.id,
      storeName:    product.store?.name || '',
    }));
    toast.success(`Added to cart!`, { icon: '🛒' });
  };

  const toggleWishlist = () => {
    if (isInWishlist) {
      dispatch(removeFromWishlist(product.id));
      toast('Removed from wishlist', { icon: '💔' });
    } else {
      dispatch(addToWishlist({ id: product.id, name: product.name, price: displayPrice, image: product.images?.[0] }));
      toast.success('Added to wishlist!', { icon: '❤️' });
    }
  };

  const handleMouseMove = (e) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    setMousePos({ x: ((e.clientX - left) / width) * 100, y: ((e.clientY - top) / height) * 100 });
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex max-lg:flex-col gap-0 lg:gap-0">

        {/* ── Left: Images ──────────────────────────────────────── */}
        <div className="lg:w-[48%] bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
          {/* Main image */}
          <div
            ref={imageContainerRef}
            className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white shadow-sm cursor-zoom-in mb-4"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            {imageLoading && <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-200 animate-pulse rounded-2xl" />}
            {isZoomed && mainImage ? (
              <div className="absolute inset-0 overflow-hidden">
                <Image src={mainImage} alt={product.name} width={1000} height={1000}
                  onLoad={() => setImageLoading(false)}
                  className="absolute w-[200%] h-[200%] object-contain"
                  style={{ transform: `translate(-${mousePos.x}%, -${mousePos.y}%) scale(2)`, transformOrigin: 'top left' }} />
              </div>
            ) : (
              <Image src={mainImage || product.images?.[0]} alt={product.name} fill
                onLoad={() => setImageLoading(false)}
                className={`object-contain p-6 transition-all duration-500 ${imageLoading ? 'opacity-0' : 'opacity-100'}`} />
            )}
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setMainImage(img)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${mainImage === img ? 'border-green-500 shadow-md' : 'border-transparent hover:border-slate-300'}`}>
                  <Image src={img} alt={`View ${i + 1}`} fill className="object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Info ────────────────────────────────────────── */}
        <div className="flex-1 p-6 lg:p-8 flex flex-col">

          {/* Top meta */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex flex-wrap gap-2">
              {categoryDisplay && (
                <span className="text-xs bg-green-50 text-green-700 font-medium px-3 py-1 rounded-full border border-green-100">
                  {categoryDisplay}
                </span>
              )}
              {product.brand && (
                <span className="text-xs bg-slate-100 text-slate-600 font-medium px-3 py-1 rounded-full">
                  {product.brand}
                </span>
              )}
            </div>
            <button onClick={toggleWishlist}
              className={`p-2.5 rounded-xl border-2 transition-all flex-shrink-0 ${isInWishlist ? 'bg-red-500 border-red-500 text-white' : 'border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500'}`}>
              <Heart size={18} fill={isInWishlist ? 'white' : 'none'} />
            </button>
          </div>

          {/* Name */}
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-3">{product.name}</h1>

          {/* Rating row */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex">
              {Array(5).fill('').map((_, i) => (
                <StarIcon key={i} size={16} fill={avgRating >= i + 1 ? '#f59e0b' : '#e2e8f0'} strokeWidth={0} />
              ))}
            </div>
            <span className="text-sm text-slate-600 font-medium">{avgRating.toFixed(1)}</span>
            <span className="text-sm text-slate-400">({ratings.length} reviews)</span>
            <span className="text-slate-200">|</span>
            <div className="flex items-center gap-1">
              <Package size={13} className="text-slate-400" />
              <span className={`text-sm font-medium ${totalStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 mb-6 border border-green-100">
            <p className="text-4xl font-black text-slate-900">
              ₹{displayPrice > 0 ? displayPrice.toLocaleString('en-IN') : '—'}
            </p>
            {selectedVariant && variantStock > 0 && (
              <p className="text-xs text-green-600 font-medium mt-1">
                ✓ {variantStock} units available for this variant
              </p>
            )}
          </div>

          {/* Color */}
          {colors.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-bold text-slate-700 mb-2.5">
                Color: {selectedColor
                  ? <span className="text-green-600 font-semibold ml-1">{selectedColor}</span>
                  : <span className="text-amber-500 font-normal ml-1 text-xs">Choose a color</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button key={color}
                    onClick={() => { setSelectedColor(color); setSelectedSize(null); }}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      selectedColor === color
                        ? 'border-green-500 bg-green-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-green-300'
                    }`}>
                    {selectedColor === color && <Check size={12} className="inline mr-1.5" />}
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {sizesForColor.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-bold text-slate-700 mb-2.5">
                Size: {selectedSize
                  ? <span className="text-green-600 font-semibold ml-1">{selectedSize}</span>
                  : <span className="text-amber-500 font-normal ml-1 text-xs">Choose a size</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {sizesForColor.map((size) => {
                  const v = (product.variants || []).find((v) => v.color === selectedColor && v.size === size);
                  const oos = v?.stock === 0;
                  return (
                    <button key={size} onClick={() => !oos && setSelectedSize(size)} disabled={oos}
                      className={`min-w-[48px] px-3 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                        oos ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed line-through'
                            : selectedSize === size ? 'border-green-500 bg-green-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-green-300'
                      }`}>
                      {size}
                    </button>
                  );
                })}
              </div>
              {selectedVariant && (
                <p className="text-xs text-slate-400 mt-2 font-mono">SKU: {selectedVariant.sku}</p>
              )}
            </div>
          )}

          {/* Warning */}
          {(!selectedColor || !selectedSize) && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 mb-4">
              <AlertTriangle size={15} className="flex-shrink-0" />
              {!selectedColor ? 'Select a color to continue' : 'Select a size to continue'}
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <p className="text-sm font-bold text-slate-700 mb-2.5">Quantity</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity((p) => Math.max(1, p - 1))} disabled={!selectedVariant}
                  className="w-11 h-11 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-colors">
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center font-bold text-slate-800">{quantity}</span>
                <button onClick={() => { if (quantity >= variantStock) { toast.error(`Max ${variantStock}`); return; } setQuantity((p) => p + 1); }}
                  disabled={!selectedVariant || quantity >= variantStock}
                  className="w-11 h-11 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
              {selectedVariant && variantStock > 0 && (
                <span className="text-xs text-slate-400">max {variantStock}</span>
              )}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => isInCart ? router.push('/cart') : addToCartHandler()}
              disabled={!selectedVariant || variantStock === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isInCart
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-green-200'
              }`}>
              <ShoppingCartIcon size={18} />
              {!selectedVariant ? 'Select Variant' : variantStock === 0 ? 'Out of Stock' : isInCart ? '✓ View Cart' : 'Add to Cart'}
            </button>
            <button onClick={() => { if (navigator.share) navigator.share({ title: product.name, url: window.location.href }); }}
              className="p-4 rounded-2xl border-2 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 transition-all">
              <ShareIcon size={18} />
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { Icon: TruckIcon,       bg: 'bg-blue-50 border-blue-100',   ic: 'text-blue-500',   label: 'Free Delivery',  sub: 'Orders above ₹500' },
              { Icon: RefreshCw,       bg: 'bg-green-50 border-green-100', ic: 'text-green-500',  label: 'Easy Returns',   sub: '30-day policy' },
              { Icon: ShieldCheckIcon, bg: 'bg-purple-50 border-purple-100', ic: 'text-purple-500', label: 'Secure Payment', sub: 'Safe checkout' },
              { Icon: Zap,             bg: 'bg-amber-50 border-amber-100', ic: 'text-amber-500',  label: 'Fast Shipping',  sub: '2-3 business days' },
            ].map(({ Icon, bg, ic, label, sub }) => (
              <div key={label} className={`flex items-center gap-2.5 p-3 rounded-xl border ${bg}`}>
                <div className={`p-1.5 rounded-lg bg-white ${ic}`}><Icon size={14} /></div>
                <div><p className="text-xs font-semibold text-slate-700">{label}</p><p className="text-[10px] text-slate-400">{sub}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}