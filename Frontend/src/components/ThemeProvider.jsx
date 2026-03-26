import { ThemeProvider as NextThemesProvider } from 'next-themes'

export const ThemeProvider = ({ children }) => (
  <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
    {children}
  </NextThemesProvider>
)
