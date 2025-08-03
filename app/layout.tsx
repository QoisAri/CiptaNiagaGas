import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/layout/Sidebar' // Pastikan path ini benar
import { AuthProvider } from '../app/context/AuthContext'
import { SelectionProvider } from '../app/context/SelectionContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CNG Project Admin',
  description: 'Admin dashboard for CNG Project',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SelectionProvider>
            <div className="flex h-screen bg-gray-100">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>
          </SelectionProvider>
        </AuthProvider>
      </body>
    </html>
  )
}