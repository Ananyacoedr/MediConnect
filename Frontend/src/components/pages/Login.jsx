import { SignIn } from '@clerk/clerk-react'
import { useTheme } from 'next-themes'

const darkAppearance = {
  variables: {
    colorBackground: '#1f2937',
    colorInputBackground: '#374151',
    colorInputText: '#f9fafb',
    colorText: '#f9fafb',
    colorTextSecondary: '#9ca3af',
    colorPrimary: '#3b82f6',
    colorNeutral: '#9ca3af',
    colorTextOnPrimaryBackground: '#ffffff',
  },
}

const Login = () => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/signup"
        forceRedirectUrl="/redirect"
        appearance={isDark ? darkAppearance : undefined}
      />
    </div>
  )
}

export default Login
