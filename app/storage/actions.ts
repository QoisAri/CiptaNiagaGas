// app/storage/actions.ts

'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import ExcelJS from 'exceljs';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  VerticalAlign,
  AlignmentType,
} from 'docx';
// =================================================================
// TIPE DATA UNIVERSAL
// =================================================================

export type FormState = {
  message: string;
  success: boolean;
  error?: boolean;
};

// =================================================================
// TIPE DATA SPESIFIK UNTUK LAPORAN
// =================================================================

// Tipe untuk data inspeksi yang digabung dengan tabel profiles
type InspectionWithProfile = {
  id: string;
  storage_id: string | null;
  tanggal: string | null;
  profiles: {
    name: string | null;
  } | null;
};

// Tipe untuk data hasil inspeksi yang digabung dengan tabel inspection_items
type ResultWithItem = {
  id: string;
  inspection_id: string;
  item_id: string;
  kondisi: string;
  keterangan: string | null;
  inspection_items: {
    name: string | null;
  } | null;
};

// Tipe data universal untuk baris laporan
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
  return redirect(
    '/login?message=Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.'
  );
}

// =================================================================
// FUNGSI UNTUK MENAMBAH DATA MASTER (HEAD, CASIS, STORAGE)
// =================================================================

export async function addHead(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
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
    return {
      message: `Gagal menyimpan Head: ${error.message}`,
      success: false,
      error: true,
    };
  }
  revalidatePath('/head');
  return { message: 'Head baru berhasil ditambahkan!', success: true };
}

export async function addCasis(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
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
    return {
      message: `Gagal menyimpan Casis: ${error.message}`,
      success: false,
      error: true,
    };
  }
  revalidatePath('/casis');
  return { message: 'Casis baru berhasil ditambahkan!', success: true };
}

export async function addStorage(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
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
    return {
      message: `Gagal menyimpan Storage: ${error.message}`,
      success: false,
      error: true,
    };
  }
  revalidatePath('/storage');
  return { message: 'Storage baru berhasil ditambahkan!', success: true };
}

// =================================================================
// FUNGSI UNTUK MANAJEMEN INSPEKSI
// =================================================================

// --- FUNGSI BARU UNTUK HAPUS INSPEKSI STORAGE BERDASARKAN ID ---
export async function deleteStorageInspectionsByIds(ids: string[]) {
  if (!ids || ids.length === 0) {
    return { success: false, message: 'Tidak ada ID yang dipilih.' };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from('inspections')
    .delete()
    .in('id', ids);

  if (error) {
    console.error('Error deleting storage inspections by IDs:', error);
    return { success: false, message: error.message };
  }
  revalidatePath('/storage'); // Revalidasi halaman storage
  return { success: true, message: 'Data terpilih berhasil dihapus.' };
}

// --- FUNGSI BARU UNTUK HAPUS INSPEKSI STORAGE BERDASARKAN TANGGAL ---
export async function deleteStorageInspectionsByDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return { success: false, message: 'Tanggal mulai dan selesai harus diisi.' };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from('inspections')
    .delete()
    .gte('tanggal', startDate)
    .lte('tanggal', endDate);

  if (error) {
    console.error('Error deleting storage inspections by date range:', error);
    return { success: false, message: error.message };
  }
  revalidatePath('/storage'); // Revalidasi halaman storage
  return { success: true, message: 'Data dalam rentang tanggal berhasil dihapus.' };
}


export async function deleteInspection(formData: FormData) {
  const inspectionId = formData.get('inspectionId') as string;
  const redirectTo = formData.get('redirectTo') as string;

  if (!inspectionId || !redirectTo) return;

  const supabase = createClient();
  const { error } = await supabase
    .from('inspections')
    .delete()
    .eq('id', inspectionId);

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

  if (
    data.resultId &&
    data.resultId !== 'undefined' &&
    data.resultId !== 'null'
  ) {
    // UPDATE
    const { error } = await supabase
      .from('inspection_results')
      .update({ kondisi: data.kondisi, keterangan: data.keterangan })
      .eq('id', data.resultId);
    if (error)
      return { message: `Gagal mengupdate: ${error.message}`, success: false };
  } else {
    // INSERT
    const { error } = await supabase.from('inspection_results').insert({
      inspection_id: data.inspectionId,
      item_id: data.itemId,
      kondisi: data.kondisi,
      keterangan: data.keterangan,
    });
    if (error)
      return { message: `Gagal menyimpan: ${error.message}`, success: false };
  }

  revalidatePath(data.pathname);
  return { message: 'Data berhasil disimpan!', success: true };
}

