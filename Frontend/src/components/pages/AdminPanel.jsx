import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import {
  HeartPulse, Package, ShoppingBag, Plus, Pencil, Trash2,
  Loader2, X, CheckCircle, XCircle, AlertTriangle, ChevronDown
} from 'lucide-react'

const TABS = ['products', 'orders']
const CATEGORIES = ['medicines', 'supplements', 'vitamins', 'personal-care', 'health-devices']

const emptyForm = { name: '', brand: '', category: 'medicines', price: '', discountPercent: 0, stock: 0, description: '', usage: '', ingredients: '', warnings: '', sideEffects: '', requiresPrescription: false, tags: '' }

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

  useEffect(() => {
    if (tab === 'products') {
      setLoading(true)
      apiFetch('/products', null).then(setProducts).finally(() => setLoading(false))
    } else {
      setLoading(true)
      apiFetch('/orders/all', getToken).then(setOrders).finally(() => setLoading(false))
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

  return (
    <div className="min-h-screen bg-gray-50">
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'}`}>
              {t === 'products' ? <Package size={15} /> : <ShoppingBag size={15} />} {t}
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

            {loading ? <div className="flex items-center gap-2 text-gray-400 py-10 justify-center"><Loader2 size={20} className="animate-spin" /></div> : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Name', 'Category', 'Price', 'Stock', 'Rx', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map(p => (
                      <tr key={p._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.brand}</p>
                        </td>
                        <td className="px-4 py-3 capitalize text-gray-600">{p.category}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">₹{+(p.price * (1 - p.discountPercent / 100)).toFixed(2)}</p>
                          {p.discountPercent > 0 && <p className="text-xs text-green-600">{p.discountPercent}% off</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${p.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>{p.stock}</span>
                        </td>
                        <td className="px-4 py-3">
                          {p.requiresPrescription ? <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">Yes</span> : <span className="text-xs text-gray-400">No</span>}
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
            {loading ? <div className="flex items-center gap-2 text-gray-400 py-10 justify-center"><Loader2 size={20} className="animate-spin" /></div> : (
              orders.map(order => (
                <div key={order._id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-xs text-gray-400">Order #{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-sm font-semibold text-gray-900">{order.patient?.firstName} {order.patient?.lastName}</p>
                      <p className="text-xs text-gray-400">{order.patient?.email}</p>
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
                  <div className="text-xs text-gray-600 space-y-0.5">
                    {order.items.map((item, i) => (
                      <p key={i}>{item.name} × {item.quantity} — ₹{item.price}</p>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-2">
                    <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="font-bold text-gray-900">Total: ₹{order.totalAmount}</span>
                  </div>
                  {order.prescriptionUrl && (
                    <a href={order.prescriptionUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <AlertTriangle size={11} /> View Prescription
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <p className="font-semibold text-gray-900">{editId ? 'Edit Product' : 'Add Product'}</p>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[['name', 'Product Name *'], ['brand', 'Brand']].map(([key, label]) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
                    <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required={key === 'name'}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Discount %</label>
                  <input type="number" min="0" max="100" value={form.discountPercent} onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Stock</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Tags (comma separated)</label>
                  <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              {[['description', 'Description'], ['usage', 'Usage Instructions'], ['ingredients', 'Ingredients'], ['warnings', 'Warnings'], ['sideEffects', 'Side Effects']].map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
                  <textarea rows={2} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                </div>
              ))}

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.requiresPrescription} onChange={e => setForm(f => ({ ...f, requiresPrescription: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700">Requires Prescription</span>
              </label>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
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
