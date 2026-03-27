import { SignUp } from '@clerk/clerk-react'
import { useTheme } from 'next-themes'

const Signup = () => {
  const { theme } = useTheme()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <SignUp
        routing="path"
        path="/signup"
        signInUrl="/login"
        fallbackRedirectUrl="/redirect"
        signUpForceRedirectUrl="/redirect"
        appearance={isDark ? {
          variables: {
            colorBackground: '#1f2937',
            colorInputBackground: '#374151',
            colorInputText: '#f9fafb',
            colorText: '#f9fafb',
            colorTextSecondary: '#9ca3af',
            colorPrimary: '#3b82f6',
            colorNeutral: '#6b7280',
          },
          elements: {
            card: 'bg-gray-800 shadow-xl border border-gray-700',
            headerTitle: 'text-gray-100',
            headerSubtitle: 'text-gray-400',
            socialButtonsBlockButton: 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600',
            dividerLine: 'bg-gray-600',
            dividerText: 'text-gray-400',
            formFieldLabel: 'text-gray-300',
            formFieldInput: 'bg-gray-700 border-gray-600 text-gray-100',
            footerActionLink: 'text-blue-400',
            identityPreviewText: 'text-gray-300',
            identityPreviewEditButton: 'text-blue-400',
          }
        } : undefined}
      />
    </div>
  )
}

export default Signup
