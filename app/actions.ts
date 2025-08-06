// app/actions.ts

'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type FormState = { 
  message: string; 
  success: boolean; 
  error?: boolean; 
};

// =================================================================
// FUNGSI AUTENTIKASI
// =================================================================

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Login Error:', error.message);
    return redirect('/login?message=Email atau password salah.');
  }
  return redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirm_password') as string;
  const supabase = createClient();

  if (password !== confirmPassword) {
    return redirect('/signup?message=Password tidak cocok.');
  }

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    console.error('Signup Error:', error.message);
    return redirect('/signup?message=Gagal membuat akun.');
  }
  return redirect('/dashboard');
}


// =================================================================
// FUNGSI UMUM LAINNYA
// =================================================================

export async function deleteInspection(formData: FormData) {
  const inspectionId = formData.get('inspectionId') as string;
  const redirectTo = formData.get('redirectTo') as string;

  if (!inspectionId || !redirectTo) return;

  const supabase = createClient();
  const { error } = await supabase.from('inspections').delete().eq('id', inspectionId);

  if (error) {
    console.error('Delete Inspection Error:', error);
    return;
  }
  revalidatePath(redirectTo);
  redirect(redirectTo);
}