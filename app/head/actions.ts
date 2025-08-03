'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type FormState = { message: string; success: boolean; error?: boolean };

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
    const { error } = await supabase
      .from('inspection_results')
      .update({ kondisi: data.kondisi, keterangan: data.keterangan })
      .eq('id', data.resultId);
    if (error) return { message: `Gagal mengupdate: ${error.message}`, success: false };
  } else {
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

export async function deleteInspection(formData: FormData) {
  const inspectionId = formData.get('inspectionId') as string;
  if (!inspectionId) {
    return;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('inspections')
    .delete()
    .eq('id', inspectionId);

  if (error) {
    console.error('Delete Inspection Error:', error);
    return;
  }

  revalidatePath('/head');
  redirect('/head');
}
export async function addHead(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = createClient();
  // PERBAIKAN: Menghapus variabel 'user' dan 'userError' yang tidak terpakai
  // const { data: { user }, error: userError } = await supabase.auth.getUser();
  const headCode = formData.get('head_code') as string;
  const type = formData.get('type') as string;
  const feet = formData.get('feet') as string;

  if (!headCode || !type || !feet) {
    return { message: 'Semua field wajib diisi.', success: false, error: true };
  }

  const { error } = await supabase
    .from('heads')
    .insert({
      head_code: headCode,
      type: type,
      feet: Number(feet),
    });

  if (error) {
    console.error('Add Head Error:', error);
    return { message: `Gagal menyimpan: ${error.message}`, success: false, error: true };
  }

  revalidatePath('/head');
  return { message: 'Head baru berhasil ditambahkan!', success: true };
}
