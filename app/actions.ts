'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Tipe state ini sudah benar, kita akan gunakan
export type FormState = { 
  message: string; 
  success: boolean; 
  error?: boolean; 
};
// --- AWAL PERUBAHAN UNTUK MENANGANI LOGIN DENGAN STATE ---
export async function login(prevState: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('Login Error:', error.message);
    // 2. JANGAN REDIRECT. Kembalikan state error.
    // Pop-up akan membaca 'message' ini.
    return { 
      message: 'Email atau password salah.', 
      success: false, 
      error: true 
    };
  }

  // 3. Jika SUKSES, baru redirect ke dashboard
  revalidatePath('/dashboard'); // Bersihkan cache
  return redirect('/dashboard');
}
// --- AKHIR PERUBAHAN ---


export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirm_password') as string;
  const supabase = createClient();

  if (password !== confirmPassword) {
    // Kita bisa juga mengubah ini menggunakan FormState, tapi untuk sekarang biarkan dulu
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