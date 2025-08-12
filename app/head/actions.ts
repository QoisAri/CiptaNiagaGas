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

  const supabase =await createClient();
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


// FUNGSI BARU UNTUK MEMBUAT DOKUMEN WORD HEAD UNIT
export async function generateHeadWordDoc(inspectionId: string) {
  const supabase = createClient();
  const { data: inspection } = await supabase.from('inspections').select(`*`).eq('id', inspectionId).single();
  if (!inspection) { throw new Error('Data inspeksi tidak ditemukan.'); }

  // 1. Ambil juga 'feet' dari tabel 'heads'
  const { data: headData } = await supabase.from('heads').select('head_code, feet').eq('id', inspection.head_id).single();
  if (!headData) { throw new Error(`Data head tidak ditemukan untuk inspeksi ini.`); }
  
  const { data: profileData } = await supabase.from('profiles').select('name').eq('id', inspection.inspector_id).single();

  const FONT_SIZE = 14;
  const FONT_SIZE_HEADER = 10;
  const FONT_SIZE_TITLE = 10;

  // 2. Tambahkan filter .or() untuk mencocokkan 'subtype'
  const { data: allMasterItems } = await supabase
    .from('inspection_items')
    .select('*')
    .eq('category', 'Head')
    .or(`subtype.eq.${headData.feet} Feet,subtype.is.null`);

  const { data: inspectionResults } = await supabase.from('inspection_results').select('*').eq('inspection_id', inspectionId);
  const resultsMap = new Map(inspectionResults?.map(r => [r.item_id, r]));
  const itemsWithResults = (allMasterItems || []).map(item => ({...item, result: resultsMap.get(item.id)}));

  const groupedItems: Record<string, any[]> = {};
  const parentItems: any[] = [];
  itemsWithResults.forEach(item => {
    if (item.parent_id) {
      if (!groupedItems[item.parent_id]) groupedItems[item.parent_id] = [];
      groupedItems[item.parent_id].push(item);
    } else {
      parentItems.push(item);
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

  const compactParagraphStyle = { spacing: { before: 0, after: 0, line: 240 } };

  const dataRows = parentItems.flatMap((parent, index) => {
    const children = groupedItems[parent.id] || [];
    const itemsToRender = children.length > 0 ? children : [parent];
    const firstItem = itemsToRender[0];
    const firstResult = firstItem.result;
    return [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ ...compactParagraphStyle, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${index + 1}`, size: FONT_SIZE })] })], rowSpan: itemsToRender.length, verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ ...compactParagraphStyle, children: [new TextRun({ text: parent.name, size: FONT_SIZE })] })], rowSpan: itemsToRender.length, verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ ...compactParagraphStyle, alignment: AlignmentType.CENTER, children: [new TextRun({ text: firstResult?.kondisi === 'baik' ? '✓' : '', size: FONT_SIZE })] })], verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ ...compactParagraphStyle, alignment: AlignmentType.CENTER, children: [new TextRun({ text: firstResult?.kondisi === 'tidak_baik' ? '✓' : '', size: FONT_SIZE })] })], verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ ...compactParagraphStyle, children: [new TextRun({ text: firstResult?.keterangan || '', size: FONT_SIZE })] })], verticalAlign: VerticalAlign.CENTER }),
        ],
      }),
      ...itemsToRender.slice(1).map(child => {
          const childResult = child.result;
          return new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ ...compactParagraphStyle, alignment: AlignmentType.CENTER, children: [new TextRun({ text: childResult?.kondisi === 'baik' ? '✓' : '', size: FONT_SIZE })] })], verticalAlign: VerticalAlign.CENTER }),
              new TableCell({ children: [new Paragraph({ ...compactParagraphStyle, alignment: AlignmentType.CENTER, children: [new TextRun({ text: childResult?.kondisi === 'tidak_baik' ? '✓' : '', size: FONT_SIZE })] })], verticalAlign: VerticalAlign.CENTER }),
              new TableCell({ children: [new Paragraph({ ...compactParagraphStyle, children: [new TextRun({ text: childResult?.keterangan || '', size: FONT_SIZE })] })], verticalAlign: VerticalAlign.CENTER }),
            ],
          });
      })
    ];
  });

  const doc = new Document({
    sections: [{
      properties: { 
        page: { 
          size: {
            orientation: 'portrait',
            width: 11909,
            height: 16834,
          },
          margin: { 
            top: 202, bottom: 202, left: 432, right: 14,
            header: 706, footer: 706,
          } 
        } 
      },
      children: [
        new Paragraph({
          ...compactParagraphStyle,
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `CHECK SHEET HEAD UNIT`, bold: true, size: FONT_SIZE_TITLE })],
        }),
        new Paragraph(""),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ children: [new Paragraph({ ...compactParagraphStyle, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "No", bold: true, size: FONT_SIZE_HEADER })] })]}),
                new TableCell({ children: [new Paragraph({ ...compactParagraphStyle, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Bagian yang Diperiksa", bold: true, size: FONT_SIZE_HEADER })] })]}),
                new TableCell({ children: [new Paragraph({ ...compactParagraphStyle, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Kondisi", bold: true, size: FONT_SIZE_HEADER })] })], columnSpan: 2 }),
                new TableCell({ children: [new Paragraph({ ...compactParagraphStyle, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Keterangan", bold: true, size: FONT_SIZE_HEADER })] })]}),
              ],
            }),
            new TableRow({
                tableHeader: true,
                children: [ 
                    new TableCell({children:[]}), new TableCell({children:[]}),
                    new TableCell({ children: [new Paragraph({ ...compactParagraphStyle, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "B", bold: true, size: FONT_SIZE })] })] }),
                    new TableCell({ children: [new Paragraph({ ...compactParagraphStyle, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "T", bold: true, size: FONT_SIZE })] })] }),
                    new TableCell({ children: [] }),
                ],
            }),
            ...dataRows,
            new TableRow({
                children: [
                    new TableCell({ 
                        children: [new Paragraph({ ...compactParagraphStyle, spacing: {...compactParagraphStyle.spacing, before: 100}, children: [ new TextRun({ text: "Note: Beri tanda (✓) pada kolom pilihan (Baik/Tidak), apabila ada kerusakan harap isi kolom keterangan", size: FONT_SIZE, italics: true }) ] })], 
                        columnSpan: 5,
                        borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                ],
            }),
            new TableRow({
                children: [
                    new TableCell({ 
                        children: [
                            new Paragraph({ ...compactParagraphStyle, spacing: {...compactParagraphStyle.spacing, before: 100}, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Diperiksa Oleh", size: FONT_SIZE })] }),
                            new Paragraph(""), new Paragraph(""),
                            new Paragraph({ ...compactParagraphStyle, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `( ${profileData?.name || '...................'} )`, size: FONT_SIZE })] }),
                        ],
                        columnSpan: 2,
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                    new TableCell({ 
                        children: [
                            new Paragraph({ ...compactParagraphStyle, spacing: {...compactParagraphStyle.spacing, before: 100}, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Diketahui Oleh", size: FONT_SIZE })] }),
                            new Paragraph(""), new Paragraph(""),
                            new Paragraph({ ...compactParagraphStyle, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(...................)", size: FONT_SIZE })] }),
                        ],
                        columnSpan: 3,
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                ],
            }),
          ],
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer.toString('base64');
}