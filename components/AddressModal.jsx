// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\components\AddressModal.jsx
'use client';
import { addAddress } from '@/lib/features/address/addressSlice';
import { XIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';

const AddressModal = ({ setShowAddressModal }) => {
  const dispatch = useDispatch();

  const [address, setAddress] = useState({
    name: '', email: '', street: '', city: '',
    state: '', zip: '', country: '', phone: '',
  });
  const [phoneError, setPhoneError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setAddress({ ...address, phone: digitsOnly });
      setPhoneError(digitsOnly.length > 0 && digitsOnly.length < 10 ? 'Phone number must be 10 digits' : '');
      return;
    }

    setAddress({ ...address, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (address.phone.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits');
      return;
    }

    setSubmitting(true);
    try {
      const res  = await fetch('/api/address', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify(address),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to save address');
      dispatch(addAddress(data.newAddress));
      toast.success(data.message);
      setShowAddressModal(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setShowAddressModal(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh]"
      >
        {/* ✅ Sticky header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 sm:px-8 sm:pt-8 flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-800">
            Add New <span className="text-green-600">Address</span>
          </h2>
          <button
            type="button"
            onClick={() => setShowAddressModal(false)}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 hover:bg-slate-100 rounded-full -mr-2"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* ✅ Scrollable form body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex flex-col gap-4 px-6 sm:px-8 py-4 overflow-y-auto flex-1 min-h-0">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name</label>
              <input name="name" onChange={handleAddressChange} value={address.name}
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all text-sm"
                type="text" placeholder="John Doe" required />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Email Address</label>
              <input name="email" onChange={handleAddressChange} value={address.email}
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all text-sm"
                type="email" placeholder="john@example.com" required />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Street Address</label>
              <input name="street" onChange={handleAddressChange} value={address.street}
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all text-sm"
                type="text" placeholder="123 Main Street" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">City</label>
                <input name="city" onChange={handleAddressChange} value={address.city}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all text-sm"
                  type="text" placeholder="City" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">State</label>
                <input name="state" onChange={handleAddressChange} value={address.state}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all text-sm"
                  type="text" placeholder="State" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">ZIP Code</label>
                <input name="zip" onChange={handleAddressChange} value={address.zip}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all text-sm"
                  type="text" placeholder="600001" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Country</label>
                <input name="country" onChange={handleAddressChange} value={address.country}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all text-sm"
                  type="text" placeholder="India" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone Number</label>
              <input name="phone" onChange={handleAddressChange} value={address.phone}
                className={`w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${
                  phoneError ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:ring-green-100 focus:border-green-400'
                }`}
                type="tel" inputMode="numeric" placeholder="9876543210" maxLength={10} required />
              {phoneError && <p className="text-xs text-red-500 mt-1.5">{phoneError}</p>}
              {/* <p className="text-xs text-slate-400 mt-1.5">{address.phone.length}/10 digits</p> */}
            </div>
          </div>

          {/* ✅ Sticky footer with Save button — always visible */}
          <div className="flex-shrink-0 px-6 sm:px-8 py-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting || !!phoneError || address.phone.length !== 10}
              className="w-full bg-slate-800 text-white text-sm font-medium py-3 rounded-xl hover:bg-slate-900 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressModal;