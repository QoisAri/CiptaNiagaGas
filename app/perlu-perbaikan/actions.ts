// /app/perlu-perbaikan/actions.ts

'use server';

import ExcelJS, { type Column, type Cell } from 'exceljs';
import { type PendingRepairItem } from './page';

export async function generatePendingRepairReport(data: PendingRepairItem[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CNG Application';
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet('Laporan Perlu Perbaikan');

  // Kelompokkan masalah berdasarkan kode aset
  const groupedByAsset: { [key: string]: any } = data.reduce((acc, item) => {
    if (!acc[item.kodeAset]) {
      acc[item.kodeAset] = {
        tanggalDitemukan: item.tanggalDitemukan,
        tipeAset: item.tipeAset,
        kodeAset: item.kodeAset,
        // tipeFeetDisplay dihapus dari sini karena tidak akan digunakan
        pelapor: item.pelapor,
        problems: {},
      };
    }
    acc[item.kodeAset].problems[item.itemBermasalah] = item.keterangan;
    return acc;
  }, {} as { [key: string]: any });

  const allProblemItems = [...new Set(data.map(item => item.itemBermasalah))];

  // ## 1. HAPUS 'Ukuran' DARI DEFINISI HEADER ##
  const baseHeaders = [
    { header: 'Tgl Ditemukan', key: 'tanggalDitemukan' },
    { header: 'Tipe Aset', key: 'tipeAset' },
    { header: 'Kode Aset', key: 'kodeAset' },
    { header: 'Pelapor', key: 'pelapor' },
  ];
  const problemHeaders = allProblemItems.map(item => ({ header: item, key: item }));
  worksheet.columns = [...baseHeaders, ...problemHeaders];

  // Tambahkan data yang sudah dikelompokkan ke baris
  Object.values(groupedByAsset).forEach((asset: any) => {
    const rowData: { [key: string]: any } = {
      tanggalDitemukan: asset.tanggalDitemukan,
      tipeAset: asset.tipeAset,
      kodeAset: asset.kodeAset,
      pelapor: asset.pelapor,
    };
    allProblemItems.forEach(problemName => {
      rowData[problemName] = asset.problems[problemName] || '';
    });
    worksheet.addRow(rowData);
  });

  // Style untuk header (tidak berubah)
  worksheet.getRow(1).eachCell((cell: Cell) => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD700' } };
  });

  // Logika AutoFit (tidak berubah)
  worksheet.columns.forEach((column: Partial<Column>) => {
    let maxTextLength = 0;
    if (column.header) { maxTextLength = column.header.length; }
    column.eachCell!({ includeEmpty: true }, (cell: Cell) => {
      const textLength = cell.value ? cell.value.toString().length : 0;
      if (textLength > maxTextLength) { maxTextLength = textLength; }
    });
    column.width = maxTextLength + 4;
  });
  
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `laporan_perlu_perbaikan_${new Date().toISOString().split('T')[0]}.xlsx`;

  return { file: Buffer.from(buffer).toString('base64'), fileName: fileName };
}