'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Tipe data universal untuk state form
export type FormState = { 
  message: string; 
  success: boolean; 
  error?: boolean; 
};


// =================================================================
// FUNGSI UNTUK AUTENTIKASI PENGGUNA
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
  return redirect('/');
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
  return redirect('/login?message=Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.');
}


// =================================================================
// FUNGSI UNTUK MENAMBAH DATA MASTER (HEAD, CASIS, STORAGE)
// =================================================================

export async function addHead(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = createClient();
  const headCode = formData.get('head_code') as string;
  const type = formData.get('type') as string;
  const feet = formData.get('feet') as string;

  if (!headCode || !type || !feet) {
    return { message: 'Semua field wajib diisi.', success: false, error: true };
  }

  const { error } = await supabase.from('heads').insert({
    head_code: headCode,
    type: type,
    feet: Number(feet),
  });

  if (error) {
    return { message: `Gagal menyimpan Head: ${error.message}`, success: false, error: true };
  }
  revalidatePath('/head');
  return { message: 'Head baru berhasil ditambahkan!', success: true };
}

export async function addCasis(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = createClient();
  const casisCode = formData.get('casis_code') as string;
  const type = formData.get('type') as string;
  const feet = formData.get('feet') as string;

  if (!casisCode || !type || !feet) {
    return { message: 'Semua field wajib diisi.', success: false, error: true };
  }

  const { error } = await supabase.from('chassis').insert({
    chassis_code: casisCode,
    type: type,
    feet: Number(feet),
  });

  if (error) {
    return { message: `Gagal menyimpan Casis: ${error.message}`, success: false, error: true };
  }
  revalidatePath('/casis');
  return { message: 'Casis baru berhasil ditambahkan!', success: true };
}

export async function addStorage(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = createClient();
  const storageCode = formData.get('storage_code') as string;
  const type = formData.get('type') as string;

  if (!storageCode || !type) {
    return { message: 'Semua field wajib diisi.', success: false, error: true };
  }

  const { error } = await supabase.from('storages').insert({
    storage_code: storageCode,
    type: type,
  });

  if (error) {
    return { message: `Gagal menyimpan Storage: ${error.message}`, success: false, error: true };
  }
  revalidatePath('/storage');
  return { message: 'Storage baru berhasil ditambahkan!', success: true };
}


// =================================================================
// FUNGSI UNTUK MANAJEMEN INSPEKSI
// =================================================================

/**
 * Aksi untuk MENGHAPUS seluruh record inspeksi (bisa untuk Head, Casis, Storage).
 */
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

/**
 * Aksi untuk MEMBUAT atau MENGUPDATE satu baris hasil inspeksi.
 */
export async function upsertInspectionResult(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = createClient();

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