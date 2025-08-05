import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { StorageDetailClient } from './StorageDetailClient';
import { deleteInspection } from '@/app/actions';
import { JSX } from 'react';

export const dynamic = 'force-dynamic';

// Tipe data detail
type Row = { id: string; name: string; standard: string | null; resultId: string | null; kondisi: string; keterangan: string | null; problem_photo_url: string | null; };
type Group = Record<string, Row[]>;

// Tipe yang lebih spesifik untuk data dari Supabase
type InspectionHeaderWithRelations = {
  id: string;
  tanggal: string;
  catatan: string | null;
  created_at: string;
  inspector_id: string;
  head_id: string | null;
  chassis_id: number | null;
  storage_id: number | null;
  storages: { storage_code: string; type: string | null; } | null;
  profiles: { name: string; } | null;
};

export default async function StorageDetailPage({ params }: { params: { id: string } }) {
  const inspectionId = params.id;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inspections')
    .select(`
      *, 
      storages!inspections_storage_id_fkey(storage_code, type), 
      profiles!fk_inspector(name)
    `)
    .eq('id', inspectionId)
    .single();

  // Memberi tipe yang benar pada data yang diambil
  const inspectionHeader: InspectionHeaderWithRelations | null = data;

  if (error || !inspectionHeader || !inspectionHeader.storages) {
    return notFound();
  }

  const { data: allMasterItems } = await supabase
    .from('inspection_items')
    .select('*')
    .eq('category', 'Storage');

  const { data: inspectionResults } = await supabase
    .from('inspection_results')
    .select('id, item_id, kondisi, keterangan, problem_photo_url')
    .eq('inspection_id', inspectionId);
  
  const resultsMap = new Map((inspectionResults || []).map(r => [
    r.item_id, 
    { 
      id: r.id, 
      kondisi: r.kondisi, 
      keterangan: r.keterangan,
      problem_photo_url: r.problem_photo_url
    }
  ]));
  
  const itemsWithResults = (allMasterItems || []).map(item => ({
    id: item.id,
    name: item.name,
    standard: item.standard,
    page_title: item.page_title || 'Hasil Pengecekan',
    resultId: resultsMap.get(item.id)?.id || null,
    kondisi: resultsMap.get(item.id)?.kondisi || 'Belum Diperiksa',
    keterangan: resultsMap.get(item.id)?.keterangan || '-',
    problem_photo_url: resultsMap.get(item.id)?.problem_photo_url || null,
  }));

  const groups: Group = {};
  for (const item of itemsWithResults) {
    const pageTitle = item.page_title;
    if (!groups[pageTitle]) groups[pageTitle] = [];
    groups[pageTitle].push(item as Row);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Detail Pemeriksaan Storage {inspectionHeader.storages.storage_code}</h1>
      {/* Menghapus 'as any' */}
      <StorageDetailClient 
        inspectionHeader={inspectionHeader}
        groups={groups} 
        deleteAction={deleteInspection} 
      />
    </div>
  );
}