// =================================================================
// FUNGSI UNTUK MEMBUAT LAPORAN EXCEL
// =================================================================

export async function generateStorageReport(
  reportType: 'checked' | 'problematic' | 'maintained'
) {
  const supabase = createClient();
  let reportData: StorageData[] = [];
  const fileName = `laporan-storage-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;

  const { data: allStorages } = await supabase.from('storages').select('*');
  const { data: allInspections } = await supabase
    .from('inspections')
    .select('*, profiles(name)')
    .returns<InspectionWithProfile[]>();
  const { data: allResults } = await supabase
    .from('inspection_results')
    .select('*, inspection_items(name)')
    .returns<ResultWithItem[]>();
  const { data: allMaintenance } = await supabase
    .from('maintenance_records')
    .select('*');
  const { data: allItems } = await supabase.from('inspection_items').select('*');

  if (!allStorages) {
    return { error: 'Gagal mengambil data master storage.' };
  }

  if (reportType === 'checked') {
    reportData = allStorages.map((storage) => {
      const inspection = allInspections?.find(
        (insp) => insp.storage_id === storage.id
      );
      return {
        id: storage.id,
        storage_code: storage.storage_code,
        feet: storage.feet,
        kondisi: inspection ? 'Sudah Dicek' : 'Belum Dicek',
        tanggal: inspection?.tanggal || null,
        pemeriksa: inspection?.profiles?.name || null,
        keterangan: null,
        item_name: null,
        tgl_perbaikan: null,
        tindakan: null,
      };
    });
  } else if (reportType === 'problematic') {
    const problematicResults = allResults?.filter(
      (res) => res.kondisi === 'tidak_baik'
    );
    if (!problematicResults) return { error: 'Tidak ada data bermasalah.' };

    problematicResults.forEach((result) => {
      const inspection = allInspections?.find(
        (insp) => insp.id === result.inspection_id
      );
      if (inspection && inspection.storage_id) {
        const storage = allStorages?.find((s) => s.id === inspection.storage_id);
        if (storage) {
          reportData.push({
            id: storage.id,
            storage_code: storage.storage_code,
            feet: storage.feet,
            kondisi: result.kondisi,
            keterangan: result.keterangan,
            item_name: result.inspection_items?.name || 'Item tidak diketahui',
            tanggal: inspection.tanggal,
            pemeriksa: inspection?.profiles?.name || null,
            tgl_perbaikan: null,
            tindakan: null,
          });
        }
      }
    });
  } else if (reportType === 'maintained') {
    if (!allMaintenance || allMaintenance.length === 0) {
      return { error: 'Tidak ada data perbaikan untuk dilaporkan.' };
    }

    allMaintenance.forEach((maintenance) => {
      const result = allResults?.find(
        (res) => res.id === maintenance.inspection_result_id
      );
      if (result) {
        const inspection = allInspections?.find(
          (insp) => insp.id === result.inspection_id
        );
        if (inspection && inspection.storage_id) {
          const storage = allStorages?.find(
            (s) => s.id === inspection.storage_id
          );
          const item = allItems?.find((it) => it.id === result.item_id);
          if (storage) {
            reportData.push({
              id: storage.id,
              storage_code: storage.storage_code,
              feet: storage.feet,
              tgl_perbaikan: maintenance.repaired_at,
              tindakan: maintenance.notes,
              item_name: item?.name || 'Item tidak diketahui',
              tanggal: inspection.tanggal,
              pemeriksa: inspection?.profiles?.name || null,
              kondisi: null,
              keterangan: null,
            });
          }
        }
      }
    });
  }

  if (reportData.length === 0) {
    return { error: 'Tidak ada data untuk dilaporkan.' };
  }

  const groupedByFeet: Record<string, StorageData[]> = reportData.reduce(
    (acc, item) => {
      const feet = item.feet ? `${item.feet} Feet` : 'Ukuran Tidak Diketahui';
      if (!acc[feet]) acc[feet] = [];
      acc[feet].push(item);
      return acc;
    },
    {} as Record<string, StorageData[]>
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CNG Application';
  workbook.created = new Date();

  const baseHeaders = [
    { header: 'No.', key: 'no', width: 5 },
    { header: 'Storage Code', key: 'storage_code', width: 20 },
    { header: 'Pemeriksa', key: 'pemeriksa', width: 25 },
    { header: 'Tanggal Inspeksi', key: 'tanggal', width: 20 },
  ];

  const headersConfig = [...baseHeaders];
  if (reportType === 'checked') {
    headersConfig.push({
      header: 'Status Pengecekan',
      key: 'kondisi',
      width: 25,
    });
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
        tanggal: item.tanggal
          ? new Date(item.tanggal).toLocaleDateString('id-ID')
          : '',
        kondisi:
          reportType === 'checked' ? item.kondisi || 'Belum Dicek' : item.kondisi,
        item_name: item.item_name,
        keterangan: item.keterangan,
        tgl_perbaikan: item.tgl_perbaikan
          ? new Date(item.tgl_perbaikan).toLocaleDateString('id-ID')
          : '',
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
  return { file: Buffer.from(buffer).toString('base64'), fileName: fileName };
}

export async function generateStorageWordDoc(inspectionId: string) {
  const supabase = createClient();
  const { data: inspection } = await supabase.from('inspections').select(`*`).eq('id', inspectionId).single();
  if (!inspection) { throw new Error('Data inspeksi tidak ditemukan.'); }

  const { data: storageData } = await supabase.from('storages').select('storage_code, type').eq('id', inspection.storage_id).single();
  if (!storageData) { throw new Error(`Data storage tidak ditemukan untuk inspeksi ini.`); }
  
  const { data: profileData } = await supabase.from('profiles').select('name').eq('id', inspection.inspector_id).single();

  const FONT_SIZE = 16;
  const FONT_SIZE_HEADER = 18;
  const FONT_SIZE_TITLE = 22;

  const { data: allMasterItems } = await supabase
    .from('inspection_items').select('*').eq('category', 'Storage').or(`subtype.eq.${storageData.type},subtype.eq.Umum`);
  
  const { data: inspectionResults } = await supabase.from('inspection_results').select('*').eq('inspection_id', inspectionId);
  const resultsMap = new Map(inspectionResults?.map(r => [r.item_id, r]));
  const itemsWithResults = (allMasterItems || []).map(item => ({...item, result: resultsMap.get(item.id)}));

  const groupedItems: Record<string, any[]> = {};
  const parentItems: any[] = [];
  itemsWithResults.forEach(item => {
    if (!item.parent_id) { parentItems.push(item); } else {
      if (!groupedItems[item.parent_id]) groupedItems[item.parent_id] = [];
      groupedItems[item.parent_id].push(item);
    }
  });

  const checklistOrder = [
    "Bracket Tubing", "Cover Container Storage", "Painting", "Logo", "Plate Deck", "Frame", "Cylinder",
    "Cylinder Valve", "Bracket Cylinder", "Sabuk Cylinder", "Tubing", "Fittings", "Main Header",
    "Sub Header", "Main Valve", "Bank Valve", "PSV (Pressure Safety Valve)", "Thermal PRD",
    "Receptacle", "Pressure Gauge", "Temperature Gauge", "Venting Header", "Stiker Reflektor"
  ];
  parentItems.sort((a, b) => {
    const indexA = checklistOrder.indexOf(a.name); const indexB = checklistOrder.indexOf(b.name);
    if (indexA === -1) return 1; if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const compactParagraph = { spacing: { before: 0, after: 0, line: 240 } };

  const dataRows = parentItems.flatMap((parent, index) => {
    const children = groupedItems[parent.id] || [];
    const itemsToRender = children.length > 0 ? children : [parent];
    const firstResult = itemsToRender[0].result;
    return [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ ...compactParagraph, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${index + 1}`, size: FONT_SIZE })] })], rowSpan: itemsToRender.length, verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ ...compactParagraph, children: [new TextRun({ text: parent.name, size: FONT_SIZE })] })], rowSpan: itemsToRender.length, verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ ...compactParagraph, alignment: AlignmentType.CENTER, children: [new TextRun({ text: firstResult?.kondisi === 'baik' ? '✓' : '', size: FONT_SIZE })] })], verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ ...compactParagraph, alignment: AlignmentType.CENTER, children: [new TextRun({ text: firstResult?.kondisi === 'tidak_baik' ? '✓' : '', size: FONT_SIZE })] })], verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ ...compactParagraph, children: [new TextRun({ text: firstResult?.keterangan || '', size: FONT_SIZE })] })], verticalAlign: VerticalAlign.CENTER }),
        ],
      }),
      ...itemsToRender.slice(1).map(child => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ ...compactParagraph, alignment: AlignmentType.CENTER, children: [new TextRun({ text: child.result?.kondisi === 'baik' ? '✓' : '', size: FONT_SIZE })] })]}),
            new TableCell({ children: [new Paragraph({ ...compactParagraph, alignment: AlignmentType.CENTER, children: [new TextRun({ text: child.result?.kondisi === 'tidak_baik' ? '✓' : '', size: FONT_SIZE })] })]}),
            new TableCell({ children: [new Paragraph({ ...compactParagraph, children: [new TextRun({ text: child.result?.keterangan || '', size: FONT_SIZE })] })]}),
          ],
      })),
    ];
  });

  const doc = new Document({
    sections: [{
      properties: { page: { size: { orientation: 'portrait', width: 11909, height: 16834 }, margin: { top: 202, bottom: 202, left: 432, right: 500, header: 706, footer: 706 } } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `CHECK SHEET STORAGE`, bold: true, size: FONT_SIZE_TITLE })] }),
        new Paragraph(""),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph("Tanggal")] }),
              new TableCell({ children: [new Paragraph(new Date(inspection.tanggal).toLocaleDateString('id-ID'))] }),
              new TableCell({ children: [new Paragraph("Nomor Storage")] }),
              new TableCell({ children: [new Paragraph(storageData.storage_code || 'N/A')] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph("Jam")] }),
              new TableCell({ children: [new Paragraph(new Date(inspection.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })) ] }),
              new TableCell({ children: [new Paragraph("Pemeriksa")] }),
              new TableCell({ children: [new Paragraph(profileData?.name || 'N/A')] }),
            ]}),
          ],
        }),
        new Paragraph(""),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ tableHeader: true, children: [
              new TableCell({ children: [new Paragraph({ ...compactParagraph, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "No", bold: true, size: FONT_SIZE_HEADER })] })]}),
              new TableCell({ children: [new Paragraph({ ...compactParagraph, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Bagian yang Diperiksa", bold: true, size: FONT_SIZE_HEADER })] })]}),
              new TableCell({ children: [new Paragraph({ ...compactParagraph, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Kondisi", bold: true, size: FONT_SIZE_HEADER })] })], columnSpan: 2 }),
              new TableCell({ children: [new Paragraph({ ...compactParagraph, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Keterangan", bold: true, size: FONT_SIZE_HEADER })] })]}),
            ]}),
            new TableRow({ tableHeader: true, children: [ 
              new TableCell({children:[]}), new TableCell({children:[]}),
              new TableCell({ children: [new Paragraph({ ...compactParagraph, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "B", bold: true, size: FONT_SIZE })] })] }),
              new TableCell({ children: [new Paragraph({ ...compactParagraph, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "T", bold: true, size: FONT_SIZE })] })] }),
              new TableCell({ children: [] }),
            ]}),
            ...dataRows,
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph({ ...compactParagraph, spacing: {...compactParagraph.spacing, before: 100}, children: [ new TextRun({ text: "Note: Beri tanda (✓) pada kolom pilihan (Baik/Tidak), apabila ada kerusakan harap isi kolom keterangan", size: FONT_SIZE, italics: true }) ] })], columnSpan: 5, borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
            ]}),
            new TableRow({ children: [
              new TableCell({ children: [
                new Paragraph({ ...compactParagraph, spacing: {...compactParagraph.spacing, before: 100}, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Diperiksa Oleh", size: FONT_SIZE })] }),
                new Paragraph(""), new Paragraph(""),
                new Paragraph({ ...compactParagraph, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `( ${profileData?.name || '...................'} )`, size: FONT_SIZE })] }),
              ], columnSpan: 2, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
              new TableCell({ children: [
                new Paragraph({ ...compactParagraph, spacing: {...compactParagraph.spacing, before: 100}, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Diketahui Oleh", size: FONT_SIZE })] }),
                new Paragraph(""), new Paragraph(""),
                new Paragraph({ ...compactParagraph, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(...................)", size: FONT_SIZE })] }),
              ], columnSpan: 3, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
            ]}),
          ],
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer.toString('base64');
}