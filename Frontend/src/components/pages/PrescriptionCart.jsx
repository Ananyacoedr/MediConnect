import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import ThemeToggle from '@/components/ThemeToggle'
import {
  HeartPulse, ArrowLeft, ShoppingCart, Pill, Trash2, Plus, Minus,
  CheckCircle2, AlertCircle, Loader2, RefreshCw, PackageCheck,
  Stethoscope, CalendarDays, ChevronDown, ChevronUp, Truck
} from 'lucide-react'

const PrescriptionCart = () => {
  const navigate = useNavigate()
  const { getToken } = useAuth()

  const [prescriptions, setPrescriptions] = useState([])
  const [cart, setCart]                   = useState([])
  const [loadingPx, setLoadingPx]         = useState(true)
  const [loadingCart, setLoadingCart]     = useState(true)
  const [autofilling, setAutofilling]     = useState(null)
  const [ordering, setOrdering]           = useState(false)
  const [ordered, setOrdered]             = useState(false)
  const [error, setError]                 = useState(null)
  const [expanded, setExpanded]           = useState(null)

  useEffect(() => {
    apiFetch('/cart/prescriptions', getToken)
      .then(setPrescriptions)
      .catch(e => setError(e.message))
      .finally(() => setLoadingPx(false))

    apiFetch('/cart', getToken)
      .then(setCart)
      .catch(e => setError(e.message))
      .finally(() => setLoadingCart(false))
  }, [])

  const autofill = async (apptId) => {
    try {
      setAutofilling(apptId)
      setError(null)
      const items = await apiFetch(`/cart/autofill/${apptId}`, getToken, { method: 'POST' })
      setCart(prev => {
        const filtered = prev.filter(i => i.appointment?._id !== apptId && i.appointment !== apptId)
        return [...filtered, ...items]
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setAutofilling(null)
    }
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

  const orderAll = async () => {
    try {
      setOrdering(true)
      setError(null)
      await apiFetch('/cart/order', getToken, { method: 'POST' })
      setCart(prev => prev.filter(i => !i.inStock))
      setOrdered(true)
      setTimeout(() => setOrdered(false), 5000)
    } catch (e) {
      setError(e.message)
    } finally {
      setOrdering(false)
    }
  }

  const inStockItems  = cart.filter(i => i.inStock)
  const outOfStock    = cart.filter(i => !i.inStock)
  const totalItems    = inStockItems.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 dark:bg-gray-900 flex flex-col transition-colors">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800 border-gray-200 dark:border-gray-800 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xl">
            <HeartPulse size={22} /> MediConnect
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:bg-blue-900 px-3 py-1 rounded-full">
            <ShoppingCart size={14} /> {totalItems} item{totalItems !== 1 ? 's' : ''} in cart
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-8">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Prescription Cart</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your prescribed medicines auto-filled from consultations. Order with one click.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {ordered && (
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl text-sm">
            <PackageCheck size={15} /> Order placed successfully! Your medicines will be delivered within 24–48 hours.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Prescriptions ── */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope size={16} className="text-blue-600 dark:text-blue-400" /> My Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPx ? (
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 py-4"><Loader2 size={15} className="animate-spin" /> Loading...</div>
                ) : prescriptions.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-gray-400 dark:text-gray-500 gap-2">
                    <Pill size={32} strokeWidth={1} />
                    <p className="text-sm text-center">No prescriptions yet. Complete a consultation first.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prescriptions.map(appt => (
                      <div key={appt._id} className="border border-gray-200 dark:border-gray-800 dark:border-gray-700 rounded-xl overflow-hidden">
                        {/* Prescription header */}
                        <button
                          onClick={() => setExpanded(expanded === appt._id ? null : appt._id)}
                          className="w-full flex items-center justify-between px-3 py-3 bg-gray-50 dark:bg-gray-950 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {appt.doctor?.title} {appt.doctor?.firstName} {appt.doctor?.lastName}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                              <CalendarDays size={10} />
                              {new Date(appt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          {expanded === appt._id ? <ChevronUp size={14} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={14} className="text-gray-400 dark:text-gray-500" />}
                        </button>

                        {/* Medicines list */}
                        {expanded === appt._id && (
                          <div className="px-3 py-2 space-y-1">
                            {appt.prescription.map((p, i) => (
                              <p key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                                <Pill size={10} className="text-blue-400 shrink-0" />
                                {p.medicine} <span className="text-gray-400 dark:text-gray-500">· {p.dosage} · {p.duration}</span>
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Autofill button */}
                        <div className="px-3 pb-3 pt-1">
                          <Button
                            size="sm"
                            className="w-full h-8 text-xs flex items-center gap-1.5"
                            onClick={() => autofill(appt._id)}
                            disabled={autofilling === appt._id}
                          >
                            {autofilling === appt._id
                              ? <><Loader2 size={12} className="animate-spin" /> Adding to cart...</>
                              : <><RefreshCw size={12} /> Add to Cart</>
                            }
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT: Cart ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* In-stock items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart size={16} className="text-blue-600 dark:text-blue-400" /> Cart
                  </CardTitle>
                  {inStockItems.length > 0 && (
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                      {inStockItems.length} available
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingCart ? (
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 py-4"><Loader2 size={15} className="animate-spin" /> Loading cart...</div>
                ) : inStockItems.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-gray-400 dark:text-gray-500 gap-2">
                    <ShoppingCart size={36} strokeWidth={1} />
                    <p className="text-sm">Cart is empty. Add medicines from your prescriptions.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {inStockItems.map(item => (
                      <div key={item._id} className="flex items-center justify-between py-4 gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 dark:bg-blue-900 text-blue-600 dark:text-blue-400 dark:text-blue-300 shrink-0">
                            <Pill size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.medicine}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.dosage} · {item.duration}</p>
                            {item.notes && <p className="text-xs text-gray-400 dark:text-gray-500 italic">{item.notes}</p>}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Prescribed by {item.doctorName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {/* Qty control */}
                          <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-800 dark:border-gray-600 rounded-lg overflow-hidden">
                            <button onClick={() => updateQty(item._id, -1)} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                              <Minus size={12} />
                            </button>
                            <span className="px-2 text-sm font-medium text-gray-900 dark:text-gray-100">{item.quantity}</span>
                            <button onClick={() => updateQty(item._id, +1)} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                              <Plus size={12} />
                            </button>
                          </div>
                          <button onClick={() => removeItem(item._id)} className="text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Out of stock */}
            {outOfStock.length > 0 && (
              <Card className="border-orange-200 dark:border-orange-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <AlertCircle size={16} /> Unavailable Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {outOfStock.map(item => (
                      <div key={item._id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/30 dark:bg-orange-900 text-orange-500 shrink-0">
                              <Pill size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.medicine}</p>
                              <p className="text-xs text-red-500 mt-0.5">Out of stock</p>
                            </div>
                          </div>
                          <button onClick={() => removeItem(item._id)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={15} />
                          </button>
                        </div>
                        {item.alternative && (
                          <div className="mt-2 ml-11 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 px-3 py-2 rounded-lg">
                            <RefreshCw size={12} className="text-blue-500 shrink-0" />
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              Alternative available: <span className="font-semibold">{item.alternative}</span>
                            </p>
                          </div>
                        )}
                        <p className="mt-2 ml-11 text-xs text-gray-400 dark:text-gray-500">
                          Check nearby pharmacies: Apollo Pharmacy, MedPlus, Netmeds
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order summary */}
            {inStockItems.length > 0 && (
              <Card className="border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:bg-blue-950">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Order Summary</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {totalItems} item{totalItems !== 1 ? 's' : ''} · Estimated delivery: 24–48 hrs
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                      <Truck size={14} /> Free delivery
                    </div>
                  </div>
                  <Button
                    onClick={orderAll}
                    disabled={ordering}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {ordering
                      ? <><Loader2 size={15} className="animate-spin" /> Placing Order...</>
                      : <><PackageCheck size={15} /> Order All Medicines</>
                    }
                  </Button>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default PrescriptionCart
