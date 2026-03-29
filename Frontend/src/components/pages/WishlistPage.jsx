import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import { HeartPulse, ArrowLeft, Heart, ShoppingCart, Pill, Loader2, Star } from 'lucide-react'

const WishlistPage = () => {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    apiFetch('/wishlist', getToken).then(setItems).finally(() => setLoading(false))
  }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const handleRemove = async (productId) => {
    await apiFetch('/wishlist/toggle', getToken, { method: 'POST', body: JSON.stringify({ productId }) })
    setItems(prev => prev.filter(i => i._id !== productId))
  }

  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('pharma_cart') || '[]')
    const idx = cart.findIndex(i => i._id === product._id)
    const price = +(product.price * (1 - product.discountPercent / 100)).toFixed(2)
    if (idx >= 0) cart[idx].quantity += 1
    else cart.push({ _id: product._id, name: product.name, price, quantity: 1, image: product.images?.[0] || '', requiresPrescription: product.requiresPrescription })
    localStorage.setItem('pharma_cart', JSON.stringify(cart))
    showToast(`${product.name} added to cart`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-blue-600 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm hover:text-blue-200"><ArrowLeft size={16} /> Back</button>
          <div className="flex items-center gap-2 font-bold text-lg cursor-pointer" onClick={() => navigate('/pharmacy')}>
            <HeartPulse size={20} /> MediConnect
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Heart size={20} className="text-red-500" /> My Wishlist</h1>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 py-10 justify-center"><Loader2 size={20} className="animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500 space-y-3">
            <Heart size={48} className="mx-auto text-gray-200" />
            <p>Your wishlist is empty.</p>
            <button onClick={() => navigate('/pharmacy/products')} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">Browse Products</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(product => {
              const discounted = +(product.price * (1 - product.discountPercent / 100)).toFixed(2)
              return (
                <div key={product._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all flex flex-col relative">
                  <button onClick={() => handleRemove(product._id)} className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white dark:bg-gray-900 shadow-sm border border-gray-100">
                    <Heart size={14} className="fill-red-500 text-red-500" />
                  </button>
                  <div onClick={() => navigate(`/pharmacy/product/${product._id}`)} className="cursor-pointer p-4 flex flex-col flex-1">
                    <div className="h-28 flex items-center justify-center bg-gray-50 dark:bg-gray-950 rounded-lg mb-3">
                      {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="h-full object-contain" /> : <Pill size={36} className="text-blue-200" />}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{product.brand}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1 mt-0.5">{product.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={11} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{product.rating?.toFixed(1) || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-base font-bold text-gray-900 dark:text-gray-100">₹{discounted}</span>
                      {product.discountPercent > 0 && <span className="text-xs text-green-600 dark:text-green-400 font-medium">{product.discountPercent}% off</span>}
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <button onClick={() => handleAddToCart(product)} className="w-full py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1.5">
                      <ShoppingCart size={13} /> Add to Cart
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg z-50">{toast}</div>}
    </div>
  )
}

export default WishlistPage
