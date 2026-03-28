import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import { HeartPulse, ArrowLeft, Package, Loader2, Truck, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react'

const STATUS_STYLES = {
  pending:   { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { color: 'bg-blue-100 text-blue-700',    icon: CheckCircle },
  shipped:   { color: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered: { color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  cancelled: { color: 'bg-red-100 text-red-700',      icon: XCircle },
}

const RX_STYLES = {
  'not-required': 'bg-gray-100 text-gray-500',
  pending:        'bg-orange-100 text-orange-600',
  approved:       'bg-green-100 text-green-600',
  rejected:       'bg-red-100 text-red-600',
}

const MyOrders = () => {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/orders/my', getToken)
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm hover:text-blue-200"><ArrowLeft size={16} /> Back</button>
          <div className="flex items-center gap-2 font-bold text-lg cursor-pointer" onClick={() => navigate('/pharmacy')}>
            <HeartPulse size={20} /> MediConnect
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-xl font-bold text-gray-900">My Orders</h1>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-10 justify-center"><Loader2 size={20} className="animate-spin" /> Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400 space-y-3">
            <Package size={48} className="mx-auto text-gray-200" />
            <p>No orders yet.</p>
            <button onClick={() => navigate('/pharmacy/products')} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">Shop Now</button>
          </div>
        ) : (
          orders.map(order => {
            const { color, icon: Icon } = STATUS_STYLES[order.status] || STATUS_STYLES.pending
            return (
              <div key={order._id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs text-gray-400">Order ID</p>
                    <p className="text-sm font-mono text-gray-700">{order._id.slice(-10).toUpperCase()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.prescriptionStatus !== 'not-required' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RX_STYLES[order.prescriptionStatus]}`}>
                        Rx: {order.prescriptionStatus}
                      </span>
                    )}
                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${color}`}>
                      <Icon size={11} /> {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <p className="text-sm text-gray-800">{item.name || item.product?.name}</p>
                      <p className="text-sm text-gray-600">₹{item.price} × {item.quantity}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <div className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {order.address && <span className="ml-2 text-gray-400">· {order.address.slice(0, 40)}...</span>}
                  </div>
                  <p className="font-bold text-gray-900">₹{order.totalAmount}</p>
                </div>

                {order.prescriptionStatus === 'rejected' && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2">
                    <AlertTriangle size={13} className="text-red-500 shrink-0" />
                    <p className="text-xs text-red-600">Prescription was rejected. Please contact support or reorder with a valid prescription.</p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default MyOrders
