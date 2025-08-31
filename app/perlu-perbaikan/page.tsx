import { createClient } from '@/utils/supabase/server';
import PendingRepairClient from './PendingRepairClient';

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

// Fungsi getPendingRepairs sekarang menerima parameter filter dari URL
async function getPendingRepairs({ 
    tipeAset, 
    dateRange,
    currentPage 
}: { 
    tipeAset?: string;
    dateRange?: string;
    currentPage: number;
}): Promise<{ data: PendingRepairItem[], totalCount: number }> {
  const supabase = createClient();
  
  let query = supabase
    .from('pending_repairs_view') 
    .select('*', { count: 'exact' });

  // Terapkan filter jika ada dan bukan 'all'
  if (tipeAset && tipeAset.toLowerCase() !== 'all') {
    query = query.ilike('unit_type', `%${tipeAset}%`);
  }

  // --- LOGIKA FILTER TANGGAL ---
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfToday.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  if (dateRange) {
    switch(dateRange) {
        case 'harian': 
            query = query.gte('reported_at', startOfToday.toISOString());
            break;
        case 'mingguan':
            query = query.gte('reported_at', startOfWeek.toISOString());
            break;
        case 'bulanan':
            query = query.gte('reported_at', startOfMonth.toISOString());
            break;
        case 'tahunan':
            query = query.gte('reported_at', startOfYear.toISOString());
            break;
    }
  }

  // --- PERBAIKAN PENGURUTAN DI SINI ---
  query = query.order('reported_at', { ascending: false }); // Ubah 'true' menjadi 'false'

  // Logika Pagination
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching pending repairs:', error);
    return { data: [], totalCount: 0 };
  }

  if (!data) return { data: [], totalCount: 0 };

  // Logika mapping data tidak berubah
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

// Halaman utama sekarang hanya mengambil data dan meneruskannya
export default async function PerluPerbaikanPage({ 
  searchParams 
}: { 
  searchParams: { tipeAset?: string; range?: string; page?: string; };
}) {
  const currentPage = Number(searchParams.page) || 1;
  const { data: pendingData, totalCount } = await getPendingRepairs({ 
      tipeAset: searchParams.tipeAset,
      dateRange: searchParams.range,
      currentPage: currentPage,
  });
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Kirim semua props yang dibutuhkan ke client component
  return (
      <PendingRepairClient 
        initialData={pendingData} 
        currentPage={currentPage}
        totalPages={totalPages}
      />
  );
}

