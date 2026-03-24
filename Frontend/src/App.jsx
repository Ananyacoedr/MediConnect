import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import Landing from './components/pages/Landing'
import Login from './components/pages/Login'
import Signup from './components/pages/Signup'
import Home from './components/Home'
import DoctorDashboard from './components/pages/DoctorDashboard'
import RoleRedirect from './components/RoleRedirect'

const ProtectedRoute = ({ children }) => (
  <>
    <SignedIn>{children}</SignedIn>
    <SignedOut><Navigate to="/login" replace /></SignedOut>
  </>
)

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/redirect" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
      <Route path="/login/sso-callback" element={<AuthenticateWithRedirectCallback afterSignInUrl="/redirect" afterSignUpUrl="/redirect" />} />
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/doctor-dashboard" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
