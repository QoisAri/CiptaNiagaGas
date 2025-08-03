import { redirect } from 'next/navigation'

// Komponen ini akan mengarahkan pengguna dari "/" ke "/dashboard"
export default function HomePage() {
  redirect('/dashboard');
}