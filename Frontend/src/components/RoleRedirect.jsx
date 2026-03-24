import { Navigate } from 'react-router-dom'

const RoleRedirect = () => {
  const role = localStorage.getItem('mediconnect_role')
  return <Navigate to={role === 'doctor' ? '/doctor-dashboard' : '/home'} replace />
}

export default RoleRedirect
