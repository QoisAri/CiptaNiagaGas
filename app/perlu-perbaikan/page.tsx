// -----------------------------------------------------------------------------
// FILE 1: Salin semua kode di bawah ini ke file Anda di:
// app/perlu-perbaikan/page.tsx
// -----------------------------------------------------------------------------

import { createClient } from '@/utils/supabase/server';
import PendingRepairClient from './PendingRepairClient'; // Pastikan nama file ini sesuai

// Tipe data ini penting untuk komunikasi antara server dan client
export type PendingRepairItem = {
  id: string;
  tanggalDitemukan: string;
  tipeAset: string;
  kodeAset: string;
  tipeFeetDisplay: string | null;
  itemBermasalah: string;
  keterangan: string;
  pelapor: string;
  problemPhotoUrl: string | null;
};

const ITEMS_PER_PAGE = 50;

// Fungsi getPendingRepairs tidak berubah
async function getPendingRepairs({ 
    tipeAset, 
    currentPage 
}: { 
    tipeAset?: string;
    currentPage: number;
}) {
  const supabase = createClient();
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from('pending_repairs_view') 
    .select('*', { count: 'exact' })
    .order('reported_at', { ascending: true });

  if (tipeAset && tipeAset.toLowerCase() !== 'all') {
    query = query.eq('unit_type', tipeAset);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching pending repairs:', error);
    return { data: [], totalCount: 0 };
  }

  if (!data) return { data: [], totalCount: 0 };

  const mappedData = data.map((item: any) => ({
    id: item.result_id || item.problem_report_id,
    tanggalDitemukan: new Date(item.reported_at).toLocaleDateString('id-ID'),
    tipeAset: item.unit_type || 'N/A', 
    kodeAset: item.unit_code || 'N/A',
    tipeFeetDisplay: item.feet ? `${item.feet} Feet` : 'N/A',
    itemBermasalah: item.item_name,
    keterangan: item.problem_notes,
    pelapor: item.reported_by,
    problemPhotoUrl: item.problem_photo_url,
  }));

  return { data: mappedData, totalCount: count ?? 0 };
}

// Halaman utama (Server Component)
export default async function PerluPerbaikanPage({ 
  searchParams 
}: { 
  searchParams: { tipeAset?: string; page?: string };
}) {
  const currentPage = Number(searchParams.page) || 1;
  const { data: pendingData, totalCount } = await getPendingRepairs({ 
    tipeAset: searchParams.tipeAset,
    currentPage,
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <PendingRepairClient 
      initialData={pendingData} 
      currentFilter={searchParams.tipeAset} 
      currentPage={currentPage}
      totalPages={totalPages}
    />
  );
}
