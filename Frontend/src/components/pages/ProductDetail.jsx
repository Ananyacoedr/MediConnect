import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import {
  HeartPulse, ArrowLeft, ShoppingCart, Heart, Star, Pill,
  AlertTriangle, Info, Package, Loader2, Plus, Minus, BadgeCheck
} from 'lucide-react'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getToken, isSignedIn } = useAuth()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [wishlisted, setWishlisted] = useState(false)
  const [qty, setQty] = useState(1)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('description')

  useEffect(() => {
    apiFetch(`/products/${id}`, null)
      .then(setProduct)
      .finally(() => setLoading(false))

    if (isSignedIn) {
      apiFetch('/wishlist', getToken)
        .then(items => setWishlisted(items.some(i => i._id === id)))
        .catch(() => {})
    }
  }, [id, isSignedIn])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const handleAddToCart = () => {
    if (!product) return
    const cart = JSON.parse(localStorage.getItem('pharma_cart') || '[]')
    const idx = cart.findIndex(i => i._id === product._id)
    if (idx >= 0) cart[idx].quantity += qty
    else cart.push({ _id: product._id, name: product.name, price: discounted, quantity: qty, image: product.images?.[0] || '', requiresPrescription: product.requiresPrescription })
    localStorage.setItem('pharma_cart', JSON.stringify(cart))
    showToast('Added to cart!')
  }

  const handleToggleWishlist = async () => {
    if (!isSignedIn) return navigate('/login')
    const res = await apiFetch('/wishlist/toggle', getToken, { method: 'POST', body: JSON.stringify({ productId: id }) })
    setWishlisted(res.wishlisted)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-blue-600 dark:text-blue-400" />
    </div>
  )

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 dark:text-gray-500">Product not found.</div>
  )

  const discounted = +(product.price * (1 - product.discountPercent / 100)).toFixed(2)
  const TABS = ['description', 'usage', 'ingredients', 'warnings']

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-blue-600 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm hover:text-blue-200">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2 font-bold text-lg cursor-pointer" onClick={() => navigate('/pharmacy')}>
            <HeartPulse size={20} /> MediConnect
          </div>
          <div className="ml-auto">
            <button onClick={() => navigate('/pharmacy/cart')} className="relative">
              <ShoppingCart size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

            {/* Image */}
            <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-10 min-h-64">
              {product.images?.[0]
                ? <img src={product.images[0]} alt={product.name} className="max-h-64 object-contain" />
                : <Pill size={80} className="text-blue-200" />
              }
            </div>

            {/* Info */}
            <div className="p-6 space-y-4">
              {product.requiresPrescription && (
                <span className="inline-flex items-center gap-1 text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 px-2 py-1 rounded-lg font-medium">
                  <AlertTriangle size={11} /> Prescription Required
                </span>
              )}

              <div>
                <p className="text-sm text-gray-400 dark:text-gray-500">{product.brand}</p>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{product.name}</h1>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/30 border border-green-200 px-2 py-0.5 rounded-lg">
                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{product.rating?.toFixed(1) || '—'}</span>
                </div>
                <span className="text-sm text-gray-400 dark:text-gray-500">{product.reviewCount} reviews</span>
              </div>

              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">₹{discounted}</span>
                {product.discountPercent > 0 && (
                  <>
                    <span className="text-lg text-gray-400 dark:text-gray-500 line-through">₹{product.price}</span>
                    <span className="text-sm text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">{product.discountPercent}% off</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {product.stock > 0 ? `In Stock (${product.stock} left)` : 'Out of Stock'}
                </span>
              </div>

              {/* Qty */}
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Qty:</p>
                <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-100 transition-colors"><Minus size={14} /></button>
                  <span className="px-4 py-2 text-sm font-semibold">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} className="px-3 py-2 hover:bg-gray-100 transition-colors"><Plus size={14} /></button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingCart size={16} /> Add to Cart
                </button>
                <button
                  onClick={handleToggleWishlist}
                  className={`px-4 py-3 rounded-xl border transition-colors ${wishlisted ? 'bg-red-50 dark:bg-red-900/30 border-red-200 text-red-500' : 'border-gray-200 dark:border-gray-800 text-gray-500 hover:border-red-300'}`}
                >
                  <Heart size={18} className={wishlisted ? 'fill-red-500' : ''} />
                </button>
              </div>

              {product.requiresPrescription && (
                <div className="flex items-start gap-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 rounded-xl p-3">
                  <Info size={14} className="text-orange-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-orange-700">This medicine requires a valid prescription. You'll be asked to upload it during checkout.</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-100">
            <div className="flex border-b dark:border-gray-800 border-gray-100 px-6">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="p-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed min-h-24">
              {activeTab === 'description' && (product.description || 'No description available.')}
              {activeTab === 'usage' && (product.usage || 'No usage instructions available.')}
              {activeTab === 'ingredients' && (product.ingredients || 'No ingredient information available.')}
              {activeTab === 'warnings' && (
                <div className="space-y-2">
                  {product.warnings && <p><span className="font-semibold text-orange-600">Warnings:</span> {product.warnings}</p>}
                  {product.sideEffects && <p><span className="font-semibold text-red-600 dark:text-red-400">Side Effects:</span> {product.sideEffects}</p>}
                  {!product.warnings && !product.sideEffects && 'No warnings listed.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg z-50">{toast}</div>
      )}
    </div>
  )
}

export default ProductDetail
