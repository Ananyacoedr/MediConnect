import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthenticateWithRedirectCallback, useAuth } from '@clerk/clerk-react'
import { Component } from 'react'

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-lg w-full space-y-3">
          <p className="font-bold text-red-600 text-lg">Something went wrong</p>
          <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-auto max-h-48">{this.state.error?.message}</pre>
          <button onClick={() => { this.setState({ error: null }); window.location.href = '/' }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Go Home</button>
        </div>
      </div>
    )
    return this.props.children
  }
}
import Landing from './components/pages/Landing'
import Login from './components/pages/Login'
import Signup from './components/pages/Signup'
import Home from './components/Home'
import DoctorDashboard from './components/pages/DoctorDashboard'
import PatientDashboard from './components/pages/PatientDashboard'
import AllAppointments from './components/pages/AllAppointments'
import DoctorProfile from './components/pages/DoctorProfile'
import ConsultationPage from './components/pages/ConsultationPage'
import StartConsultation from './components/pages/StartConsultation'
import FindDoctors from './components/pages/FindDoctors'
import DoctorPublicProfile from './components/pages/DoctorPublicProfile'
import RoleRedirect from './components/RoleRedirect'
import PharmacyHome from './components/pages/PharmacyHome'
import ProductListing from './components/pages/ProductListing'
import ProductDetail from './components/pages/ProductDetail'
import PharmacyCart from './components/pages/PharmacyCart'
import MyOrders from './components/pages/MyOrders'
import WishlistPage from './components/pages/WishlistPage'
import AdminPanel from './components/pages/AdminPanel'
import DirectCall from './components/pages/DirectCall'
import AnswerCall from './components/pages/AnswerCall'
import PatientConsultation from './components/pages/PatientConsultation'
import VideoCall from './components/pages/VideoCall'

const ProtectedRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!isSignedIn) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/redirect" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
      <Route path="/login/sso-callback" element={<AuthenticateWithRedirectCallback fallbackRedirectUrl="/redirect" />} />
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/doctor-dashboard" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/patient-dashboard" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient-appointments" element={<ProtectedRoute><AllAppointments /></ProtectedRoute>} />
      <Route path="/doctor-profile" element={<ProtectedRoute><DoctorProfile /></ProtectedRoute>} />
      <Route path="/consultation/:id" element={<ProtectedRoute><ConsultationPage /></ProtectedRoute>} />
      <Route path="/start-consultation" element={<ProtectedRoute><StartConsultation /></ProtectedRoute>} />
      <Route path="/find-doctors" element={<FindDoctors />} />
      <Route path="/doctor/:id" element={<DoctorPublicProfile />} />
      <Route path="/pharmacy" element={<PharmacyHome />} />
      <Route path="/pharmacy/products" element={<ProductListing />} />
      <Route path="/pharmacy/product/:id" element={<ProductDetail />} />
      <Route path="/pharmacy/cart" element={<PharmacyCart />} />
      <Route path="/pharmacy/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
      <Route path="/pharmacy/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
      <Route path="/pharmacy/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
      <Route path="/call/:doctorId" element={<ProtectedRoute><DirectCall /></ProtectedRoute>} />
      <Route path="/answer/:roomId" element={<ProtectedRoute><AnswerCall /></ProtectedRoute>} />
      <Route path="/patient-consultation/:id" element={<ProtectedRoute><PatientConsultation /></ProtectedRoute>} />
      <Route path="/video/:roomID" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
    </Routes>
    </ErrorBoundary>
  )
}

export default App
