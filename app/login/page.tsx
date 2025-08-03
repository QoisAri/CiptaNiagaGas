import Link from 'next/link'
import { login } from '@/app/actions'

export default function LoginPage() {
  return (
    // PERBAIKAN: Menggunakan 'fixed' dan 'z-50' untuk memaksa tampil di lapisan paling atas
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100">
      
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">Admin Login</h2>
        <form className="space-y-6" action={login}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input id="email" name="email" type="email" required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input id="password" name="password" type="password" required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black" />
          </div>
          <button type="submit" className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
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