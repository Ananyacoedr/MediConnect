import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import {
  HeartPulse, Search, ShoppingCart, Heart, ChevronRight,
  Pill, Shield, Thermometer, Leaf, Star, Truck, RotateCcw, BadgeCheck
} from 'lucide-react'

const CATEGORIES = [
  { key: 'medicines',      label: 'Medicines',       icon: Pill,        color: 'bg-blue-50 text-blue-600' },
  { key: 'supplements',    label: 'Supplements',     icon: Leaf,        color: 'bg-green-50 text-green-600' },
  { key: 'vitamins',       label: 'Vitamins',        icon: BadgeCheck,  color: 'bg-yellow-50 text-yellow-600' },
  { key: 'personal-care',  label: 'Personal Care',   icon: Shield,      color: 'bg-pink-50 text-pink-600' },
  { key: 'health-devices', label: 'Health Devices',  icon: Thermometer, color: 'bg-purple-50 text-purple-600' },
]

const BANNERS = [
  { title: 'Up to 30% off on Medicines', sub: 'Trusted brands, delivered fast', color: 'from-blue-600 to-blue-400' },
  { title: 'Health Devices Sale', sub: 'BP monitors, glucometers & more', color: 'from-purple-600 to-purple-400' },
  { title: 'Free Delivery on ₹299+', sub: 'On all healthcare products', color: 'from-green-600 to-green-400' },
]

