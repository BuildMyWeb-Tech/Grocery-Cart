'use client';

import {
  ArrowRight,
  Star,
  MessageCircle,
  Send,
  ChevronRight,
  ThumbsUp,
  AlertCircle,
  CheckCircle,
  Award,
  StarIcon,
  Users,
  Loader2,
} from 'lucide-react';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import axios from 'axios';

const ProductDescription = ({ product }) => {
  const { isSignedIn, user } = useUser();

  // Only 2 tabs — Shipping removed
  const TABS = ['Description', 'Reviews'];
  const [selectedTab, setSelectedTab] = useState('Description');

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewInput, setReviewInput] = useState({ rating: 5, review: '' });
  const [submitting, setSubmitting] = useState(false);

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((a, b) => a + b.rating, 0) / totalReviews).toFixed(1)
      : '0.0';

  // ── Fetch all ratings for this product ─────────────────────────
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const { data } = await axios.get(`/api/rating?productId=${product.id}`);
        setReviews(data.ratings || []);
      } catch {
        // Fallback: use ratings already embedded on the product object
        setReviews(product.rating || []);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [product.id]);

  // ── Submit review ───────────────────────────────────────────────
  // Your Rating schema: userId, productId, rating, review, orderId (optional)
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!isSignedIn) {
      toast.error('Please sign in to submit a review');
      return;
    }
    if (reviewInput.review.trim().length < 10) {
      toast.error('Review must be at least 10 characters');
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await axios.post('/api/rating', {
        productId: product.id,
        rating: reviewInput.rating,
        review: reviewInput.review,
        // orderId omitted → backend handles as "direct product review"
      });

      // Attach Clerk user info for immediate display
      // (Rating schema only stores userId, not name/image)
      const newReview = {
        ...data.rating,
        _clerkUser: {
          name: user.fullName || user.username || 'User',
          image: user.imageUrl || null,
        },
      };
      setReviews((prev) => [newReview, ...prev]);
      setReviewInput({ rating: 5, review: '' });
      toast.success('Review submitted successfully!');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reviewer display info ───────────────────────────────────────
  // Rating model stores userId (not user object), so:
  // - Newly submitted reviews have _clerkUser attached
  // - Older reviews show "Verified Buyer" with initial avatar
  const getReviewerInfo = (r) => {
    if (r._clerkUser) return r._clerkUser;
    if (r.user) return r.user;
    return { name: 'Verified Buyer', image: null };
  };

  return (
    <div className="my-16 text-sm text-slate-600">
      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 mb-6 bg-white rounded-t-xl shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-6 py-4 font-medium whitespace-nowrap transition-all duration-200 ${
              selectedTab === tab
                ? 'border-b-2 border-green-600 text-green-700 bg-green-50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              {tab === 'Description' && (
                <CheckCircle
                  size={16}
                  className={selectedTab === tab ? 'text-green-600' : 'text-slate-400'}
                />
              )}
              {tab === 'Reviews' && (
                <Star
                  size={16}
                  className={selectedTab === tab ? 'text-green-600' : 'text-slate-400'}
                />
              )}
              {tab}
              {tab === 'Reviews' && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                    selectedTab === tab
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {totalReviews}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* ── DESCRIPTION TAB ─────────────────────────────────────── */}
      {selectedTab === 'Description' && (
        <div className="bg-white p-6 md:p-8 rounded-b-xl rounded-tr-xl shadow-sm max-w-4xl">
          {/* Full description */}
          <div className="mb-8">
            <h3 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
              <Award size={18} className="text-green-600" />
              Product Description
            </h3>
            {product.description ? (
              <div className="leading-relaxed space-y-4">
                {product.description.split('\n\n').map((para, i) => (
                  <p key={i} className="text-slate-600">
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No description available.</p>
            )}
          </div>

          {/* Key Features — String[] from DB */}
          <div className="border-t border-slate-100 pt-6">
            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-blue-600" />
              Key Features
            </h4>
            <div className="bg-slate-50 p-5 rounded-lg">
              {Array.isArray(product.keyFeatures) && product.keyFeatures.length > 0 ? (
                <ul className="space-y-3">
                  {product.keyFeatures.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="bg-blue-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                        <ChevronRight size={12} className="text-blue-600" />
                      </div>
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 italic text-sm">No key features specified.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REVIEWS TAB ─────────────────────────────────────────── */}
      {selectedTab === 'Reviews' && (
        <div className="bg-white p-6 md:p-8 rounded-b-xl rounded-tr-xl shadow-sm max-w-4xl">
          <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-slate-100">
            {/* Rating overview */}
            <div className="md:w-1/3 flex flex-col items-center p-6 bg-gradient-to-b from-slate-50 to-white rounded-xl border border-slate-200">
              <div className="text-5xl font-bold text-slate-800">
                {averageRating}
                <span className="text-lg text-slate-400 ml-1">/5</span>
              </div>
              <div className="flex mt-3 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={20}
                    fill={Number(averageRating) >= i ? '#FBBF24' : '#E5E7EB'}
                    strokeWidth={0}
                  />
                ))}
              </div>
              <p className="text-sm text-slate-500 mb-4">Based on {totalReviews} reviews</p>

              {/* Distribution bars */}
              <div className="w-full space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter((r) => r.rating === star).length;
                  const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs w-2 text-slate-500">{star}</span>
                      <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            star >= 4 ? 'bg-green-500' : star === 3 ? 'bg-amber-500' : 'bg-red-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-7">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Write Review */}
            <div className="md:w-2/3">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MessageCircle size={16} className="text-blue-600" />
                Write a Review
              </h3>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Star picker */}
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-600 mr-1">Your rating:</p>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={28}
                      className="cursor-pointer transition-transform hover:scale-110"
                      fill={reviewInput.rating >= i ? '#FBBF24' : '#E5E7EB'}
                      strokeWidth={0}
                      onClick={() => setReviewInput({ ...reviewInput, rating: i })}
                    />
                  ))}
                  <span className="text-xs text-slate-400">({reviewInput.rating}/5)</span>
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-1.5 block">Your review</label>
                  <textarea
                    rows={4}
                    placeholder="Share your experience with this product..."
                    value={reviewInput.review}
                    onChange={(e) => setReviewInput({ ...reviewInput, review: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all resize-none bg-slate-50"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {reviewInput.review.length < 10
                      ? `${10 - reviewInput.review.length} more characters needed`
                      : '✓ Ready to submit'}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Submit Review
                      </>
                    )}
                  </button>
                  {!isSignedIn && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg flex items-center gap-1.5">
                      <AlertCircle size={13} />
                      Sign in to submit a review
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Review list */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              Customer Reviews ({totalReviews})
            </h3>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                <Loader2 size={18} className="animate-spin" />
                Loading reviews...
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((r, i) => {
                const reviewer = getReviewerInfo(r);
                return (
                  <div
                    key={r.id || i}
                    className="border border-slate-200 p-5 rounded-xl hover:shadow-sm transition-all"
                  >
                    <div className="flex gap-4">
                      {reviewer.image ? (
                        <Image
                          src={reviewer.image}
                          width={44}
                          height={44}
                          className="rounded-full border border-slate-200 object-cover w-11 h-11 flex-shrink-0"
                          alt={reviewer.name}
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-slate-200 flex items-center justify-center text-slate-600 font-semibold text-base flex-shrink-0">
                          {reviewer.name[0]?.toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap justify-between gap-2 mb-2">
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{reviewer.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    size={13}
                                    fill={r.rating >= s ? '#FBBF24' : '#E5E7EB'}
                                    strokeWidth={0}
                                  />
                                ))}
                              </div>
                              {r.createdAt && (
                                <span className="text-xs text-slate-400">
                                  {new Date(r.createdAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                          <button className="text-slate-400 hover:text-green-600 transition-colors flex items-center gap-1 text-xs self-start">
                            <ThumbsUp size={13} />
                            Helpful
                          </button>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">{r.review}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center bg-slate-50 rounded-xl p-10 text-center">
                <MessageCircle size={40} className="text-slate-300 mb-3" />
                <p className="text-slate-600 mb-1 font-medium">No reviews yet</p>
                <p className="text-slate-400 text-xs">Be the first to review this product!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Store card ───────────────────────────────────────────── */}
      {product.store && (
        <div className="flex flex-col sm:flex-row gap-4 mt-14 bg-gradient-to-r from-slate-50 to-white p-6 rounded-xl shadow-sm border border-slate-100">
          <Image
            src={product.store.logo}
            alt={product.store.name}
            className="size-16 sm:size-20 rounded-full ring-4 ring-white shadow-md object-cover mx-auto sm:mx-0"
            width={100}
            height={100}
          />
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-bold text-lg text-slate-800">Product by {product.store.name}</h3>
            <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <StarIcon key={i} size={15} fill="#FBBF24" strokeWidth={0} />
                ))}
              </div>
              <span className="text-sm text-slate-600">98% Positive Ratings</span>
            </div>
            <p className="text-sm text-slate-600 my-2">
              Official Store • {product.store.productsCount || '100+'} Products
            </p>
            <Link
              href={`/shop/${product.store.username}`}
              className="inline-flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors group font-medium text-sm"
            >
              Visit Store
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDescription;
