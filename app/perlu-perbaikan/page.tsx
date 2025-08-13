import { createClient } from '@/utils/supabase/server';
import PendingRepairClient from './PendingRepairClient';

// Tipe data untuk setiap item perbaikan yang tertunda
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

// GUNAKAN FUNGSI INI
async function getPendingRepairs(): Promise<PendingRepairItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pending_repairs_view') 
    .select('*')
    .order('reported_at', { ascending: true });

  if (error) {
    console.error('Error fetching pending repairs:', error);
    return [];
  }

  if (!data) {
    return [];
  }

  // ## PEMETAAN DATA YANG DIPERBARUI & DISEDERHANAKAN ##
  return data.map((item: any) => {
    return {
      id: item.result_id || item.problem_report_id, // Gunakan id yang tersedia sebagai key unik
      tanggalDitemukan: new Date(item.reported_at).toLocaleDateString('id-ID'),
      
      // Langsung gunakan kolom dari view
      tipeAset: item.unit_type || 'N/A', 
      kodeAset: item.unit_code || 'N/A',
      
      // Gunakan 'feet' jika ada, jika tidak fallback ke 'N/A'
      tipeFeetDisplay: item.feet ? `${item.feet} Feet` : 'N/A',
      
      itemBermasalah: item.item_name,
      keterangan: item.problem_notes,
      pelapor: item.reported_by,
      problemPhotoUrl: item.problem_photo_url,
    };
  });
}


export default async function PerluPerbaikanPage() {
  const pendingData = await getPendingRepairs();

  return (
    <div className="p-6">
       <PendingRepairClient initialData={pendingData} />
    </div>
  );
}