// /app/maintenance/actions.ts

'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import ExcelJS, { type Column, type Cell } from 'exceljs';
import { type MaintenanceItem } from './page'

type ReportRow = {
  tglDitemukan: string;
  kodeAset: string;
  tipeFeetDisplay: string | null;
  deskripsiMasalah: string;
  tglSelesai: string;
  keterangan: string;
};
export async function generateMaintenanceReport(data: ReportRow[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CNG Application';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Maintenance Report');

  // Definisikan header untuk Excel
  worksheet.columns = [
    { header: 'Tgl Ditemukan', key: 'tglDitemukan' },
    { header: 'Tipe Aset', key: 'assetType' },
    { header: 'Kode Aset', key: 'kodeAset' },
    { header: 'Ukuran Feet', key: 'tipeFeetDisplay' },
    { header: 'Deskripsi Masalah', key: 'deskripsiMasalah' },
    { header: 'Tgl Selesai', key: 'tglSelesai' },
    { header: 'Keterangan', key: 'keterangan' },
  ];

  // Tambahkan data ke worksheet
  worksheet.addRows(data);

  // Style untuk header
  worksheet.getRow(1).eachCell((cell: Cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E2E2' },
    };
    cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };
  });

  // ==========================================================
  // ## LOGIKA AUTOFIT YANG DISEMPURNAKAN ADA DI SINI ##
  // ==========================================================
  worksheet.columns.forEach((column: Partial<Column>) => {
    let maxTextLength = 0;
    // Inisialisasi panjang maksimal dengan panjang header
    if (column.header) {
      maxTextLength = column.header.length;
    }
    
    // Periksa setiap sel di kolom untuk menemukan teks terpanjang
    column.eachCell!({ includeEmpty: true }, (cell: Cell) => {
      const textLength = cell.value ? cell.value.toString().length : 0;
      if (textLength > maxTextLength) {
        maxTextLength = textLength;
      }
    });
    // Atur lebar kolom berdasarkan teks terpanjang + beri sedikit padding
    column.width = maxTextLength + 4;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `rekapan_maintenance_${new Date().toISOString().split('T')[0]}.xlsx`;

  return { file: Buffer.from(buffer).toString('base64'), fileName: fileName };
}


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