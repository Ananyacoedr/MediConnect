import { SignUp } from '@clerk/clerk-react'
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

const Signup = () => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="w-full flex flex-col items-center gap-3 px-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 max-w-sm w-full text-center">
          💡 Password must be at least <strong>8 characters</strong> with a mix of letters and numbers.
        </div>
        <SignUp
          routing="path"
          path="/signup"
          signInUrl="/login"
          fallbackRedirectUrl="/redirect"
          signUpForceRedirectUrl="/redirect"
          appearance={isDark ? darkAppearance : undefined}
        />
      </div>
    </div>
  )
}

export default Signup
