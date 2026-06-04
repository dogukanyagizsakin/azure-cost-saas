import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from 'next-themes'
import './globals.css'


const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UnifyTech Azure Cost Pilot',
  description: 'Azure maliyet yönetim ve optimizasyon platformu',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#13131e',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e8e6f0',
            fontSize: '14px',
          },
        }}
        richColors
      />
    </ThemeProvider>
</body>
    </html>
  )
}