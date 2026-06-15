// app/store/settings/page.jsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { Home, Package, Save, Check, Info, Loader2, RefreshCw } from 'lucide-react';

export default function StoreSettingsPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    email: '',
    contact: '',
  });

  const getAuthHeader = useCallback(async () => {
    const empToken = typeof window !== 'undefined' ? localStorage.getItem('employeeToken') : null;
    if (empToken) return { Authorization: `Bearer ${empToken}` };
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  }, [getToken]);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const { data } = await axios.get('/api/store/settings', { headers });
      if (data.settings) {
        setForm({
          name:        data.settings.name || '',
          description: data.settings.description || '',
          address:     data.settings.address || '',
          email:       data.settings.email || '',
          contact:     data.settings.contact || '',
        });
      }
    } catch {
      toast.error('Could not load settings');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleChange = (key, value) => { setForm((p) => ({ ...p, [key]: value })); setSaved(false); };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.contact) {
      toast.error('Name, email and contact are required');
      return;
    }
    try {
      setSaving(true);
      const headers = await getAuthHeader();
      await axios.post('/api/store/settings', form, { headers });
      setSaved(true);
      toast.success('Settings saved!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400"><Loader2 size={20} className="animate-spin" /> Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
              <Home size={22} className="text-green-600" /> Store Settings
            </h1>
            <p className="text-slate-500 text-sm mt-1">Update your store's public information</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchSettings} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={handleSave} disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${saved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-green-800 text-white hover:bg-green-900'} ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><Home size={15} className="text-slate-600" /></div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Store Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">Shown to customers on your store page</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Store Name */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Store Name <span className="text-red-500 normal-case">*</span></label>
              <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="My Awesome Store"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 bg-slate-50" />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Description</label>
              <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} placeholder="Tell customers about your store..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 bg-slate-50 resize-none" />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Store Address</label>
              <textarea value={form.address} onChange={(e) => handleChange('address', e.target.value)} rows={2} placeholder="123 Main St, City, State"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 bg-slate-50 resize-none" />
            </div>

            {/* Email + Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Email <span className="text-red-500 normal-case">*</span></label>
                <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="store@example.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Contact <span className="text-red-500 normal-case">*</span></label>
                <input type="tel" value={form.contact} onChange={(e) => handleChange('contact', e.target.value)} placeholder="+91 98765 43210"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 bg-slate-50" />
              </div>
            </div>

            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3.5 text-sm text-blue-700">
              <Info size={14} className="flex-shrink-0 mt-0.5" />
              <span>To update your store logo, please contact support or re-create the store from the create-store page.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}