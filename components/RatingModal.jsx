// components/RatingModal.jsx
'use client';
import { Star, XIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { addRating } from '@/lib/features/rating/ratingSlice';

const RatingModal = ({ ratingModal, setRatingModal }) => {
  const dispatch = useDispatch();
  const [rating,     setRating]     = useState(0);
  const [review,     setReview]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5');
      return;
    }
    if (review.trim().length < 5) {
      toast.error('Please write a short review (min 5 characters)');
      return;
    }

    setSubmitting(true);
    try {
      const res  = await fetch('/api/rating', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: ratingModal.productId,
          orderId:   ratingModal.orderId,
          rating,
          review:    review.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to submit review');
        return; // ✅ stop here — modal stays open, button re-enables
      }

      if (data.rating) {
        dispatch(addRating(data.rating));
      }

      toast.success(data.message || 'Review submitted!');
      setRatingModal(null);
    } catch (err) {
      toast.error(err.message || 'Network error — please try again');
    } finally {
      setSubmitting(false); // ✅ ALWAYS resets, no permanent "Submitting..."
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 relative">
        <button
          onClick={() => setRatingModal(null)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          disabled={submitting}
        >
          <XIcon size={20} />
        </button>

        <h2 className="text-xl font-medium text-slate-600 mb-4">Rate Product</h2>

        {/* Star selector */}
        <div className="flex items-center justify-center mb-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`size-8 cursor-pointer transition-colors ${
                rating > i ? 'text-green-400 fill-current' : 'text-gray-300'
              } ${submitting ? 'pointer-events-none opacity-60' : ''}`}
              onClick={() => !submitting && setRating(i + 1)}
            />
          ))}
        </div>

        <textarea
          className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none disabled:bg-slate-50 disabled:text-slate-400"
          placeholder="Write your review (min 5 characters)"
          rows={4}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          disabled={submitting}
        />

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md transition font-medium disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? 'Submitting...' : 'Submit Rating'}
        </button>
      </div>
    </div>
  );
};

export default RatingModal;