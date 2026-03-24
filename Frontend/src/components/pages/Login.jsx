import { SignIn } from '@clerk/clerk-react'

const Login = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
    <SignIn routing="path" path="/login" signUpUrl="/signup" forceRedirectUrl="/redirect" />
  </div>
)

export default Login
