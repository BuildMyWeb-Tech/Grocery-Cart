// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\components\ProductCard.jsx
'use client';
import { StarIcon, ShoppingCart, Heart, Eye } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '@/lib/features/wishlist/wishlistSlice';
import { addToCart } from '@/lib/features/cart/cartSlice';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const ProductCard = ({ product, badgeText, badgeIcon }) => {
  const dispatch = useDispatch();
  const { push }  = useRouter();

  const [imageLoaded,      setImageLoaded]      = useState(false);
  const [isHovering,       setIsHovering]       = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const wishlistItems = useSelector((state) => state.wishlist.items || []);
  const isInWishlist  = wishlistItems.some((item) => (item.id || item.productId) === product.id);

  const variants      = product.variants || [];
  const variantPrices = variants.map((v) => Number(v.price) || 0).filter((p) => p > 0);
  const minPrice      = variantPrices.length ? Math.min(...variantPrices) : 0;
  const maxPrice      = variantPrices.length ? Math.max(...variantPrices) : 0;
  const totalStock    = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  const isInStock     = product.status === 'ACTIVE' && totalStock > 0;

  // ✅ Default variant for quick "Add to Cart" — first in-stock variant, or first variant
  const defaultVariant = variants.find((v) => (v.stock ?? 0) > 0) || variants[0] || null;

  const categoryNames = (product.categories || [])
    .map((c) => c?.category?.name || c?.name)
    .filter(Boolean);
  const categoryDisplay = categoryNames[0]
    || (Array.isArray(product.category) ? product.category[0] : product.category)
    || '';

  const ratings   = product.ratings || [];
  const avgRating = ratings.length
    ? ratings.reduce((s, r) => s + (Number(r.rating) || 0), 0) / ratings.length
    : 0;
  const ratingCount = product.ratingCount ?? ratings.length;

  useEffect(() => {
    if (isHovering && product.images?.length > 1) {
      const t = setInterval(() => setActiveImageIndex((p) => (p + 1) % product.images.length), 1800);
      return () => clearInterval(t);
    } else {
      setActiveImageIndex(0);
    }
  }, [isHovering, product.images?.length]);

  const toggleWishlist = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (isInWishlist) {
      dispatch(removeFromWishlist(product.id));
      toast('Removed from wishlist', { icon: '💔' });
    } else {
      dispatch(addToWishlist({ id: product.id, name: product.name, price: minPrice, image: product.images?.[0], category: categoryDisplay }));
      toast.success('Added to wishlist', { icon: '❤️' });
    }
  };

  // ✅ Add to Cart — uses default variant
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isInStock || !defaultVariant) {
      toast.error('This product is currently unavailable');
      return;
    }

    if ((defaultVariant.stock ?? 0) <= 0) {
      toast.error('Selected option is out of stock');
      return;
    }

    dispatch(addToCart({
      variantId:    defaultVariant.id,
      productId:    product.id,
      storeId:      product.storeId || product.store?.id,
      price:        Number(defaultVariant.price) || 0,
      color:        defaultVariant.color,
      size:         defaultVariant.size,
      productName:  product.name,
      productImage: product.images?.[0] || null,
      storeName:    product.store?.name || '',
      quantity:     1,
    }));

    toast.success('Added to cart', { icon: '🛒' });
  };

  return (
    <div
      className="group relative w-full cursor-pointer"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={() => push(`/product/${product.id}`)}
    >
      <div className="rounded-2xl overflow-hidden bg-white border border-slate-100 hover:border-green-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full">

        {/* Image area */}
        <div className="relative h-40 sm:h-52 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
          {!imageLoaded && <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-200 animate-pulse" />}

          {(product.images || []).map((img, i) => (
            <Image key={i} src={img} alt={product.name} fill
              className={`object-contain p-3 sm:p-4 transition-all duration-500 ${i === activeImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              onLoad={() => { if (i === 0) setImageLoaded(true); }} />
          ))}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />

          <button
            onClick={toggleWishlist}
            className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-20 p-1.5 sm:p-2 rounded-full shadow-md transition-all duration-200 ${isInWishlist ? 'bg-red-500 text-white scale-110' : 'bg-white/90 text-slate-400 hover:text-red-500 hover:bg-white'}`}
          >
            <Heart size={14} className="sm:size-4" fill={isInWishlist ? 'white' : 'none'} />
          </button>

          {badgeText && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1 shadow">
              {badgeIcon} {badgeText}
            </div>
          )}

          {categoryDisplay && (
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-20 bg-white/90 backdrop-blur-sm text-[9px] sm:text-[10px] text-slate-600 font-medium px-1.5 sm:px-2 py-0.5 rounded-full border border-slate-200/60">
              {categoryDisplay}
            </div>
          )}

          {!isInStock && (
            <div className="absolute inset-0 bg-white/75 flex items-center justify-center z-10">
              <span className="text-xs font-semibold bg-slate-800 text-white px-3 py-1.5 rounded-full">Out of Stock</span>
            </div>
          )}

          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 hidden sm:block">
            <div className="bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-medium px-2.5 py-1.5 rounded-full border border-slate-200 flex items-center gap-1 shadow-sm">
              <Eye size={11} /> Quick View
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-2.5 sm:p-4 flex flex-col flex-1">
          {product.brand && (
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5 sm:mb-1">{product.brand}</p>
          )}

          <h3 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 leading-snug mb-1.5 sm:mb-2 group-hover:text-green-700 transition-colors min-h-[2rem] sm:min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 sm:gap-1.5 mb-2 sm:mb-3">
            <div className="flex">
              {Array(5).fill('').map((_, i) => (
                <StarIcon key={i} size={11} className="sm:size-3" fill={avgRating >= i + 1 ? '#f59e0b' : '#e2e8f0'} strokeWidth={0} />
              ))}
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-500">{avgRating.toFixed(1)} ({ratingCount})</span>
          </div>

          <div className="flex-1" />

          {/* Price row */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div>
              <p className="text-sm sm:text-lg font-bold text-slate-900">
                {variantPrices.length === 0
                  ? '—'
                  : minPrice === maxPrice
                    ? `₹${minPrice.toLocaleString('en-IN')}`
                    : `₹${minPrice.toLocaleString('en-IN')} – ₹${maxPrice.toLocaleString('en-IN')}`}
              </p>
            </div>
            {isInStock ? (
              <span className="text-[9px] sm:text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full">
                {totalStock} left
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] text-red-500 font-semibold bg-red-50 px-1.5 sm:px-2 py-0.5 rounded-full">Sold Out</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); push(`/product/${product.id}`); }}
              className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
            >
              <Eye size={13} className="sm:size-3.5" /> Details
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!isInStock}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition-all ${
                isInStock
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-200'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              <ShoppingCart size={13} className="sm:size-3.5" />
              {isInStock ? 'Add to Cart' : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;