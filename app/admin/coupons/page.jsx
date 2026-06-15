// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\app\admin\coupons\page.jsx
'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Trash2, Ticket, Plus, Percent, Calendar, User,
  BadgePercent, UserPlus, X, AlertTriangle, ShieldAlert,
  Search, ClipboardCheck,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

function DeleteConfirmationModal({ isOpen, onClose, onDelete, couponCode, isDeleting }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <motion.div
              className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl sm:my-8 sm:w-full sm:max-w-lg"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-slate-900">Delete Coupon</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Are you sure you want to delete <span className="font-semibold text-green-600">{couponCode}</span>? This cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={onDelete}
                  className={`inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm ${isDeleting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isDeleting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deleting...
                    </span>
                  ) : 'Delete Coupon'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function AdminCoupons() {
  const [coupons,    setCoupons]    = useState([]);
  const [newCoupon,  setNewCoupon]  = useState({
    code: '', description: '', discount: '',
    forNewUser: false, forMember: false, isPublic: false,
    expiresAt: new Date(),
  });
  const [searchTerm,       setSearchTerm]       = useState('');
  const [loading,          setLoading]          = useState(true);
  const [isAddingCoupon,   setIsAddingCoupon]   = useState(false);
  const [isDeleteModalOpen,setIsDeleteModalOpen]= useState(false);
  const [couponToDelete,   setCouponToDelete]   = useState(null);
  const [isDeleting,       setIsDeleting]       = useState(false);

  const openDeleteModal  = (coupon) => { setCouponToDelete(coupon); setIsDeleteModalOpen(true); };
  const closeDeleteModal = () => { setIsDeleteModalOpen(false); setTimeout(() => setCouponToDelete(null), 300); };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res  = await fetch('/api/admin/coupon', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setCoupons(data.coupons);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    try {
      setIsAddingCoupon(true);
      const payload = {
        ...newCoupon,
        discount:  Number(newCoupon.discount),
        expiresAt: new Date(newCoupon.expiresAt),
      };
      const res  = await fetch('/api/admin/coupon', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add');
      toast.success(data.message);
      await fetchCoupons();
      setNewCoupon({
        code: '', description: '', discount: '',
        forNewUser: false, forMember: false, isPublic: false,
        expiresAt: new Date(),
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsAddingCoupon(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!couponToDelete || isDeleting) return;
    try {
      setIsDeleting(true);
      const res  = await fetch(`/api/admin/coupon?code=${couponToDelete.code}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      setCoupons((prev) => prev.filter((c) => c.code !== couponToDelete.code));
      toast.success('Coupon deleted successfully');
      closeDeleteModal();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChange = (e) => setNewCoupon({ ...newCoupon, [e.target.name]: e.target.value });

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const soonToExpire = coupons.filter((c) => {
    const diff = Math.ceil((new Date(c.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 7;
  });

  useEffect(() => { fetchCoupons(); }, []);

  return (
    <>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onDelete={handleDeleteCoupon}
        couponCode={couponToDelete?.code}
        isDeleting={isDeleting}
      />

      <div className="max-w-12xl mx-auto text-slate-500 mb-40 pt-4 md:p-6">
        <div className="flex flex-col gap-10">

          {/* Add Coupon Form */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:w-1/3">
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-green-500 p-2 rounded-md text-white"><Ticket size={20} /></span>
              <h2 className="text-xl md:text-2xl">Add <span className="text-slate-800 font-semibold">Coupon</span></h2>
            </div>

            <form onSubmit={handleAddCoupon} className="text-sm">
              <div className="flex gap-3 max-sm:flex-col">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <BadgePercent size={16} />
                  </div>
                  <input type="text" placeholder="Coupon Code"
                    className="w-full mt-2 p-2.5 pl-10 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400"
                    name="code" value={newCoupon.code} onChange={handleChange} required maxLength={15} />
                  <div className="absolute right-2 top-[58%] -translate-y-1/2 text-xs text-slate-400">{newCoupon.code.length}/15</div>
                </div>
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Percent size={16} />
                  </div>
                  <input type="number" placeholder="Discount (%)" min={1} max={100}
                    className="w-full mt-2 p-2.5 pl-10 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400"
                    name="discount" value={newCoupon.discount} onChange={handleChange} required />
                </div>
              </div>

              <div className="relative w-full mt-4">
                <textarea placeholder="Coupon Description"
                  className="w-full p-3.5 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 min-h-[100px]"
                  name="description" value={newCoupon.description} onChange={handleChange} required maxLength={200} />
                <div className="absolute right-2 bottom-2 text-xs text-slate-400">{newCoupon.description.length}/200</div>
              </div>

              <label className="block mt-4">
                <div className="flex items-center gap-2 mb-2 text-slate-700"><Calendar size={16} className="text-slate-500" /><p>Coupon Expiry Date</p></div>
                <input type="date"
                  className="w-full p-2.5 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-100"
                  name="expiresAt"
                  value={format(new Date(newCoupon.expiresAt), 'yyyy-MM-dd')}
                  onChange={handleChange}
                  min={format(new Date(), 'yyyy-MM-dd')} />
              </label>

              <div className="mt-6 space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                {[
                  { key: 'forNewUser', label: 'For New Users Only',  icon: UserPlus },
                  { key: 'forMember',  label: 'For Members Only',    icon: User },
                  { key: 'isPublic',   label: 'Publicly Visible',    icon: ShieldAlert },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer gap-3">
                      <input type="checkbox" className="sr-only peer"
                        checked={newCoupon[key]}
                        onChange={(e) => setNewCoupon({ ...newCoupon, [key]: e.target.checked })} />
                      <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                      <span className="dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                    </label>
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-slate-500" />
                      <p className="font-medium">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={isAddingCoupon}
                className="mt-6 p-3 w-full rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                {isAddingCoupon ? (
                  <><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Creating...</>
                ) : (
                  <><Plus size={18} /> Create Coupon</>
                )}
              </button>
            </form>
          </div>

          {/* Coupons List */}
          <div className="md:flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-green-500 p-2 rounded-md text-white"><Ticket size={20} /></span>
              <h2 className="text-xl md:text-2xl">Active <span className="text-slate-800 font-semibold">Coupons</span></h2>
            </div>

            <div className="relative mb-4">
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search coupons..."
                className="w-full p-2.5 pl-10 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100" />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200 shadow-sm bg-white">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                  <p className="mt-4 text-slate-500">Loading coupons...</p>
                </div>
              ) : filteredCoupons.length > 0 ? (
                <table className="min-w-full bg-white text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['Code', 'Description', 'Discount', 'Expires At', 'Settings', 'Action'].map((h) => (
                        <th key={h} className={`py-3 px-4 font-semibold text-slate-600 ${h === 'Action' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredCoupons.map((coupon) => {
                      const diffDays   = Math.ceil((new Date(coupon.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
                      const expiringSoon = diffDays >= 0 && diffDays <= 7;
                      return (
                        <motion.tr key={coupon.code} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className={`hover:bg-slate-50 transition-colors ${expiringSoon ? 'bg-amber-50/30' : ''}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-green-600 bg-green-50 px-2 py-1 rounded text-sm">{coupon.code}</span>
                              <button onClick={() => { navigator.clipboard.writeText(coupon.code); toast.success('Copied!'); }}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100" title="Copy">
                                <ClipboardCheck size={14} />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4"><div className="text-slate-700 max-w-[200px] truncate" title={coupon.description}>{coupon.description}</div></td>
                          <td className="py-3 px-4"><span className="bg-green-50 text-green-600 py-1 px-2 rounded-md font-medium">{coupon.discount}%</span></td>
                          <td className="py-3 px-4">
                            <div className={`flex items-center gap-1 ${expiringSoon ? 'text-amber-600' : 'text-slate-700'}`}>
                              <Calendar size={14} />
                              {format(new Date(coupon.expiresAt), 'MMM dd, yyyy')}
                              {expiringSoon && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded ml-1">
                                  {diffDays === 0 ? 'Today' : `${diffDays}d`}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${coupon.forNewUser ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{coupon.forNewUser ? 'New Users' : 'All Users'}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${coupon.forMember ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{coupon.forMember ? 'Members' : 'Anyone'}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${coupon.isPublic ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{coupon.isPublic ? 'Public' : 'Private'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button onClick={() => openDeleteModal(coupon)} disabled={isDeleting}
                              className="bg-red-50 text-red-500 p-2 rounded-full hover:bg-red-100 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <Ticket size={40} className="text-slate-300 mb-2" />
                  {searchTerm ? (
                    <>
                      <p className="text-slate-500 mb-1">No coupons match your search</p>
                      <button onClick={() => setSearchTerm('')} className="mt-4 px-4 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 text-sm font-medium">Clear Search</button>
                    </>
                  ) : (
                    <p className="text-slate-500">No coupons available</p>
                  )}
                </div>
              )}
            </div>

            {coupons.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm"><BadgePercent size={18} /><span>{coupons.length} Active Coupons</span></div>
                <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm"><Percent size={18} /><span>Max Discount: {Math.max(...coupons.map((c) => c.discount))}%</span></div>
                <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm"><Calendar size={18} /><span>{soonToExpire.length} Expiring Soon</span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}