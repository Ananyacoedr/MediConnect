import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import {
  HeartPulse, Package, ShoppingBag, Plus, Pencil, Trash2,
  Loader2, X, AlertTriangle, UserPlus, Stethoscope, UploadCloud, Sparkles
} from 'lucide-react'

const TABS = ['products', 'orders', 'doctors']
const CATEGORIES = ['medicines', 'supplements', 'vitamins', 'personal-care', 'health-devices']
const SPECIALTIES = [
  'General Medicine', 'Cardiology', 'Neurology', 'Dermatology', 'Orthopedics',
  'Pediatrics', 'Psychiatry', 'Gynecology', 'Endocrinology', 'Ophthalmology',
  'ENT Specialist', 'Gastroenterology', 'Pulmonology', 'Urology', 'Dentistry', 'Oncology',
]

const emptyForm = { name: '', brand: '', category: 'medicines', price: '', discountPercent: 0, stock: 0, description: '', usage: '', ingredients: '', warnings: '', sideEffects: '', requiresPrescription: false, tags: '', images: [] }

const emptyDoctorForm = {
  firstName: '', lastName: '', title: 'Dr.', designation: '', specialty: 'General Medicine',
  experience: '', location: '', phone: '', email: '', bio: '', profileImage: '',
}

const ImageUpload = ({ value, onChange, label = 'Upload Image' }) => {
  const { getToken } = useAuth()
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiFetch('/upload', getToken, { method: 'POST', body: formData })
      onChange(res.url)
    } catch (err) {
      alert(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
      <div className="flex items-center gap-3">
        {value && <img src={value} alt="Preview" className="h-10 w-10 rounded object-cover border" />}
        <label className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 flex-1 transition-colors">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
          {uploading ? 'Uploading to Cloudinary...' : 'Upload Image'}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
        {value && <button type="button" onClick={() => onChange('')} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={14} /></button>}
      </div>
    </div>
  )
}

