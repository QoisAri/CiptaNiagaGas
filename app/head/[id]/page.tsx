// app/head/[id]/page.tsx

import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { InspectionDetailClient } from './InspectionDetailClient';
import { deleteInspection } from '@/app/head/actions';

export const dynamic = 'force-dynamic';

// Tipe data dari kode lama Anda, dipertahankan
type Row = { 
  id: string;
  name: string;
  standard: string | null;
  resultId: string | null;
  kondisi: string;
  keterangan: string | null;
};
type SubGroup = { parentName: string; rows: Row[] };
type Group = Record<string, SubGroup[]>;

type InspectionItem = {
  id: string;
  name: string;
  standard: string | null;
  parent_id: string | null;
  page_title: string | null;
  category: string | null;
};

type ItemWithResult = InspectionItem & {
  resultId: string | null;
  kondisi: string;
  keterangan: string | null;
};

type ParentItem = {
  id: string;
  name: string;
};

export default async function HeadDetailPage({ params }: { params: { id: string } }) {
  const inspectionId = params.id;
  const supabase = createClient();

  // PERBAIKAN UTAMA: Menggunakan query join yang benar dan eksplisit
  const { data: inspectionHeader, error: headerError } = await supabase
    .from('inspections')
    .select(`
      *, 
      heads!inspections_head_id_fkey(head_code, feet), 
      profiles!fk_inspector(name)
    `)
    .eq('id', inspectionId)
    .single();

  // Logika penanganan error ini sekarang akan berfungsi dengan benar
  if (headerError || !inspectionHeader || !inspectionHeader.heads) {
    return notFound();
  }

  // Semua logika pemrosesan data di bawah ini dipertahankan dari kode lama Anda
  const feet = inspectionHeader.heads.feet;
  
  const { data: allMasterItems, error: masterItemsError } = await supabase
    .from('inspection_items')
    .select('*')
    .eq('category', 'Head')
    .ilike('subtype', `%${feet} Feet%`);

  if (masterItemsError) {
    return <div>Gagal memuat daftar item master.</div>;
  }
  
  const { data: inspectionResults } = await supabase
    .from('inspection_results')
    .select('id, item_id, kondisi, keterangan')
    .eq('inspection_id', inspectionId);
  
  const resultsMap = new Map(
    (inspectionResults || []).map(result => [
      result.item_id,
      { id: result.id, kondisi: result.kondisi, keterangan: result.keterangan },
    ])
  );
  
  const itemsWithResults: ItemWithResult[] = (allMasterItems || []).map((item: InspectionItem) => {
    const result = resultsMap.get(item.id);
    return {
      ...item,
      resultId: result?.id || null,
      kondisi: result?.kondisi || 'Belum Diperiksa',
      keterangan: result?.keterangan || '-',
    };
  });

  const groups: Group = {};
  const parentNameMap = new Map<string, string>();
  
  const parentIds = [...new Set(itemsWithResults.map((item: ItemWithResult) => item.parent_id).filter(Boolean))];
  if (parentIds.length > 0) {
    const { data: parents } = await supabase.from('inspection_items').select('id, name').in('id', parentIds as string[]);
    (parents || []).forEach((p: ParentItem) => parentNameMap.set(p.id, p.name));
  }

  for (const item of itemsWithResults) {
    const pageTitle = item.page_title || item.category || 'Lainnya';
    if (!groups[pageTitle]) {
      groups[pageTitle] = [];
    }
    const parentName = item.parent_id ? parentNameMap.get(item.parent_id) || 'Sub-grup' : item.name;
    let subGroup = groups[pageTitle].find(g => g.parentName === parentName);
    if (!subGroup) {
      subGroup = { parentName, rows: [] };
      groups[pageTitle].push(subGroup);
    }
    
    const rowData: Row = { 
      id: item.id, 
      name: item.name, 
      standard: item.standard,
      resultId: item.resultId, 
      kondisi: item.kondisi, 
      keterangan: item.keterangan 
    };

    if (item.parent_id) {
        subGroup.rows.push(rowData);
    } else {
        if (subGroup.rows.length === 0) subGroup.rows.push(rowData);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Detail Pemeriksaan Head {inspectionHeader.heads.head_code} ({feet} Feet)</h1>
      <InspectionDetailClient
        inspectionHeader={inspectionHeader as any} // Menggunakan 'as any' untuk mengatasi potensi ketidakcocokan tipe minor
        groups={groups}
        deleteAction={deleteInspection}
      />
    </div>
  );
}