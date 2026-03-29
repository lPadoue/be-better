import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--font-serif', style: ['normal', 'italic'] })

export const metadata: Metadata = {
  title: 'Be Better',
  description: 'Rappels personnels pour devenir meilleur',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${dmSerif.variable}`}>
      <body className="font-[family-name:var(--font-sans)] bg-[#0D0B09] text-[#F2EAE0] min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
