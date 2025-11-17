'use client' // Wajib 'use client' untuk hook

import Link from 'next/link'
import { login } from '@/app/actions'
import { useFormState } from 'react-dom'
import { useEffect, useState } from 'react'
import type { FormState } from '@/app/actions' // Import tipe state kamu

// State awal form, cocok dengan tipe FormState
const initialState: FormState = {
  message: '',
  success: false,
  error: false,
}

export default function LoginPage() {
  // Hubungkan form dengan action 'login' dan state awal
  const [state, formAction] = useFormState(login, initialState)
  const [showPopup, setShowPopup] = useState(false)

  // 'useEffect' ini akan memantau 'state' dari server action
  useEffect(() => {
    // Jika 'state' memiliki properti 'error: true'
    if (state.error) {
      setShowPopup(true) // Tampilkan pop-up
      // Hilangkan pop-up setelah 3 detik
      const timer = setTimeout(() => setShowPopup(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [state]) // Jalankan effect ini setiap kali 'state' berubah

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100">
      
      {/* --- POP UP ERROR (Toast) --- */}
      {/* Muncul jika showPopup === true */}
      {showPopup && (
        <div className="absolute top-5 right-5 z-[60] animate-bounce"> 
          <div className="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 border border-red-300 shadow-lg" role="alert">
            <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
            </svg>
            <span className="sr-only">Info</span>
            <div>
              {/* Tampilkan pesan error dari 'state' */}
              <span className="font-medium">Login Gagal!</span> {state.message}
            </div>
            <button onClick={() => setShowPopup(false)} className="ml-4 text-red-500 hover:text-red-700 font-bold">✕</button>
          </div>
        </div>
      )}
      {/* --- END POP UP --- */}

      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md relative">
        <h2 className="text-2xl font-bold text-center text-gray-800">Admin Login</h2>
        
        {/* Ganti <form action={login}> menjadi <form action={formAction}> */}
        <form className="space-y-6" action={formAction}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              // Beri border merah jika state.error === true
              className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black ${state.error ? 'border-red-500 ring-red-500' : 'border-gray-300'}`} 
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              // Beri border merah jika state.error === true
              className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black ${state.error ? 'border-red-500 ring-red-500' : 'border-gray-300'}`} 
            />
          </div>
          <button type="submit" className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              Sign In
          </button>
          <p className="text-center text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              Daftar di sini
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}