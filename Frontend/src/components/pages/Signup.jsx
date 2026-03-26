import { SignUp } from '@clerk/clerk-react'

const Signup = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
    <SignUp routing="path" path="/signup" signInUrl="/login" forceRedirectUrl="/redirect" />
  </div>
)

export default Signup
