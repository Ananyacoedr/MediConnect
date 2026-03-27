import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ThemeToggle from '@/components/ThemeToggle'
import {
  HeartPulse, ArrowLeft, ShoppingCart, Pill, Trash2, Plus, Minus,
  CheckCircle2, AlertCircle, Loader2, PackageCheck, Stethoscope,
  CalendarDays, ChevronDown, ChevronUp, Truck, Tag, ClipboardList,
  X, IndianRupee, RefreshCw, ShoppingBag
} from 'lucide-react'

const MedicineShop = () => {
  const navigate = useNavigate()
  const { getToken } = useAuth()

  const [prescriptions, setPrescriptions]   = useState([])
  const [cart, setCart]                     = useState([])
  const [orders, setOrders]                 = useState([])
  const [loadingPx, setLoadingPx]           = useState(true)
  const [loadingCart, setLoadingCart]       = useState(true)
  const [autofilling, setAutofilling]       = useState(null)
  const [ordering, setOrdering]             = useState(false)
  const [ordered, setOrdered]               = useState(false)
  const [error, setError]                   = useState(null)
  const [expanded, setExpanded]             = useState(null)
  const [cartOpen, setCartOpen]             = useState(false)
  const [tab, setTab]                       = useState('shop') // 'shop' | 'orders'
  const [loadingOrders, setLoadingOrders]   = useState(false)

  useEffect(() => {
    Promise.all([
      apiFetch('/cart/prescriptions', getToken).then(setPrescriptions).finally(() => setLoadingPx(false)),
      apiFetch('/cart', getToken).then(setCart).finally(() => setLoadingCart(false)),
    ]).catch(e => setError(e.message))
  }, [])

  const fetchOrders = async () => {
    setLoadingOrders(true)
    try {
      const data = await apiFetch('/cart/orders', getToken)
      setOrders(data)
    } catch (e) { setError(e.message) }
    finally { setLoadingOrders(false) }
  }

  const handleTabChange = (t) => {
    setTab(t)
    if (t === 'orders' && orders.length === 0) fetchOrders()
  }

  const autofill = async (apptId) => {
    try {
      setAutofilling(apptId)
      setError(null)
      const items = await apiFetch(`/cart/autofill/${apptId}`, getToken, { method: 'POST' })
      setCart(prev => {
        const filtered = prev.filter(i => i.appointment?._id !== apptId && i.appointment !== apptId)
        return [...filtered, ...items]
      })
      setCartOpen(true)
    } catch (e) { setError(e.message) }
    finally { setAutofilling(null) }
  }

  const updateQty = async (itemId, delta) => {
    const item = cart.find(i => i._id === itemId)
    if (!item) return
    const qty = Math.max(1, item.quantity + delta)
    setCart(prev => prev.map(i => i._id === itemId ? { ...i, quantity: qty } : i))
    await apiFetch(`/cart/${itemId}`, getToken, { method: 'PATCH', body: JSON.stringify({ quantity: qty }) })
  }

  const removeItem = async (itemId) => {
    setCart(prev => prev.filter(i => i._id !== itemId))
    await apiFetch(`/cart/${itemId}`, getToken, { method: 'DELETE' })
  }

  const orderSelected = async (itemIds) => {
    try {
      setOrdering(true)
      setError(null)
      await apiFetch('/cart/order', getToken, { method: 'POST', body: JSON.stringify({ itemIds }) })
      setCart(prev => prev.filter(i => !itemIds.includes(i._id)))
      setOrdered(true)
      setCartOpen(false)
      if (tab === 'orders') fetchOrders()
      setTimeout(() => setOrdered(false), 5000)
    } catch (e) { setError(e.message) }
    finally { setOrdering(false) }
  }

  const inStockItems = cart.filter(i => i.inStock)
  const outOfStock   = cart.filter(i => !i.inStock)
  const cartTotal    = inStockItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0)
  const cartCount    = inStockItems.reduce((s, i) => s + i.quantity, 0)

  // Group orders by orderedAt date (day)
  const groupedOrders = orders.reduce((acc, item) => {
    const key = item.orderedAt
      ? new Date(item.orderedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Unknown date'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
            <HeartPulse size={22} /> MediConnect
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-1.5 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
          >
            <ShoppingCart size={15} />
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
        <div className="flex gap-6 max-w-6xl mx-auto">
          {[
            { id: 'shop', label: 'Medicine Shop', icon: Pill },
            { id: 'orders', label: 'My Orders', icon: ClipboardList },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">

        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm mb-6">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {ordered && (
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl text-sm mb-6">
            <PackageCheck size={15} /> Order placed! Your medicines will be delivered within 24–48 hours.
          </div>
        )}

        {/* ── SHOP TAB ── */}
        {tab === 'shop' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order Medicines</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Select a prescription from your consultations and add medicines to cart.
              </p>
            </div>

            {loadingPx ? (
              <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
                <Loader2 size={18} className="animate-spin" /> Loading prescriptions...
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-gray-400 gap-3">
                <Stethoscope size={48} strokeWidth={1} />
                <p className="text-base font-medium">No prescriptions found</p>
                <p className="text-sm text-center max-w-xs">Complete a consultation with a doctor to get prescriptions and order medicines.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {prescriptions.map(appt => {
                  const cartApptIds = cart.map(i => i.appointment?._id || i.appointment)
                  const alreadyInCart = cartApptIds.includes(appt._id)
                  return (
                    <div key={appt._id} className="space-y-4">
                      {/* Prescription header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
                            <Stethoscope size={18} className="text-blue-600 dark:text-blue-300" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {appt.doctor?.title} {appt.doctor?.firstName} {appt.doctor?.lastName}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <CalendarDays size={11} />
                              {new Date(appt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {appt.doctor?.specialty && <> · {appt.doctor.specialty}</>}
                            </p>
                            {appt.diagnosis && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Diagnosis: {appt.diagnosis}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={alreadyInCart ? 'outline' : 'default'}
                          className="flex items-center gap-1.5 text-xs"
                          onClick={() => autofill(appt._id)}
                          disabled={autofilling === appt._id}
                        >
                          {autofilling === appt._id
                            ? <><Loader2 size={12} className="animate-spin" /> Adding...</>
                            : alreadyInCart
                              ? <><RefreshCw size={12} /> Refresh Cart</>
                              : <><ShoppingCart size={12} /> Add All to Cart</>
                          }
                        </Button>
                      </div>

                      {/* Medicine cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {appt.prescription.map((p, i) => {
                          const cartItem = cart.find(
                            ci => ci.medicine === p.medicine &&
                            (ci.appointment?._id === appt._id || ci.appointment === appt._id)
                          )
                          return (
                            <Card key={i} className="overflow-hidden hover:shadow-md transition-shadow">
                              <CardContent className="p-0">
                                {/* Card top */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 px-4 pt-4 pb-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                      <Pill size={18} className="text-blue-600" />
                                    </div>
                                    {cartItem ? (
                                      <span className="text-[10px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                        <CheckCircle2 size={10} /> In Cart
                                      </span>
                                    ) : (
                                      <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                        <Tag size={10} /> Rx
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">{p.medicine}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.dosage} · {p.duration}</p>
                                </div>

                                {/* Card bottom */}
                                <div className="px-4 py-3 space-y-3">
                                  {p.notes && (
                                    <p className="text-xs text-gray-400 italic">{p.notes}</p>
                                  )}

                                  {cartItem ? (
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                        <button onClick={() => updateQty(cartItem._id, -1)} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                          <Minus size={12} />
                                        </button>
                                        <span className="px-2 text-sm font-medium text-gray-900 dark:text-gray-100">{cartItem.quantity}</span>
                                        <button onClick={() => updateQty(cartItem._id, +1)} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                          <Plus size={12} />
                                        </button>
                                      </div>
                                      <button onClick={() => removeItem(cartItem._id)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400">Click "Add All to Cart" to order</p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === 'orders' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Orders</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your medicine order history.</p>
            </div>

            {loadingOrders ? (
              <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
                <Loader2 size={18} className="animate-spin" /> Loading orders...
              </div>
            ) : Object.keys(groupedOrders).length === 0 ? (
              <div className="flex flex-col items-center py-20 text-gray-400 gap-3">
                <ShoppingBag size={48} strokeWidth={1} />
                <p className="text-base font-medium">No orders yet</p>
                <p className="text-sm">Your ordered medicines will appear here.</p>
              </div>
            ) : (
              Object.entries(groupedOrders).map(([date, items]) => {
                const total = items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0)
                return (
                  <div key={date} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <CalendarDays size={14} className="text-blue-500" /> {date}
                      </p>
                      <span className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''} · ₹{total}</span>
                    </div>
                    <Card>
                      <CardContent className="p-0 divide-y divide-gray-100 dark:divide-gray-700">
                        {items.map(item => (
                          <div key={item._id} className="flex items-center gap-4 px-4 py-3">
                            <div className="p-2 bg-green-50 dark:bg-green-900 rounded-lg shrink-0">
                              <Pill size={16} className="text-green-600 dark:text-green-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.medicine}</p>
                              <p className="text-xs text-gray-400">{item.dosage} · {item.duration}</p>
                              <p className="text-xs text-gray-400">Prescribed by {item.doctorName}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-0.5">
                                <IndianRupee size={12} />{(item.price || 0) * item.quantity}
                              </p>
                              <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                            </div>
                            <span className="text-[10px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 shrink-0">
                              <CheckCircle2 size={10} /> Ordered
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* ── CART DRAWER ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-md bg-white dark:bg-gray-800 flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                <ShoppingCart size={18} className="text-blue-600" /> Cart ({cartCount})
              </div>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {loadingCart ? (
                <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
                  <Loader2 size={16} className="animate-spin" /> Loading...
                </div>
              ) : inStockItems.length === 0 && outOfStock.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-gray-400 gap-3">
                  <ShoppingCart size={40} strokeWidth={1} />
                  <p className="text-sm">Cart is empty</p>
                  <p className="text-xs text-center">Add medicines from your prescriptions above.</p>
                </div>
              ) : (
                <>
                  {inStockItems.map(item => (
                    <div key={item._id} className="flex items-center gap-3 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded-lg shrink-0">
                        <Pill size={15} className="text-blue-600 dark:text-blue-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.medicine}</p>
                        <p className="text-xs text-gray-400">{item.dosage}</p>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 mt-0.5">
                          <IndianRupee size={11} />{(item.price || 0) * item.quantity}
                          {item.price > 0 && <span className="text-gray-400 font-normal ml-1">(₹{item.price} × {item.quantity})</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden shrink-0">
                        <button onClick={() => updateQty(item._id, -1)} className="px-1.5 py-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Minus size={11} />
                        </button>
                        <span className="px-2 text-sm font-medium text-gray-900 dark:text-gray-100">{item.quantity}</span>
                        <button onClick={() => updateQty(item._id, +1)} className="px-1.5 py-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Plus size={11} />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item._id)} className="text-red-400 hover:text-red-600 shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {outOfStock.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
                        <AlertCircle size={12} /> Out of Stock
                      </p>
                      {outOfStock.map(item => (
                        <div key={item._id} className="flex items-center gap-3 border border-orange-200 dark:border-orange-700 rounded-xl p-3 opacity-70">
                          <div className="p-2 bg-orange-50 dark:bg-orange-900 rounded-lg shrink-0">
                            <Pill size={15} className="text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.medicine}</p>
                            <p className="text-xs text-red-500">Out of stock</p>
                            {item.alternative && (
                              <p className="text-xs text-blue-600 dark:text-blue-400">Alt: {item.alternative}</p>
                            )}
                          </div>
                          <button onClick={() => removeItem(item._id)} className="text-red-400 hover:text-red-600 shrink-0">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Drawer footer */}
            {inStockItems.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-4 space-y-3 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal ({cartCount} items)</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-0.5">
                    <IndianRupee size={14} />{cartTotal}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-green-600 dark:text-green-400">
                  <span className="flex items-center gap-1"><Truck size={12} /> Free delivery</span>
                  <span>Est. 24–48 hrs</span>
                </div>
                <Button
                  onClick={() => orderSelected(inStockItems.map(i => i._id))}
                  disabled={ordering}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {ordering
                    ? <><Loader2 size={15} className="animate-spin" /> Placing Order...</>
                    : <><PackageCheck size={15} /> Place Order · ₹{cartTotal}</>
                  }
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MedicineShop
