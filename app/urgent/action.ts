// /app/urgent-fix/actions.ts

'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteProblemReport(formData: FormData) {
  const reportId = formData.get('reportId') as string;

  if (!reportId) {
    console.error('Gagal menghapus: ID laporan tidak ditemukan.');
    return;
  }

  const supabase = createClient();
  
  // RLS Check: Pastikan Anda memiliki policy yang mengizinkan operasi DELETE
  // pada tabel 'problem_reports' untuk pengguna yang terautentikasi.
  const { error } = await supabase
    .from('problem_reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    console.error('Error deleting problem report:', error);
    // Jika Anda mendapat error di sini, kemungkinan besar karena RLS Policy.
    return; 
  }

  // Sesuaikan path ini dengan URL halaman urgent fix Anda
  revalidatePath('/urgent'); 
}