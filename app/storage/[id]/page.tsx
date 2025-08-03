import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { StorageDetailClient } from './StorageDetailClient';
import { deleteInspection } from '@/app/storage/actions';

export const dynamic = 'force-dynamic';

// Tipe data untuk mempermudah
type Row = { 
  id: string; // item id
  name: string;
  resultId: string | null; // result id
  kondisi: string;
  keterangan: string | null;
};
type Group = Record<string, Row[]>;

export default async function StorageDetailPage({ params }: { params: { id: string } }) {
  const inspectionId = params.id;
  const supabase = createClient();

  const { data: inspectionHeader, error } = await supabase
    .from('inspections')
    .select(`*, storages ( storage_code, type ), profiles ( name )`)
    .eq('id', inspectionId).single();

  if (error || !inspectionHeader || !inspectionHeader.storages) return notFound();

  // Menggunakan metode 2-query yang andal
  const { data: allMasterItems } = await supabase
    .from('inspection_items')
    .select('*')
    .eq('category', 'Storage');

  const { data: inspectionResults } = await supabase
    .from('inspection_results')
    .select('id, item_id, kondisi, keterangan')
    .eq('inspection_id', inspectionId);
  
  const resultsMap = new Map((inspectionResults || []).map(r => [r.item_id, { id: r.id, kondisi: r.kondisi, keterangan: r.keterangan }]));
  
  const itemsWithResults = (allMasterItems || []).map(item => ({
    id: item.id,
    name: item.name,
    page_title: item.page_title || 'Hasil Pengecekan',
    resultId: resultsMap.get(item.id)?.id || null,
    kondisi: resultsMap.get(item.id)?.kondisi || 'Belum Diperiksa',
    keterangan: resultsMap.get(item.id)?.keterangan || '-',
  }));

  const groups: Group = {};
  for (const item of itemsWithResults) {
    const pageTitle = item.page_title;
    if (!groups[pageTitle]) groups[pageTitle] = [];
    groups[pageTitle].push(item);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Detail Pemeriksaan Storage {inspectionHeader.storages.storage_code}</h1>
      <StorageDetailClient 
        inspectionHeader={inspectionHeader} 
        groups={groups} 
        deleteAction={deleteInspection} 
      />
    </div>
  );
}
