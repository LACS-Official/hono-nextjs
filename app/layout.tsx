
import '../styles/globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from "@/components/ui/toaster"

export const metadata = {
  title: 'LACS API Server',
  description: 'API server with Neon Postgres, activation codes and software management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            @media (forced-colors: active) {
              * {
                forced-color-adjust: auto;
              }
            }
          `
        }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
