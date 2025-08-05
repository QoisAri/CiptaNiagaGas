// app/storage/actions.ts (atau path file actions Anda)

'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import ExcelJS from 'exceljs';
import { headers } from 'next/headers';


// =================================================================
// TIPE DATA UNIVERSAL
// =================================================================

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


// =================================================================
// FUNGSI UNTUK MEMBUAT LAPORAN EXCEL
// =================================================================

type StorageData = {
  id: string;
  tanggal: string | null;
  storage_code: string | null;
  feet: number | null;
  pemeriksa: string | null;
  kondisi: string | null;
  keterangan: string | null;
  item_name: string | null;
  tgl_perbaikan: string | null;
  tindakan: string | null;
};

export async function generateStorageReport(reportType: 'checked' | 'problematic' | 'maintained') {
  const supabase = createClient();
  let reportData: StorageData[] = [];
  let fileName = `laporan-storage-${reportType}.xlsx`;

  // Ambil semua data master yang dibutuhkan
  const { data: allStorages } = await supabase.from('storages').select('*');
  const { data: allInspections } = await supabase.from('inspections').select('*, profiles(name)');
  const { data: allResults } = await supabase.from('inspection_results').select('*, inspection_items(name)');
  const { data: allMaintenance } = await supabase.from('maintenance_records').select('*');
  const { data: allItems } = await supabase.from('inspection_items').select('*');


  if (!allStorages) {
    return { error: 'Gagal mengambil data master storage.' };
  }

  // --- Logika yang sudah bekerja untuk 2 laporan pertama ---
  if (reportType === 'checked') {
    reportData = allStorages.map(storage => {
      const inspection = allInspections?.find(insp => insp.storage_id === storage.id);
      return {
        id: storage.id,
        storage_code: storage.storage_code,
        feet: storage.feet,
        kondisi: inspection ? 'Sudah Dicek' : 'Belum Dicek',
        tanggal: inspection?.tanggal || null,
        pemeriksa: (inspection as any)?.profiles?.name || null,
        keterangan: null, item_name: null, tgl_perbaikan: null, tindakan: null
      };
    });
  } 
  else if (reportType === 'problematic') {
    const problematicResults = allResults?.filter(res => res.kondisi === 'tidak_baik');
    if (!problematicResults) return { error: 'Tidak ada data bermasalah.' };
    
    problematicResults.forEach(result => {
      const inspection = allInspections?.find(insp => insp.id === result.inspection_id);
      if (inspection && inspection.storage_id) {
        const storage = allStorages?.find(s => s.id === inspection.storage_id);
        if (storage) {
          reportData.push({
            id: storage.id,
            storage_code: storage.storage_code,
            feet: storage.feet,
            kondisi: result.kondisi,
            keterangan: result.keterangan,
            item_name: (result as any).inspection_items?.name || 'Item tidak diketahui',
            tanggal: inspection.tanggal,
            pemeriksa: (inspection as any)?.profiles?.name || null,
            tgl_perbaikan: null, tindakan: null
          });
        }
      }
    });
  } 
  // --- PERBAIKAN UTAMA HANYA DI SINI ---
  else if (reportType === 'maintained') {
    if (!allMaintenance || allMaintenance.length === 0) {
      return { error: 'Tidak ada data perbaikan untuk dilaporkan.' };
    }

    allMaintenance.forEach(maintenance => {
      // Alur: maintenance -> result -> inspection -> storage
      const result = allResults?.find(res => res.id === maintenance.inspection_result_id);
      if (result) {
        const inspection = allInspections?.find(insp => insp.id === result.inspection_id);
        if (inspection && inspection.storage_id) {
          const storage = allStorages?.find(s => s.id === inspection.storage_id);
          const item = allItems?.find(it => it.id === result.item_id);
          if (storage) {
            reportData.push({
              id: storage.id,
              storage_code: storage.storage_code,
              feet: storage.feet,
              tgl_perbaikan: maintenance.repaired_at,
              tindakan: maintenance.notes,
              item_name: item?.name || 'Item tidak diketahui',
              tanggal: inspection.tanggal, // Tanggal inspeksi awal
              pemeriksa: (inspection as any)?.profiles?.name || null, // Pemeriksa inspeksi awal
              kondisi: null, keterangan: null
            });
          }
        }
      }
    });
  }
  
  if (reportData.length === 0) {
    return { error: 'Tidak ada data untuk dilaporkan.' };
  }

  // --- Kode pembuatan Excel tidak berubah ---
  const groupedByFeet: Record<string, StorageData[]> = reportData.reduce((acc, item) => {
    const feet = item.feet ? `${item.feet} Feet` : 'Ukuran Tidak Diketahui';
    if (!acc[feet]) acc[feet] = [];
    acc[feet].push(item);
    return acc;
  }, {} as Record<string, StorageData[]>);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CNG Application';
  workbook.created = new Date();

  const baseHeaders = [
    { header: 'No.', key: 'no', width: 5 },
    { header: 'Storage Code', key: 'storage_code', width: 20 },
    { header: 'Pemeriksa', key: 'pemeriksa', width: 25 },
    { header: 'Tanggal Inspeksi', key: 'tanggal', width: 20 },
  ];
  
  let headersConfig = [...baseHeaders];
  if (reportType === 'checked') {
    headersConfig.push({ header: 'Status Pengecekan', key: 'kondisi', width: 25 });
  } else if (reportType === 'problematic') {
    headersConfig.push(
      { header: 'Nama Item', key: 'item_name', width: 30 },
      { header: 'Kondisi', key: 'kondisi', width: 15 },
      { header: 'Keterangan', key: 'keterangan', width: 40 }
    );
  } else if (reportType === 'maintained') {
     headersConfig.push(
      { header: 'Nama Item Bermasalah', key: 'item_name', width: 30 },
      { header: 'Tanggal Perbaikan', key: 'tgl_perbaikan', width: 25 },
      { header: 'Tindakan Perbaikan', key: 'tindakan', width: 40 }
    );
  }
  
  for (const feetGroup in groupedByFeet) {
    const worksheet = workbook.addWorksheet(feetGroup);
    worksheet.columns = headersConfig;
    
    groupedByFeet[feetGroup].forEach((item, index) => {
      worksheet.addRow({
        no: index + 1,
        storage_code: item.storage_code,
        pemeriksa: item.pemeriksa,
        tanggal: item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '',
        kondisi: reportType === 'checked' ? (item.kondisi || 'Belum Dicek') : item.kondisi,
        item_name: item.item_name,
        keterangan: item.keterangan,
        tgl_perbaikan: item.tgl_perbaikan ? new Date(item.tgl_perbaikan).toLocaleDateString('id-ID') : '',
        tindakan: item.tindakan,
      });
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
      };
    });
  }
  
  const buffer = await workbook.xlsx.writeBuffer();
  return { file: Buffer.from(buffer).toString('base64') };
}