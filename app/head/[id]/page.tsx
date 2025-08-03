import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { InspectionDetailClient } from './InspectionDetailClient';
import { deleteInspection } from '@/app/head/actions';

export const dynamic = 'force-dynamic';

// Tipe data untuk mempermudah
type Row = { 
  id: string; // item id
  name: string;
  standard: string | null; // <-- Tambahkan properti standard
  resultId: string | null; // result id
  kondisi: string;
  keterangan: string | null;
};
type SubGroup = { parentName: string; rows: Row[] };
type Group = Record<string, SubGroup[]>;

export default async function HeadDetailPage({ params }: { params: { id: string } }) {
  const inspectionId = params.id;
  const supabase = createClient();

  // 1. Ambil data header inspeksi
  const { data: inspectionHeader, error: headerError } = await supabase
    .from('inspections')
    .select(`*, heads ( head_code, feet ), profiles ( name )`)
    .eq('id', inspectionId)
    .single();

  if (headerError || !inspectionHeader || !inspectionHeader.heads) {
    return notFound();
  }

  const feet = inspectionHeader.heads.feet;
  
  // 2. Ambil semua item master yang relevan
  const { data: allMasterItems, error: masterItemsError } = await supabase
    .from('inspection_items')
    .select('*') // Ambil semua kolom, termasuk 'standard'
    .eq('category', 'Head')
    .ilike('subtype', `%${feet} Feet%`);

  if (masterItemsError) {
    return <div>Gagal memuat daftar item master.</div>;
  }
  
  // 3. Ambil semua hasil inspeksi untuk ID ini
  const { data: inspectionResults } = await supabase
    .from('inspection_results')
    .select('id, item_id, kondisi, keterangan')
    .eq('inspection_id', inspectionId);
  
  // 4. Gabungkan hasil dengan item master di JavaScript
  const resultsMap = new Map(
    (inspectionResults || []).map(result => [
      result.item_id,
      { id: result.id, kondisi: result.kondisi, keterangan: result.keterangan },
    ])
  );
  
  const itemsWithResults = (allMasterItems || []).map(item => {
    const result = resultsMap.get(item.id);
    return {
      ...item,
      resultId: result?.id || null,
      kondisi: result?.kondisi || 'Belum Diperiksa',
      keterangan: result?.keterangan || '-',
    };
  });

  // 5. Proses data menjadi struktur Grup dan Sub-Grup
  const groups: Group = {};
  const parentNameMap = new Map<string, string>();
  
  const parentIds = [...new Set(itemsWithResults.map((item: any) => item.parent_id).filter(Boolean))];
  if (parentIds.length > 0) {
    const { data: parents } = await supabase.from('inspection_items').select('id, name').in('id', parentIds);
    (parents || []).forEach((p: any) => parentNameMap.set(p.id, p.name));
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
      standard: item.standard, // <-- Kirim data standard ke client
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
        inspectionHeader={inspectionHeader}
        groups={groups}
        deleteAction={deleteInspection}
      />
    </div>
  );
}
