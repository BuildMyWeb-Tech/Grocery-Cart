// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\components\OrderSummary.jsx
import {
  PlusIcon, SquarePenIcon, CheckCircleIcon, ClockIcon,
  ShieldCheckIcon, TrendingDown,
} from 'lucide-react';
import { useState } from 'react';
import AddressModal from './AddressModal';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Protect, useUser } from '@clerk/nextjs';
import { fetchCartThunk, clearCart } from '@/lib/features/cart/cartSlice';

const OrderSummary = ({ totalPrice, items, appliedCoupon = null, discount = 0 }) => {
  const dispatch  = useDispatch();
  const router    = useRouter();
  const { user }  = useUser();
  const currency  = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';

  const addressList = useSelector((state) => state.address?.list || []);

  const [paymentMethod,     setPaymentMethod]     = useState('COD');
  const [selectedAddress,   setSelectedAddress]   = useState(null);
  const [showAddressModal,  setShowAddressModal]  = useState(false);
  const [placing,           setPlacing]           = useState(false);

  const handlePlaceOrder = async () => {
    // ✅ Validation — single toast each, function returns immediately, no toast.promise to double-fire
    if (!user) {
      toast.error('Please login to place an order');
      return;
    }
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }
    if (!items || items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    const orderItems = items.map((item) => ({
      variantId: item.variantId,
      quantity:  item.quantity,
      price:     item.price,
      storeId:   item.storeId,
    }));

    const orderData = {
      addressId:     selectedAddress.id,
      items:         orderItems,
      paymentMethod,
    };

    if (appliedCoupon) orderData.couponCode = appliedCoupon.code;

    setPlacing(true);
    try {
      const res  = await fetch('/api/orders', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify(orderData),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to place order');
        return;
      }

      if (paymentMethod === 'STRIPE') {
        dispatch(clearCart());
        toast.success('Redirecting to payment...');
        window.location.href = data.session.url;
      } else {
        dispatch(clearCart());
        toast.success(data.message || 'Order placed!');
        router.push('/orders');
      }
    } catch (err) {
      toast.error(err.message || 'Network error — please try again');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="w-full max-w-lg lg:max-w-[340px] bg-white border border-slate-200 text-slate-500 text-sm rounded-xl shadow-sm overflow-hidden sticky top-4">
      {/* Header */}
      <div className="bg-slate-50 p-5 border-b border-slate-100">
        <h2 className="text-xl font-semibold text-slate-700">Order Summary</h2>
      </div>

      <div className="p-5">
        {/* Payment Method */}
        <div className="mb-6">
          <p className="text-slate-700 font-medium mb-3">Payment Method</p>
          <div className="flex flex-col gap-3">
            {[
              { id: 'COD',    label: 'Cash On Delivery', sub: 'Pay when you receive your items' },
              { id: 'STRIPE', label: 'Card Payment',     sub: 'Secure online payment via Stripe' },
            ].map(({ id, label, sub }) => (
              <label key={id} htmlFor={id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === id ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" id={id} name="payment"
                  onChange={() => setPaymentMethod(id)}
                  checked={paymentMethod === id}
                  className="accent-green-500 size-4" />
                <div>
                  <p className="font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Address Section */}
        <div className="my-6 py-4 border-y border-slate-200">
          <p className="text-slate-700 font-medium mb-3">Delivery Address</p>
          {selectedAddress ? (
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="bg-slate-200 text-slate-500 rounded-full p-1 mt-1">
                <CheckCircleIcon size={16} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-700">{selectedAddress.name}</p>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zip}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedAddress.phone}</p>
                <button onClick={() => setSelectedAddress(null)}
                  className="flex items-center gap-1 text-xs text-green-600 mt-2 hover:text-green-700">
                  <SquarePenIcon size={14} /> Change address
                </button>
              </div>
            </div>
          ) : (
            <div>
              {addressList.length > 0 && (
                <select
                  className="border border-slate-200 p-3 w-full my-3 outline-none rounded-lg focus:border-green-500"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value !== '') setSelectedAddress(addressList[Number(e.target.value)]);
                  }}
                >
                  <option value="">Select Delivery Address</option>
                  {addressList.map((address, index) => (
                    <option key={address.id} value={index}>
                      {address.name}, {address.city}, {address.state} {address.zip}
                    </option>
                  ))}
                </select>
              )}
              <button onClick={() => setShowAddressModal(true)}
                className="flex items-center gap-1 text-green-600 mt-1 hover:text-green-700 py-1">
                <PlusIcon size={18} /> Add New Address
              </button>
            </div>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="pb-4 border-b border-slate-200">
          <div className="flex justify-between mb-4">
            <div className="flex flex-col gap-2 text-slate-600">
              <p>Subtotal:</p>
              <p>Shipping:</p>
              {appliedCoupon && (
                <p className="text-green-600 font-medium flex items-center gap-1">
                  <TrendingDown size={14} /> Discount ({appliedCoupon.discount}%):
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 font-medium text-right">
              <p>₹{totalPrice.toLocaleString('en-IN')}</p>
              <p>
                <Protect plan="plus" fallback={<span className="text-slate-700">₹5</span>}>
                  <span className="text-green-600">Free</span>
                </Protect>
              </p>
              {appliedCoupon && <p className="text-green-600">- ₹{discount.toFixed(2)}</p>}
            </div>
          </div>

          {appliedCoupon && (
            <div className="w-full flex items-center gap-2 bg-green-50 border border-green-100 p-2.5 rounded-lg mt-2">
              <CheckCircleIcon size={14} className="text-green-600" />
              <p className="text-xs font-medium text-green-700">
                Coupon: <span className="font-semibold">{appliedCoupon.code}</span>
              </p>
            </div>
          )}
        </div>

        {/* Total & Place Order */}
        <div className="py-4">
          <div className="flex justify-between items-center mb-6">
            <p className="text-lg font-semibold text-slate-700">Total:</p>
            <p className="text-xl font-bold text-slate-800">
              <Protect plan="plus" fallback={`₹${(totalPrice + 5 - discount).toFixed(2)}`}>
                ₹{(totalPrice - discount).toFixed(2)}
              </Protect>
            </p>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-all font-medium shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {placing && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {placing ? 'Placing Order...' : 'Place Order'}
          </button>

          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <ShieldCheckIcon size={14} /> Secure Payment
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <ClockIcon size={14} /> 24/7 Support
            </div>
          </div>
        </div>
      </div>

      {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}
    </div>
  );
};

export default OrderSummary;