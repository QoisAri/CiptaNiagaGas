'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error.message);
    return redirect('/login?message=Email atau password salah.')
  }

  return redirect('/')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string
  const supabase = createClient()

  // PERUBAHAN: Tambahkan validasi password
  if (password !== confirmPassword) {
    return redirect('/signup?message=Password tidak cocok.')
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error('Signup error:', error.message);
    return redirect('/signup?message=Gagal membuat akun.')
  }

  return redirect('/login?message=Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.')
}