const AdminPanel = () => {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [fetchingImage, setFetchingImage] = useState(false)

  // ── Doctors state ──
  const [doctors, setDoctors] = useState([])
  const [showDoctorForm, setShowDoctorForm] = useState(false)
  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm)
  const [editDoctorId, setEditDoctorId] = useState(null)
  const [savingDoctor, setSavingDoctor] = useState(false)
  const [doctorError, setDoctorError] = useState(null)

  useEffect(() => {
    if (tab === 'products') {
      setLoading(true)
      apiFetch('/products', null).then(setProducts).finally(() => setLoading(false))
    } else if (tab === 'orders') {
      setLoading(true)
      apiFetch('/orders/all', getToken).then(setOrders).finally(() => setLoading(false))
    } else if (tab === 'doctors') {
      setLoading(true)
      apiFetch('/doctors/list', null).then(setDoctors).finally(() => setLoading(false))
    }
  }, [tab])

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true); setError(null) }
  const openEdit = (p) => {
    setForm({ ...p, tags: p.tags?.join(', ') || '' })
    setEditId(p._id); setShowForm(true); setError(null)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const body = { ...form, price: Number(form.price), discountPercent: Number(form.discountPercent), stock: Number(form.stock), tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }
      if (editId) {
        const updated = await apiFetch(`/products/${editId}`, getToken, { method: 'PATCH', body: JSON.stringify(body) })
        setProducts(prev => prev.map(p => p._id === editId ? updated : p))
      } else {
        const created = await apiFetch('/products', getToken, { method: 'POST', body: JSON.stringify(body) })
        setProducts(prev => [created, ...prev])
      }
      setShowForm(false)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleFetchImage = async () => {
    if (!form.name) return setError('Please enter a Product Name first.')
    setFetchingImage(true)
    setError(null)
    try {
      const res = await apiFetch(`/ai/image?query=${encodeURIComponent(form.name)}`, getToken)
      if (res.url) {
        setForm(f => ({ ...f, images: [res.url] }))
      }
    } catch (err) {
      setError(`Auto-Fetch failed: ${err.message}`)
    } finally {
      setFetchingImage(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    await apiFetch(`/products/${id}`, getToken, { method: 'DELETE' })
    setProducts(prev => prev.filter(p => p._id !== id))
  }

  const handleOrderStatus = async (orderId, status) => {
    const updated = await apiFetch(`/orders/${orderId}/status`, getToken, { method: 'PATCH', body: JSON.stringify({ status }) })
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: updated.status } : o))
  }

  const handleRxStatus = async (orderId, prescriptionStatus) => {
    const updated = await apiFetch(`/orders/${orderId}/prescription`, getToken, { method: 'PATCH', body: JSON.stringify({ prescriptionStatus }) })
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, prescriptionStatus: updated.prescriptionStatus } : o))
  }

  // ── Doctor handlers ──
  const openAddDoctor = () => { setDoctorForm(emptyDoctorForm); setEditDoctorId(null); setShowDoctorForm(true); setDoctorError(null) }
  const openEditDoctor = (d) => {
    setDoctorForm({ firstName: d.firstName, lastName: d.lastName, title: d.title || 'Dr.', designation: d.designation || '', specialty: d.specialty || 'General Medicine', experience: d.experience || '', location: d.location || '', phone: d.phone || '', email: d.email || '', bio: d.bio || '', profileImage: d.profileImage || '' })
    setEditDoctorId(d._id); setShowDoctorForm(true); setDoctorError(null)
  }

  const handleSaveDoctor = async (e) => {
    e.preventDefault()
    setSavingDoctor(true); setDoctorError(null)
    try {
      const body = { ...doctorForm, experience: Number(doctorForm.experience) }
      if (editDoctorId) {
        const updated = await apiFetch(`/doctors/admin/${editDoctorId}`, getToken, { method: 'PATCH', body: JSON.stringify(body) })
        setDoctors(prev => prev.map(d => d._id === editDoctorId ? updated : d))
      } else {
        const clerkId = `doctor_admin_${Date.now()}`
        const created = await apiFetch('/doctors/admin', getToken, { method: 'POST', body: JSON.stringify({ ...body, clerkId }) })
        setDoctors(prev => [created, ...prev])
      }
      setShowDoctorForm(false)
    } catch (err) { setDoctorError(err.message) }
    finally { setSavingDoctor(false) }
  }

  const handleDeleteDoctor = async (id) => {
    if (!confirm('Delete this doctor?')) return
    await apiFetch(`/doctors/admin/${id}`, getToken, { method: 'DELETE' })
    setDoctors(prev => prev.filter(d => d._id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-blue-600 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg cursor-pointer" onClick={() => navigate('/pharmacy')}>
            <HeartPulse size={20} /> MediConnect Admin
          </div>
          <button onClick={() => navigate('/patient-dashboard')} className="text-sm hover:text-blue-200">← Dashboard</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-400'}`}>
              {t === 'products' ? <Package size={15} /> : t === 'orders' ? <ShoppingBag size={15} /> : <Stethoscope size={15} />} {t}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {tab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{products.length} products</p>
              <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
                <Plus size={15} /> Add Product
              </button>
            </div>

            {loading ? <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 py-10 justify-center"><Loader2 size={20} className="animate-spin" /></div> : (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-950 border-b dark:border-gray-800 border-gray-200 dark:border-gray-800">
                    <tr>
                      {['Image', 'Name', 'Category', 'Price', 'Stock', 'Rx', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map(p => (
                      <tr key={p._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {p.images?.[0] ? 
                            <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-gray-800" /> : 
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-800"><Package size={16} className="text-gray-400" /></div>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{p.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{p.brand}</p>
                        </td>
                        <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-400">{p.category}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">₹{+(p.price * (1 - p.discountPercent / 100)).toFixed(2)}</p>
                          {p.discountPercent > 0 && <p className="text-xs text-green-600 dark:text-green-400">{p.discountPercent}% off</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${p.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{p.stock}</span>
                        </td>
                        <td className="px-4 py-3">
                          {p.requiresPrescription ? <span className="text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">Yes</span> : <span className="text-xs text-gray-400 dark:text-gray-500">No</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(p._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div className="space-y-3">
            {loading ? <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 py-10 justify-center"><Loader2 size={20} className="animate-spin" /></div> : (
              orders.map(order => (
                <div key={order._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Order #{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{order.patient?.firstName} {order.patient?.lastName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{order.patient?.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {order.prescriptionStatus !== 'not-required' && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Rx:</span>
                          <select value={order.prescriptionStatus} onChange={e => handleRxStatus(order._id, e.target.value)}
                            className="text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400">
                            {['pending', 'approved', 'rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                      <select value={order.status} onChange={e => handleOrderStatus(order._id, e.target.value)}
                        className="text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400">
                        {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                    {order.items.map((item, i) => (
                      <p key={i}>{item.name} × {item.quantity} — ₹{item.price}</p>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 border-t pt-2">
                    <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">Total: ₹{order.totalAmount}</span>
                  </div>
                  {order.prescriptionUrl && (
                    <a href={order.prescriptionUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                      <AlertTriangle size={11} /> View Prescription
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

        {/* Doctors Tab */}
        {tab === 'doctors' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{doctors.length} doctors</p>
              <button onClick={openAddDoctor} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
                <UserPlus size={15} /> Add Doctor
              </button>
            </div>
            {loading ? <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 py-10 justify-center"><Loader2 size={20} className="animate-spin" /></div> : (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-950 border-b dark:border-gray-800 border-gray-200 dark:border-gray-800">
                    <tr>
                      {['Doctor', 'Specialty', 'Experience', 'Location', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {doctors.map(d => (
                      <tr key={d._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {d.profileImage
                              ? <img src={d.profileImage} className="w-8 h-8 rounded-full object-cover border" alt="doc" />
                              : <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">{d.firstName?.[0]}{d.lastName?.[0]}</div>
                            }
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{d.title} {d.firstName} {d.lastName}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">{d.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{d.specialty || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{d.experience ? `${d.experience} yrs` : '—'}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate max-w-[150px]">{d.location || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEditDoctor(d)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={14} /></button>
                            <button onClick={() => handleDeleteDoctor(d._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      {/* Doctor Form Modal */}
      {showDoctorForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800">
              <p className="font-semibold text-gray-900 dark:text-gray-100">{editDoctorId ? 'Edit Doctor' : 'Add Doctor'}</p>
              <button onClick={() => setShowDoctorForm(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveDoctor} className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Title</label>
                  <select value={doctorForm.title} onChange={e => setDoctorForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {['Dr.', 'Prof.', 'Mr.', 'Ms.'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">First Name *</label>
                  <input required value={doctorForm.firstName} onChange={e => setDoctorForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Last Name *</label>
                  <input required value={doctorForm.lastName} onChange={e => setDoctorForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Specialty *</label>
                  <select required value={doctorForm.specialty} onChange={e => setDoctorForm(f => ({ ...f, specialty: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Designation</label>
                  <input value={doctorForm.designation} onChange={e => setDoctorForm(f => ({ ...f, designation: e.target.value }))}
                    placeholder="e.g. Senior Consultant"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Experience (yrs)</label>
                  <input type="number" min="0" value={doctorForm.experience} onChange={e => setDoctorForm(f => ({ ...f, experience: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Phone</label>
                  <input value={doctorForm.phone} onChange={e => setDoctorForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Email *</label>
                  <input required type="email" value={doctorForm.email} onChange={e => setDoctorForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Location</label>
                <input value={doctorForm.location} onChange={e => setDoctorForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Mumbai, India"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>

              <ImageUpload 
                label="Profile Image" 
                value={doctorForm.profileImage} 
                onChange={url => setDoctorForm(f => ({ ...f, profileImage: url }))} 
              />

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Bio</label>
                <textarea rows={3} value={doctorForm.bio} onChange={e => setDoctorForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Brief description about the doctor..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              </div>

              {doctorError && <p className="text-xs text-red-500">{doctorError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDoctorForm(false)} className="flex-1 py-2.5 border rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={savingDoctor} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {savingDoctor ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : editDoctorId ? 'Update Doctor' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800">
              <p className="font-semibold text-gray-900 dark:text-gray-100">{editId ? 'Edit Product' : 'Add Product'}</p>
              <button onClick={() => setShowForm(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[['name', 'Product Name *'], ['brand', 'Brand']].map(([key, label]) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
                    <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required={key === 'name'}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Discount %</label>
                  <input type="number" min="0" max="100" value={form.discountPercent} onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Stock</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Tags (comma separated)</label>
                  <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <ImageUpload 
                    label="Product Image (Cover Photo)" 
                    value={form.images?.[0] || ''} 
                    onChange={url => setForm(f => ({ ...f, images: url ? [url] : [] }))} 
                  />
                </div>
                <button 
                  type="button" 
                  onClick={handleFetchImage}
                  disabled={fetchingImage || !form.name}
                  className="px-4 py-2 border border-purple-200 dark:border-purple-900/50 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors flex items-center justify-center gap-1.5 h-[38px] disabled:opacity-50"
                  title="Auto-fetch high quality image for this medicine using RapidAPI"
                >
                  {fetchingImage ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Auto-Find
                </button>
              </div>

              {[['description', 'Description'], ['usage', 'Usage Instructions'], ['ingredients', 'Ingredients'], ['warnings', 'Warnings'], ['sideEffects', 'Side Effects']].map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
                  <textarea rows={2} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                </div>
              ))}

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.requiresPrescription} onChange={e => setForm(f => ({ ...f, requiresPrescription: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Requires Prescription</span>
              </label>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
