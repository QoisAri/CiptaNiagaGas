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
// FUNGSI UMUM
// =================================================================

/**
 * Aksi untuk MENGHAPUS seluruh record inspeksi.
 * Digunakan di halaman detail Casis, Storage, dan Head.
 */
export async function deleteInspection(formData: FormData) {
  const inspectionId = formData.get('inspectionId') as string;
  const redirectTo = formData.get('redirectTo') as string;

  if (!inspectionId || !redirectTo) {
    console.error("Inspection ID or redirect path is missing.");
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.from('inspections').delete().eq('id', inspectionId);

  if (error) {
    console.error('Delete Inspection Error:', error);
    return;
  }
  revalidatePath(redirectTo);
  redirect(redirectTo);
}

// Anda bisa menambahkan fungsi umum lainnya di sini di masa depan,
// seperti addCasis, addHead, login, signup, dll.