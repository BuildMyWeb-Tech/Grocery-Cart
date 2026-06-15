// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\app\(public)\create-store\page.jsx
'use client';
import { assets } from "@/assets/assets";
import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import Loading from "@/components/Loading";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import {
  Store, Upload, User, Mail, Phone, MapPin,
  FileText, CheckCircle, Clock, XCircle, ArrowRight,
} from "lucide-react";

export default function CreateStore() {
  const { user }    = useUser();
  const router      = useRouter();
  const { getToken } = useAuth();

  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [status,  setStatus]  = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [storeInfo, setStoreInfo] = useState({
    name: "", username: "", description: "",
    email: "", contact: "", address: "", image: "",
  });

  const onChangeHandler = (e) => {
    setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value });
  };

  const fetchSellerStatus = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/store/create', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // New schema uses uppercase: PENDING, ACTIVE, REJECTED
      const storeStatus = data.status;

      if (storeStatus === 'ACTIVE') {
        setStatus('ACTIVE');
        setAlreadySubmitted(true);
        setMessage("Your store has been approved! Redirecting to your dashboard...");
        setTimeout(() => router.push("/store"), 2000);

      } else if (storeStatus === 'REJECTED') {
        setStatus('REJECTED');
        setAlreadySubmitted(true);
        setMessage("Your store request has been rejected. Please contact admin for more details.");

      } else if (storeStatus === 'PENDING') {
        setStatus('PENDING');
        setAlreadySubmitted(true);
        setMessage("Your store request is under review. Please wait for admin approval.");

      } else if (storeStatus === 'INACTIVE') {
        setStatus('INACTIVE');
        setAlreadySubmitted(true);
        setMessage("Your store exists but is currently inactive. Contact admin to reactivate.");

      } else {
        // No store yet — show the form
        setAlreadySubmitted(false);
      }
    } catch (error) {
      // 404 or no store — show form
      setAlreadySubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to continue'); return; }
    if (!storeInfo.image) { toast.error('Please upload a store logo'); return; }

    try {
      setSubmitting(true);
      const token = await getToken();
      const formData = new FormData();
      formData.append("name",        storeInfo.name);
      formData.append("description", storeInfo.description);
      formData.append("username",    storeInfo.username);
      formData.append("email",       storeInfo.email);
      formData.append("contact",     storeInfo.contact);
      formData.append("address",     storeInfo.address);
      formData.append("image",       storeInfo.image);

      const { data } = await axios.post('/api/store/create', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(data.message);
      await fetchSellerStatus();
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (user) fetchSellerStatus();
    else setLoading(false);
  }, [user]);

  // Not logged in
  if (!user && !loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <Store size={36} className="text-slate-400" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-700 mb-2">Sign in to create a store</h1>
        <p className="text-slate-500 mb-8 max-w-sm">You need to be logged in to apply as a seller on KingCart.</p>
        <Link href="/sign-in" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          Sign In <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  if (loading) return <Loading />;

  // Already submitted — show status
  if (alreadySubmitted) {
    const statusConfig = {
      ACTIVE:   { icon: <CheckCircle size={40} className="text-green-500" />, bg: 'bg-green-50', border: 'border-green-200', color: 'text-green-700' },
      PENDING:  { icon: <Clock size={40} className="text-amber-500" />,       bg: 'bg-amber-50',  border: 'border-amber-200',  color: 'text-amber-700' },
      REJECTED: { icon: <XCircle size={40} className="text-red-500" />,       bg: 'bg-red-50',    border: 'border-red-200',    color: 'text-red-700' },
      INACTIVE: { icon: <Store size={40} className="text-slate-400" />,       bg: 'bg-slate-50',  border: 'border-slate-200',  color: 'text-slate-600' },
    };
    const cfg = statusConfig[status] || statusConfig.INACTIVE;

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
        <div className={`max-w-md w-full ${cfg.bg} border ${cfg.border} rounded-2xl p-8 text-center shadow-sm`}>
          <div className="flex justify-center mb-4">{cfg.icon}</div>
          <h2 className={`text-xl font-bold mb-3 ${cfg.color}`}>
            {status === 'ACTIVE'   && 'Store Approved!'}
            {status === 'PENDING'  && 'Request Pending'}
            {status === 'REJECTED' && 'Request Rejected'}
            {status === 'INACTIVE' && 'Store Inactive'}
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">{message}</p>

          {status === 'ACTIVE' && (
            <div className="mt-5">
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-green-600 mt-2">Redirecting to dashboard...</p>
            </div>
          )}

          {status === 'REJECTED' && (
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-900">
                Contact Admin
              </Link>
              <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
                ← Back to Home
              </Link>
            </div>
          )}

          {status === 'PENDING' && (
            <div className="mt-6">
              <p className="text-xs text-amber-600 bg-amber-100 rounded-lg px-3 py-2">
                We'll notify you once your store is reviewed. This usually takes 1-2 business days.
              </p>
              <Link href="/" className="mt-4 inline-block text-sm text-slate-500 hover:text-slate-700">
                ← Continue Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show the form
  return (
    <div className="min-h-[70vh] my-16 mx-6">
      <form
        onSubmit={onSubmitHandler}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-800">
            Start Selling on <span className="text-green-600">KingCart</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-lg">
            Fill in your store details below. Your application will be reviewed by our admin team within 1-2 business days.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-5">
          {/* Logo upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Store Logo <span className="text-red-500">*</span>
            </label>
            <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-green-400 hover:bg-green-50/30 transition-all">
              {storeInfo.image ? (
                <div className="relative">
                  <Image
                    src={URL.createObjectURL(storeInfo.image)}
                    alt="Logo preview"
                    width={80} height={80}
                    className="rounded-xl object-cover w-20 h-20 border border-slate-200 shadow-sm"
                  />
                  <p className="text-xs text-green-600 mt-2 text-center">Click to change</p>
                </div>
              ) : (
                <>
                  <Upload size={28} className="text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">Click to upload logo</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP</p>
                </>
              )}
              <input
                type="file" accept="image/*"
                onChange={(e) => setStoreInfo({ ...storeInfo, image: e.target.files[0] })}
                hidden
              />
            </label>
          </div>

          {/* Store name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Store Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Store size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                name="name" value={storeInfo.name} onChange={onChangeHandler}
                type="text" placeholder="My Awesome Store" required
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Store Username <span className="text-red-500">*</span>
              <span className="text-slate-400 font-normal ml-1 text-xs">(used in your store URL)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
              <input
                name="username" value={storeInfo.username} onChange={onChangeHandler}
                type="text" placeholder="myawesomestore" required
                className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Your store will be at: <span className="font-mono text-slate-600">/shop/{storeInfo.username || 'your-username'}</span>
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText size={15} className="absolute left-3 top-3 text-slate-400" />
              <textarea
                name="description" value={storeInfo.description} onChange={onChangeHandler}
                rows={4} placeholder="Tell customers what your store sells..." required
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 resize-none"
              />
            </div>
          </div>

          {/* Email + Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Store Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="email" value={storeInfo.email} onChange={onChangeHandler}
                  type="email" placeholder="store@example.com" required
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="contact" value={storeInfo.contact} onChange={onChangeHandler}
                  type="tel" placeholder="+91 98765 43210" required
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Store Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-3 text-slate-400" />
              <textarea
                name="address" value={storeInfo.address} onChange={onChangeHandler}
                rows={3} placeholder="123 Main Street, City, State" required
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting...</>
              ) : (
                <><Store size={17} /> Submit Store Application</>
              )}
            </button>
            <p className="text-xs text-slate-400 text-center mt-3">
              By submitting, you agree to our seller terms. Admin approval required before going live.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have a store?{' '}
          <Link href="/store/login" className="text-green-600 hover:underline font-medium">Login to Store Panel</Link>
        </p>
      </form>
    </div>
  );
}