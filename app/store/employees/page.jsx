// app/store/employees/page.jsx
'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Users, Plus, Pencil, Trash2, X, Check, Eye, EyeOff,
  Loader2, RefreshCw, UserCheck, UserX,
} from 'lucide-react';
import { PERMISSIONS } from '@/middlewares/authEmployee';

const ALL_PERMISSIONS = [
  { key: PERMISSIONS.ADD_PRODUCT,           label: 'Add Product',           desc: 'Create new products' },
  { key: PERMISSIONS.EDIT_PRODUCT,          label: 'Edit Product',          desc: 'Update product details' },
  { key: PERMISSIONS.DELETE_PRODUCT,        label: 'Delete Product',        desc: 'Remove products' },
  { key: PERMISSIONS.MANAGE_INVENTORY,      label: 'Manage Inventory',      desc: 'Update stock levels' },
  { key: PERMISSIONS.VIEW_ORDERS,           label: 'View Orders',           desc: 'See all store orders' },
  { key: PERMISSIONS.UPDATE_ORDER_STATUS,   label: 'Update Order Status',   desc: 'Change order status' },
  { key: PERMISSIONS.MANAGE_CATEGORIES,     label: 'Manage Categories',     desc: 'Create and edit categories' },
  { key: PERMISSIONS.VIEW_REPORTS,          label: 'View Reports',          desc: 'Access sales analytics' },
  { key: PERMISSIONS.MANAGE_STORE_SETTINGS, label: 'Manage Store Settings', desc: 'Update store information' },
];

const DEFAULT_PERMS = Object.fromEntries(Object.values(PERMISSIONS).map((k) => [k, false]));

function PermissionBadge({ permissions }) {
  const granted = Object.entries(permissions || {}).filter(([, v]) => v).map(([k]) => k);
  if (!granted.length) return <span className="text-xs text-slate-400">No permissions</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {granted.slice(0, 3).map((p) => (
        <span key={p} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
          {p.replace(/_/g, ' ').toLowerCase()}
        </span>
      ))}
      {granted.length > 3 && (
        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">+{granted.length - 3} more</span>
      )}
    </div>
  );
}

export default function EmployeesPage() {
  const [employees,       setEmployees]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [modalOpen,       setModalOpen]       = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteId,        setDeleteId]        = useState(null);
  const [showPassword,    setShowPassword]    = useState(false);
  const [saving,          setSaving]          = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    permissions: { ...DEFAULT_PERMS },
  });

  // ✅ All API calls use credentials:include — no Bearer token needed
  const apiFetch = (url, options = {}) =>
    fetch(url, { credentials: 'include', ...options });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res  = await apiFetch('/api/employee/list');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setEmployees(data.employees || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const openCreate = () => {
    setEditingEmployee(null);
    setForm({ name: '', email: '', password: '', permissions: { ...DEFAULT_PERMS } });
    setShowPassword(false);
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setEditingEmployee(emp);
    setForm({ name: emp.name, email: emp.email, password: '', permissions: { ...DEFAULT_PERMS, ...(emp.permissions || {}) } });
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email)               { toast.error('Name and email are required'); return; }
    if (!editingEmployee && !form.password)       { toast.error('Password is required'); return; }
    if (form.password && form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }

    try {
      setSaving(true);

      if (editingEmployee) {
        const payload = { id: editingEmployee.id, name: form.name, email: form.email, permissions: form.permissions };
        if (form.password) payload.password = form.password;
        const res  = await apiFetch('/api/employee/update', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update');
        setEmployees((p) => p.map((e) => (e.id === editingEmployee.id ? data.employee : e)));
        toast.success('Employee updated');
      } else {
        const res  = await apiFetch('/api/employee/create', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password, permissions: form.permissions }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create');
        setEmployees((p) => [data.employee, ...p]);
        toast.success('Employee created successfully');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (emp) => {
    try {
      const res  = await apiFetch('/api/employee/update', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emp.id, isActive: !emp.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setEmployees((p) => p.map((e) => (e.id === emp.id ? data.employee : e)));
      toast.success(data.employee.isActive ? 'Employee activated' : 'Employee deactivated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await apiFetch(`/api/employee/delete?id=${deleteId}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      setEmployees((p) => p.filter((e) => e.id !== deleteId));
      toast.success('Employee deleted');
      setDeleteId(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const togglePerm = (key) =>
    setForm((p) => ({ ...p, permissions: { ...p.permissions, [key]: !p.permissions[key] } }));

  return (
    <div className="pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users size={22} className="text-green-600" /> Employee Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage staff access and permissions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchEmployees} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
          <Loader2 size={20} className="animate-spin" /> Loading...
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
          <Users size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No employees yet</p>
          <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700">
            <Plus size={16} /> Add First Employee
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Employee', 'Permissions', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{emp.name}</p>
                      <p className="text-xs text-slate-400">{emp.email}</p>
                    </td>
                    <td className="px-5 py-4 max-w-[220px]">
                      <PermissionBadge permissions={emp.permissions} />
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleToggleActive(emp)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${emp.isActive ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>
                        {emp.isActive ? <><UserCheck size={11} /> Active</> : <><UserX size={11} /> Inactive</>}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {new Date(emp.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(emp)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(emp.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 border border-red-200" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ravi Kumar"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ravi@store.com"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password {editingEmployee && <span className="text-slate-400 font-normal text-xs">(leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters"
                    className="w-full px-3.5 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-100" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Permissions</label>
                <div className="grid grid-cols-1 gap-2">
                  {ALL_PERMISSIONS.map((perm) => (
                    <div key={perm.key} onClick={() => togglePerm(perm.key)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all ${form.permissions[perm.key] ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${form.permissions[perm.key] ? 'bg-green-600 border-green-600' : 'border-slate-300 bg-white'}`}>
                        {form.permissions[perm.key] && <Check size={12} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">{perm.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{perm.desc}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${form.permissions[perm.key] ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                        {form.permissions[perm.key] ? 'Allowed' : 'Denied'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-60 flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {editingEmployee ? 'Save Changes' : 'Create Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Delete Employee?</h3>
            <p className="text-slate-500 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteId(null)} className="px-5 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}