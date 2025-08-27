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

// Fungsi getPendingRepairs sekarang menerima parameter filter dari URL
async function getPendingRepairs({ tipeAset }: { tipeAset?: string }): Promise<PendingRepairItem[]> {
  const supabase = createClient();
  let query = supabase
    .from('pending_repairs_view') 
    .select('*')
    .order('reported_at', { ascending: true });

  // Terapkan filter jika ada dan bukan 'all'
  if (tipeAset && tipeAset.toLowerCase() !== 'all') {
    query = query.eq('unit_type', tipeAset);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching pending repairs:', error);
    return [];
  }

  if (!data) return [];

  // Logika mapping data tidak berubah
  return data.map((item: any) => ({
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
}

// Halaman utama sekarang hanya mengambil data dan meneruskannya
export default async function PerluPerbaikanPage({ 
  searchParams 
}: { 
  searchParams: { tipeAset?: string };
}) {
  const pendingData = await getPendingRepairs({ tipeAset: searchParams.tipeAset });

  // Kirim initialData dan searchParams ke client component
  return (
      <PendingRepairClient 
        initialData={pendingData} 
        currentFilter={searchParams.tipeAset} 
      />
  );
}