// /app/maintenance/actions.ts

'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteMaintenanceRecord(formData: FormData) {
  const recordId = formData.get('maintenanceId') as string;

  if (!recordId) {
    console.error('Gagal menghapus: ID catatan maintenance tidak ada.');
    // Cukup hentikan fungsi, jangan kembalikan objek error
    return;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('maintenance_records')
    .delete()
    .eq('id', recordId);

  if (error) {
    console.error('Error saat menghapus catatan maintenance:', error);
    // Cukup hentikan fungsi, jangan kembalikan objek error
    return;
  }

  // Baris ini yang paling penting, ia akan memicu pengambilan data ulang di halaman
  revalidatePath('/record-maintenance'); // <-- Sesuaikan path ini jika perlu

  // Tidak ada `return` di akhir, fungsi akan secara otomatis mengembalikan `void`
}