const ProductCard = ({ product, onAddToCart, wishlistIds, onToggleWishlist }) => {
  const navigate = useNavigate()
  const discounted = +(product.price * (1 - product.discountPercent / 100)).toFixed(2)
  const wishlisted = wishlistIds.includes(product._id)

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all group relative flex flex-col">
      <button
        onClick={() => onToggleWishlist(product._id)}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white shadow-sm border border-gray-100"
      >
        <Heart size={14} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
      </button>

      <div
        onClick={() => navigate(`/pharmacy/product/${product._id}`)}
        className="cursor-pointer p-4 flex flex-col flex-1"
      >
        <div className="h-28 flex items-center justify-center bg-gray-50 rounded-lg mb-3">
          {product.images?.[0]
            ? <img src={product.images[0]} alt={product.name} className="h-full object-contain" />
            : <Pill size={40} className="text-blue-200" />
          }
        </div>

        {product.requiresPrescription && (
          <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-medium mb-1 w-fit">Rx Required</span>
        )}

        <p className="text-xs text-gray-400 mb-0.5">{product.brand}</p>
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">{product.name}</p>

        <div className="flex items-center gap-1 mt-1">
          <Star size={11} className="fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-gray-500">{product.rating?.toFixed(1) || '—'} ({product.reviewCount})</span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-base font-bold text-gray-900">₹{discounted}</span>
          {product.discountPercent > 0 && (
            <>
              <span className="text-xs text-gray-400 line-through">₹{product.price}</span>
              <span className="text-xs text-green-600 font-medium">{product.discountPercent}% off</span>
            </>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={() => onAddToCart(product)}
          className="w-full py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <ShoppingCart size={13} /> Add to Cart
        </button>
      </div>
    </div>
  )
}

const PharmacyHome = () => {
  const navigate = useNavigate()
  const { getToken, isSignedIn } = useAuth()
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [wishlistIds, setWishlistIds] = useState([])
  const [bannerIdx, setBannerIdx] = useState(0)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    apiFetch('/products?sort=newest', null)
      .then(setProducts)
      .finally(() => setLoading(false))

    if (isSignedIn) {
      apiFetch('/wishlist', getToken).then(items => setWishlistIds(items.map(i => i._id))).catch(() => {})
      const saved = JSON.parse(localStorage.getItem('pharma_cart') || '[]')
      setCartCount(saved.reduce((s, i) => s + i.quantity, 0))
    }
  }, [isSignedIn])

  useEffect(() => {
    const t = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4000)
    return () => clearInterval(t)
  }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('pharma_cart') || '[]')
    const idx = cart.findIndex(i => i._id === product._id)
    if (idx >= 0) cart[idx].quantity += 1
    else cart.push({ _id: product._id, name: product.name, price: +(product.price * (1 - product.discountPercent / 100)).toFixed(2), quantity: 1, image: product.images?.[0] || '', requiresPrescription: product.requiresPrescription })
    localStorage.setItem('pharma_cart', JSON.stringify(cart))
    setCartCount(cart.reduce((s, i) => s + i.quantity, 0))
    showToast(`${product.name} added to cart`)
  }

  const handleToggleWishlist = async (productId) => {
    if (!isSignedIn) return navigate('/login')
    try {
      const res = await apiFetch('/wishlist/toggle', getToken, { method: 'POST', body: JSON.stringify({ productId }) })
      setWishlistIds(prev => res.wishlisted ? [...prev, productId] : prev.filter(id => id !== productId))
    } catch {}
  }

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase())
  )

  const banner = BANNERS[bannerIdx]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-lg cursor-pointer shrink-0" onClick={() => navigate('/home')}>
            <HeartPulse size={22} /> MediConnect
          </div>

          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && navigate(`/pharmacy/products?search=${search}`)}
              placeholder="Search medicines, health products..."
              className="w-full pl-9 pr-4 py-2 rounded-lg text-gray-900 text-sm focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => navigate('/pharmacy/wishlist')} className="flex items-center gap-1 text-sm hover:text-blue-200">
              <Heart size={18} />
            </button>
            <button onClick={() => navigate('/pharmacy/cart')} className="relative flex items-center gap-1 text-sm hover:text-blue-200">
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cartCount}</span>
              )}
            </button>
            <button onClick={() => navigate('/pharmacy/orders')} className="text-sm hover:text-blue-200 hidden sm:block">Orders</button>
            {isSignedIn
              ? <button onClick={() => navigate('/patient-dashboard')} className="text-sm hover:text-blue-200 hidden sm:block">Dashboard</button>
              : <button onClick={() => navigate('/login')} className="text-sm bg-white text-blue-600 px-3 py-1 rounded-lg font-medium">Login</button>
            }
          </div>
        </div>

        {/* Category nav */}
        <div className="bg-blue-700 border-t border-blue-500">
          <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto py-1 scrollbar-hide">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => navigate(`/pharmacy/products?category=${c.key}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-100 hover:text-white hover:bg-blue-600 rounded-lg whitespace-nowrap transition-colors"
              >
                <c.icon size={13} /> {c.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

        {/* Banner */}
        <div className={`bg-gradient-to-r ${banner.color} rounded-2xl p-8 text-white transition-all`}>
          <p className="text-2xl font-bold">{banner.title}</p>
          <p className="text-blue-100 mt-1">{banner.sub}</p>
          <button
            onClick={() => navigate('/pharmacy/products')}
            className="mt-4 bg-white text-blue-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            Shop Now
          </button>
          <div className="flex gap-1.5 mt-4">
            {BANNERS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Truck, label: 'Free Delivery', sub: 'On orders above ₹299' },
            { icon: RotateCcw, label: 'Easy Returns', sub: '7-day return policy' },
            { icon: BadgeCheck, label: '100% Genuine', sub: 'Certified products only' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Icon size={18} /></div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => navigate(`/pharmacy/products?category=${c.key}`)}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div className={`p-3 rounded-full ${c.color}`}><c.icon size={20} /></div>
                <span className="text-xs font-medium text-gray-700 text-center">{c.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Products */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {search ? `Results for "${search}"` : 'Featured Products'}
            </h2>
            <button onClick={() => navigate('/pharmacy/products')} className="text-sm text-blue-600 flex items-center gap-1 hover:underline">
              View all <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Pill size={40} className="mx-auto mb-3 text-gray-200" />
              <p>No products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {filtered.slice(0, 10).map(p => (
                <ProductCard
                  key={p._id} product={p}
                  onAddToCart={handleAddToCart}
                  wishlistIds={wishlistIds}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}

export default PharmacyHome
