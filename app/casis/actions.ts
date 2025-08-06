'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Tipe data untuk response form
export type FormState = { message: string; success: boolean, error?: boolean };


// =================================================================
// FUNGSI UNTUK AUTENTIKASI
// =================================================================
export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return redirect('/login?message=Email atau password salah.');
  return redirect('/');
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirm_password') as string;
  const supabase = await createClient();

  if (password !== confirmPassword) return redirect('/signup?message=Password tidak cocok.');

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return redirect('/signup?message=Gagal membuat akun.');
  return redirect('/login?message=Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.');
}


// =================================================================
// FUNGSI UNTUK CASIS
// =================================================================

/**
 * Aksi untuk MENAMBAHKAN data master Casis baru.
 */
export async function addCasis(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();

  const casisCode = formData.get('casis_code') as string;
  const type = formData.get('type') as string;
  const feet = formData.get('feet') as string;

  if (!casisCode || !type || !feet) {
    return { message: 'Semua field wajib diisi.', success: false, error: true };
  }

  // Asumsi nama kolom di tabel 'chassis' adalah 'chassis_code', 'type', dan 'feet'
  const { error } = await supabase
    .from('chassis')
    .insert({
      chassis_code: casisCode,
      type: type,
      feet: Number(feet),
    });

  if (error) {
    console.error('Add Casis Error:', error);
    return { message: `Gagal menyimpan: ${error.message}`, success: false, error: true };
  }

  revalidatePath('/casis');
  return { message: 'Casis baru berhasil ditambahkan!', success: true };
}

// =================================================================
// FUNGSI UMUM (Bisa untuk Head, Casis, dll)
// =================================================================

/**
 * Aksi untuk MENGHAPUS seluruh record inspeksi.
 */
export async function deleteInspection(formData: FormData) {
  const inspectionId = formData.get('inspectionId') as string;
  const redirectTo = formData.get('redirectTo') as string; // Path untuk redirect

  if (!inspectionId || !redirectTo) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('inspections')
    .delete()
    .eq('id', inspectionId);

  if (error) {
    console.error('Delete Inspection Error:', error);
    return;
  }

  // Revalidate dan redirect ke halaman yang benar (misal: '/head' atau '/casis')
  revalidatePath(redirectTo);
  redirect(redirectTo);
}

/**
 * Aksi untuk MEMBUAT atau MENGUPDATE satu baris hasil inspeksi.
 */
export async function upsertInspectionResult(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();

  const data = {
    resultId: formData.get('resultId') as string,
    inspectionId: formData.get('inspectionId') as string,
    itemId: formData.get('itemId') as string,
    kondisi: formData.get('kondisi') as string,
    keterangan: formData.get('keterangan') as string,
    pathname: formData.get('pathname') as string,
  };

  if (!data.kondisi || !data.itemId || !data.inspectionId) {
    return { message: 'Data tidak lengkap.', success: false };
  }

  if (data.resultId && data.resultId !== 'undefined' && data.resultId !== 'null') {
    // UPDATE
    const { error } = await supabase
      .from('inspection_results')
      .update({ kondisi: data.kondisi, keterangan: data.keterangan })
      .eq('id', data.resultId);
    if (error) return { message: `Gagal mengupdate: ${error.message}`, success: false };
  } else {
    // INSERT
    const { error } = await supabase.from('inspection_results').insert({
      inspection_id: data.inspectionId,
      item_id: data.itemId,
      kondisi: data.kondisi,
      keterangan: data.keterangan,
    });
    if (error) return { message: `Gagal menyimpan: ${error.message}`, success: false };
  }

  revalidatePath(data.pathname);
  return { message: 'Data berhasil disimpan!', success: true };
}

// Tambahkan fungsi lain seperti addHead dan addStorage di sini jika Anda membutuhkannya juga.
export async function getRecapData(period: 'daily' | 'weekly' | 'monthly' | 'yearly') {
  const supabase = await createClient();
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      startDate = new Date(now.setDate(now.getDate() - now.getDay()));
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      throw new Error('Invalid period specified');
  }

  const { data, error } = await supabase
    .from('inspections')
    .select(`
      id,
      tanggal,
      chassis ( chassis_code ),
      heads ( head_code ),
      storages ( storage_code ),
      inspection_results (
        kondisi,
        keterangan,
        inspection_items ( name, standard )
      )
    `)
    .gte('tanggal', startDate.toISOString());

  if (error) {
    console.error('Error fetching recap data:', error);
    return [];
  }

  // Format data agar sesuai dengan yang dibutuhkan komponen Excel
  const formattedData = data.flatMap(inspection => {
    // FIX: Akses elemen pertama [0] dari array relasi
    const assetCode = 
      inspection.chassis[0]?.chassis_code || 
      inspection.heads[0]?.head_code || 
      inspection.storages[0]?.storage_code || 
      'N/A';
      
    return inspection.inspection_results.map(result => {
        // FIX: Akses elemen pertama [0] dari array relasi
        const itemDetails = Array.isArray(result.inspection_items) 
            ? result.inspection_items[0] 
            : result.inspection_items;

        return {
            'Kode Aset': assetCode,
            'Tanggal Inspeksi': new Date(inspection.tanggal).toLocaleDateString('id-ID'),
            'Item Diperiksa': itemDetails?.name || 'N/A',
            'Standard': itemDetails?.standard || '-',
            'Kondisi': result.kondisi,
            'Keterangan': result.keterangan,
        };
    });
  });

  return formattedData;
}