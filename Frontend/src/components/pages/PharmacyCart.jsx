import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import {
  HeartPulse, ArrowLeft, ShoppingCart, Trash2, Plus, Minus,
  Truck, AlertTriangle, Loader2, PackageCheck, Upload, X, FileText
} from 'lucide-react'

const PharmacyCart = () => {
  const navigate = useNavigate()
  const { getToken, isSignedIn } = useAuth()
  const fileRef = useRef(null)

  const [cart, setCart] = useState([])
  const [address, setAddress] = useState('')
  const [prescriptionFile, setPrescriptionFile] = useState(null)
  const [prescriptionB64, setPrescriptionB64] = useState('')
  const [placing, setPlacing] = useState(false)
  const [ordered, setOrdered] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('pharma_cart') || '[]')
    setCart(saved)
  }, [])

  const save = (updated) => {
    setCart(updated)
    localStorage.setItem('pharma_cart', JSON.stringify(updated))
  }

  const updateQty = (id, delta) => {
    save(cart.map(i => i._id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
  }

  const remove = (id) => save(cart.filter(i => i._id !== id))

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPrescriptionFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPrescriptionB64(reader.result)
    reader.readAsDataURL(file)
  }

  const needsRx = cart.some(i => i.requiresPrescription)
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const deliveryFee = total >= 299 ? 0 : 49

  const handleCheckout = async () => {
    if (!isSignedIn) return navigate('/login')
    if (!address.trim()) return setError('Please enter a delivery address.')
    if (needsRx && !prescriptionB64) return setError('Please upload a prescription for Rx medicines.')
    setPlacing(true)
    setError(null)
    try {
      await apiFetch('/orders', getToken, {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i._id, quantity: i.quantity })),
          address,
          prescriptionUrl: prescriptionB64,
        }),
      })
      localStorage.removeItem('pharma_cart')
      setOrdered(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setPlacing(false)
    }
  }

  if (ordered) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center max-w-sm w-full space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <PackageCheck size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Order Placed!</h2>
        <p className="text-sm text-gray-500">Your order has been placed successfully. You'll receive a confirmation shortly.</p>
        {needsRx && <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-2">Your prescription is under review. Order will be confirmed once approved.</p>}
        <div className="flex gap-3 pt-2">
          <button onClick={() => navigate('/pharmacy/orders')} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">Track Orders</button>
          <button onClick={() => navigate('/pharmacy')} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Continue Shopping</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm hover:text-blue-200"><ArrowLeft size={16} /> Back</button>
          <div className="flex items-center gap-2 font-bold text-lg cursor-pointer" onClick={() => navigate('/pharmacy')}>
            <HeartPulse size={20} /> MediConnect
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-sm">
            <ShoppingCart size={16} /> Cart ({cart.length})
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {cart.length === 0 ? (
          <div className="text-center py-20 text-gray-400 space-y-3">
            <ShoppingCart size={48} className="mx-auto text-gray-200" />
            <p className="text-lg font-medium">Your cart is empty</p>
            <button onClick={() => navigate('/pharmacy/products')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">Browse Products</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3">
              <h1 className="text-xl font-bold text-gray-900 mb-4">Shopping Cart</h1>

              {needsRx && (
                <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <AlertTriangle size={15} className="text-orange-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-orange-700">Your cart contains prescription medicines. Please upload a valid prescription below.</p>
                </div>
              )}

              {cart.map(item => (
                <div key={item._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                    {item.image ? <img src={item.image} alt={item.name} className="h-full object-contain" /> : <ShoppingCart size={24} className="text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                    {item.requiresPrescription && <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">Rx Required</span>}
                    <p className="text-sm font-bold text-gray-900 mt-1">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button onClick={() => updateQty(item._id, -1)} className="px-2 py-1.5 hover:bg-gray-100"><Minus size={12} /></button>
                      <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQty(item._id, +1)} className="px-2 py-1.5 hover:bg-gray-100"><Plus size={12} /></button>
                    </div>
                    <button onClick={() => remove(item._id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h2 className="font-bold text-gray-900">Order Summary</h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1"><Truck size={13} /> Delivery</span>
                    <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                  </div>
                  {deliveryFee > 0 && <p className="text-xs text-gray-400">Add ₹{(299 - total).toFixed(0)} more for free delivery</p>}
                  <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span>₹{(total + deliveryFee).toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Delivery Address *</label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Enter your full delivery address..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>

                {needsRx && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Upload Prescription *</label>
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      {prescriptionFile ? (
                        <div className="flex items-center justify-center gap-2 text-blue-600">
                          <FileText size={16} />
                          <span className="text-xs font-medium truncate max-w-[140px]">{prescriptionFile.name}</span>
                          <button onClick={e => { e.stopPropagation(); setPrescriptionFile(null); setPrescriptionB64('') }}><X size={14} className="text-gray-400" /></button>
                        </div>
                      ) : (
                        <>
                          <Upload size={20} className="text-gray-300 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">Click to upload prescription</p>
                          <p className="text-[10px] text-gray-400">PDF, JPG, PNG</p>
                        </>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
                  </div>
                )}

                {error && <p className="text-xs text-red-500">{error}</p>}

                <button
                  onClick={handleCheckout}
                  disabled={placing}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                >
                  {placing ? <><Loader2 size={15} className="animate-spin" /> Placing Order...</> : <><PackageCheck size={15} /> Place Order</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PharmacyCart
