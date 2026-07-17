import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Sora, Inter, Geist_Mono } from 'next/font/google'
import { AppProvider } from '@/components/app-provider'
import './globals.css'

const sora = Sora({ subsets: ['latin'], variable: '--font-sora' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Tropy Games — Football Tips & Match Analytics',
  description:
    'Data-driven football tips and match analytics. Free and VIP predictions derived from scoring averages, BTTS, over/under and head-to-head statistics.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0B0F1A',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${geistMono.variable} bg-[#0B0F1A]`}
    >
      <body className="font-sans antialiased">
        <AppProvider>{children}</AppProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
