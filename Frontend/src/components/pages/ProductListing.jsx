import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import {
  HeartPulse, Search, ShoppingCart, Heart, SlidersHorizontal,
  Pill, Star, X, ChevronDown, ChevronUp, Leaf, Shield, Thermometer, BadgeCheck
} from 'lucide-react'

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'medicines', label: 'Medicines' },
  { key: 'supplements', label: 'Supplements' },
  { key: 'vitamins', label: 'Vitamins' },
  { key: 'personal-care', label: 'Personal Care' },
  { key: 'health-devices', label: 'Health Devices' },
]

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest First' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'rating', label: 'Top Rated' },
]

const ProductCard = ({ product, onAddToCart, wishlistIds, onToggleWishlist }) => {
  const navigate = useNavigate()
  const discounted = +(product.price * (1 - product.discountPercent / 100)).toFixed(2)
  const wishlisted = wishlistIds.includes(product._id)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all flex flex-col relative">
      <button onClick={(e) => { e.stopPropagation(); onToggleWishlist(product._id); }} className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white dark:bg-gray-900 shadow-sm border border-gray-100 hover:scale-110 active:scale-75 transition-all duration-200">
        <Heart size={14} className={`${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'} transition-colors duration-200`} />
      </button>

      <div onClick={() => navigate(`/pharmacy/product/${product._id}`)} className="cursor-pointer p-4 flex flex-col flex-1">
        <div className="h-32 flex items-center justify-center bg-gray-50 dark:bg-gray-950 rounded-lg mb-3">
          {product.images?.[0]
            ? <img src={product.images[0]} alt={product.name} className="h-full object-contain" />
            : <Pill size={40} className="text-blue-200" />
          }
        </div>
        {product.requiresPrescription && (
          <span className="text-[10px] bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 px-1.5 py-0.5 rounded font-medium mb-1 w-fit">Rx Required</span>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500">{product.brand}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1 mt-0.5">{product.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <Star size={11} className="fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-gray-500">{product.rating?.toFixed(1) || '—'} ({product.reviewCount})</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-base font-bold text-gray-900 dark:text-gray-100">₹{discounted}</span>
          {product.discountPercent > 0 && (
            <>
              <span className="text-xs text-gray-400 dark:text-gray-500 line-through">₹{product.price}</span>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">{product.discountPercent}% off</span>
            </>
          )}
        </div>
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
          className="w-full py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <ShoppingCart size={13} /> Add to Cart
        </button>
      </div>
    </div>
  )
}

const ProductListing = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { getToken, isSignedIn } = useAuth()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [wishlistIds, setWishlistIds] = useState([])
  const [cartCount, setCartCount] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [toast, setToast] = useState(null)

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    minPrice: '',
    maxPrice: '',
    requiresPrescription: '',
    sort: 'newest',
  })

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.category) params.set('category', filters.category)
    if (filters.search) params.set('search', filters.search)
    if (filters.minPrice) params.set('minPrice', filters.minPrice)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
    if (filters.requiresPrescription !== '') params.set('requiresPrescription', filters.requiresPrescription)
    if (filters.sort) params.set('sort', filters.sort)

    apiFetch(`/products?${params}`, null)
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => {
    if (isSignedIn) {
      apiFetch('/wishlist', getToken).then(items => setWishlistIds(items.map(i => i._id))).catch(() => {})
    }
    const saved = JSON.parse(localStorage.getItem('pharma_cart') || '[]')
    setCartCount(saved.reduce((s, i) => s + i.quantity, 0))
  }, [isSignedIn])

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
    
    // Instantly update UI (Optimistic Rendering)
    const isCurrentlyWishlisted = wishlistIds.includes(productId)
    setWishlistIds(prev => isCurrentlyWishlisted ? prev.filter(id => id !== productId) : [...prev, productId])

    try {
      const res = await apiFetch('/wishlist/toggle', getToken, { method: 'POST', body: JSON.stringify({ productId }) })
      // Reconcile with UI
      setWishlistIds(prev => res.wishlisted ? [...new Set([...prev, productId])] : prev.filter(id => id !== productId))
    } catch {
      // Revert if API crashes
      setWishlistIds(prev => isCurrentlyWishlisted ? [...prev, productId] : prev.filter(id => id !== productId))
      showToast('Error updating wishlist')
    }
  }

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-blue-600 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-lg cursor-pointer shrink-0" onClick={() => navigate('/pharmacy')}>
            <HeartPulse size={22} /> MediConnect
          </div>
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              placeholder="Search medicines, health products..."
              className="w-full pl-9 pr-4 py-2 rounded-lg text-gray-900 dark:text-gray-100 text-sm focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button onClick={() => navigate('/pharmacy/wishlist')} className="relative hidden sm:flex items-center gap-1 text-sm hover:text-blue-200 text-white">
              <Heart size={20} />
              {wishlistIds.length > 0 && <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{wishlistIds.length}</span>}
            </button>
            <button onClick={() => navigate('/pharmacy/cart')} className="relative">
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar Filters */}
        <aside className="w-56 shrink-0 hidden lg:block space-y-5">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
            <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><SlidersHorizontal size={15} /> Filters</p>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Category</p>
              {CATEGORIES.map(c => (
                <button key={c.key} onClick={() => setFilter('category', c.key)}
                  className={`block w-full text-left text-sm px-2 py-1.5 rounded-lg mb-0.5 transition-colors ${filters.category === c.key ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}>
                  {c.label}
                </button>
              ))}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Price Range</p>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <input type="number" placeholder="Max" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Prescription</p>
              {[{ val: '', label: 'All' }, { val: 'false', label: 'OTC Only' }, { val: 'true', label: 'Rx Required' }].map(o => (
                <button key={o.val} onClick={() => setFilter('requiresPrescription', o.val)}
                  className={`block w-full text-left text-sm px-2 py-1.5 rounded-lg mb-0.5 transition-colors ${filters.requiresPrescription === o.val ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}>
                  {o.label}
                </button>
              ))}
            </div>

            <button onClick={() => setFilters({ category: '', search: '', minPrice: '', maxPrice: '', requiresPrescription: '', sort: 'newest' })}
              className="w-full text-xs text-red-500 hover:text-red-700 flex items-center gap-1 justify-center pt-1">
              <X size={12} /> Clear Filters
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{products.length} products found</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center gap-1 text-sm border rounded-lg px-3 py-1.5">
                <SlidersHorizontal size={14} /> Filters
              </button>
              <select value={filters.sort} onChange={e => setFilter('sort', e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setFilter('category', c.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filters.category === c.key ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-400'}`}>
                {c.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border h-64 animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400 dark:text-gray-500">
              <Pill size={40} className="mx-auto mb-3 text-gray-200" />
              <p>No products found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => (
                <ProductCard key={p._id} product={p} onAddToCart={handleAddToCart} wishlistIds={wishlistIds} onToggleWishlist={handleToggleWishlist} />
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg z-50">{toast}</div>
      )}
    </div>
  )
}

export default ProductListing
