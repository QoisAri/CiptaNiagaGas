'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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
// Tipe data untuk response form
export type FormState = { message: string; success: boolean, error?: boolean };


// =================================================================
// FUNGSI UNTUK AUTENTIKASI
// =================================================================
export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return redirect('/login?message=Email atau password salah.');
  return redirect('/');
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirm_password') as string;
  const supabase = createClient();

  if (password !== confirmPassword) return redirect('/signup?message=Password tidak cocok.');

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return redirect('/signup?message=Gagal membuat akun.');
  return redirect('/login?message=Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.');
}


// =================================================================
// FUNGSI UNTUK CASIS
// =================================================================
export async function addCasis(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = createClient();
  const casisCode = formData.get('casis_code') as string;
  const type = formData.get('type') as string;
  const feet = formData.get('feet') as string;

  if (!casisCode || !type || !feet) {
    return { message: 'Semua field wajib diisi.', success: false, error: true };
  }

  const { error } = await supabase
    .from('chassis')
    .insert({ chassis_code: casisCode, type: type, feet: Number(feet) });

  if (error) {
    console.error('Add Casis Error:', error);
    return { message: `Gagal menyimpan: ${error.message}`, success: false, error: true };
  }

  revalidatePath('/casis');
  return { message: 'Casis baru berhasil ditambahkan!', success: true };
}

// --- FUNGSI BARU UNTUK HAPUS BERDASARKAN PILIHAN CHECKBOX ---
export async function deleteInspectionsByIds(ids: string[]) {
  if (!ids || ids.length === 0) {
    return { success: false, message: 'Tidak ada ID yang dipilih.' };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from('inspections')
    .delete()
    .in('id', ids);

  if (error) {
    console.error('Error deleting inspections by IDs:', error);
    return { success: false, message: error.message };
  }
  revalidatePath('/casis');
  return { success: true, message: 'Data terpilih berhasil dihapus.' };
}

// --- FUNGSI BARU UNTUK HAPUS BERDASARKAN RENTANG TANGGAL ---
export async function deleteInspectionsByDateRange(startDate: string, endDate: string) {
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
    console.error('Error deleting inspections by date range:', error);
    return { success: false, message: error.message };
  }
  revalidatePath('/casis');
  return { success: true, message: 'Data dalam rentang tanggal berhasil dihapus.' };
}


// Fungsi untuk membuat dokumen Word
export async function generateCasisWordDoc(inspectionId: string) {
  const supabase = createClient();
  const { data: inspection } = await supabase.from('inspections').select(`*`).eq('id', inspectionId).single();
  if (!inspection) { throw new Error('Data inspeksi tidak ditemukan.'); }

  const { data: chassisData } = await supabase.from('chassis').select('chassis_code, feet').eq('id', inspection.chassis_id).single();
  if (!chassisData) { throw new Error(`Data sasis tidak ditemukan untuk inspeksi ini.`); }
  
  const { data: profileData } = await supabase.from('profiles').select('name').eq('id', inspection.inspector_id).single();

  const FONT_SIZE = 16;
  const FONT_SIZE_HEADER = 13;
  const FONT_SIZE_TITLE = 13;

  const { data: allMasterItems } = await supabase
    .from('inspection_items').select('*').eq('category', 'Chassis').or(`subtype.eq.${chassisData.feet} Feet,subtype.is.null`);
  
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
    "KONDISI BAN", "LAMPU", "WIPER", "SISTEM PENGEREMAN", "PER HEAD",
    "U BOLT+TUSHUKAN PER", "HUBBOLT RODA", "ENGINE", "SURAT KENDARAAN", "TOOLS & APAR"
  ];
  parentItems.sort((a, b) => {
    const indexA = checklistOrder.indexOf(a.name); const indexB = checklistOrder.indexOf(b.name);
    if (indexA === -1) return 1; if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const compactParagraph = { spacing: { before: 0, after: 0, line: 190 } };

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
      properties: { page: { size: { orientation: 'portrait', width: 11909, height: 16834 }, margin: { top: 100, bottom: 100, left: 432, right: 400, header: 706, footer: 706 } } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `CHECK SHEET CHASSIS ${chassisData?.feet || ''} FEET`, bold: true, size: FONT_SIZE_TITLE })] }),
        new Paragraph(""),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph("Tanggal")] }),
              new TableCell({ children: [new Paragraph(new Date(inspection.tanggal).toLocaleDateString('id-ID'))] }),
              new TableCell({ children: [new Paragraph("Nomor Casis")] }),
              new TableCell({ children: [new Paragraph(chassisData.chassis_code || 'N/A')] }),
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

// =================================================================
// FUNGSI UNTUK HEAD & STORAGE (DITAMBAHKAN)
// =================================================================
export async function addHead(prevState: FormState, formData: FormData): Promise<FormState> {
    // Implementasi logika untuk menambah head
    return { message: 'Head berhasil ditambahkan', success: true };
}

export async function addStorage(prevState: FormState, formData: FormData): Promise<FormState> {
    // Implementasi logika untuk menambah storage
    return { message: 'Storage berhasil ditambahkan', success: true };
}


// =================================================================
// FUNGSI UMUM
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

// Aksi untuk MEMBUAT atau MENGUPDATE satu baris hasil inspeksi.
export async function upsertInspectionResult(prevState: FormState, formData: FormData): Promise<FormState> {
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

export async function getRecapData(period: 'daily' | 'weekly' | 'monthly' | 'yearly') {
  const supabase = createClient();
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'daily': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
    case 'weekly': startDate = new Date(now.setDate(now.getDate() - now.getDay())); startDate.setHours(0, 0, 0, 0); break;
    case 'monthly': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case 'yearly': startDate = new Date(now.getFullYear(), 0, 1); break;
    default: throw new Error('Invalid period specified');
  }

  const { data, error } = await supabase
    .from('inspections')
    .select(`id, tanggal, chassis(chassis_code), heads(head_code), storages(storage_code), inspection_results(kondisi, keterangan, inspection_items(name, standard))`)
    .gte('tanggal', startDate.toISOString());

  if (error) {
    console.error('Error fetching recap data:', error);
    return [];
  }

  const formattedData = data.flatMap(inspection => {
    const assetCode = inspection.chassis[0]?.chassis_code || inspection.heads[0]?.head_code || inspection.storages[0]?.storage_code || 'N/A';
    return inspection.inspection_results.map(result => {
      const itemDetails = Array.isArray(result.inspection_items) ? result.inspection_items[0] : result.inspection_items;
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