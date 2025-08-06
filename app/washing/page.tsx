import { createClient } from '@/utils/supabase/server';
import { WashingHistoryClient } from './WashingHistoryClient';

export type HistoryItem = {
  id: string;
  tanggal: string;
  assetType: 'Storage' | 'Head' | 'Casis';
  kodeAset: string;
  tipeFeet: string | null;
  diliputOleh: string;
  keterangan: string | null;
};

// PERBAIKAN: Mengubah tipe relasi menjadi array objek
type RawRecord = {
  id: string;
  washed_at: string;
  notes: string | null;
  washed_by: { name: string }[] | null; // Diubah menjadi array
  storages: { storage_code: string; feet: number; type: string | null }[] | null; // Diubah menjadi array
};

async function getWashingHistory(): Promise<HistoryItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('washing_history')
    .select(`
      id,
      washed_at,
      notes,
      washed_by:profiles ( name ),
      storages ( storage_code, feet, type )
    `)
    .order('washed_at', { ascending: false });

  if (error) {
    console.error('Error fetching washing history:', error);
    return [];
  }

  // PERBAIKAN: Logika map disesuaikan untuk mengambil elemen pertama dari array
  const historyList = (data as RawRecord[]).map(record => {
    const asset = record.storages?.[0]; // Ambil objek pertama dari array storages
    const washedBy = record.washed_by?.[0]; // Ambil objek pertama dari array washed_by

    if (!asset) return null; // Jika tidak ada aset terkait, lewati record ini

    return {
      id: record.id,
      tanggal: new Date(record.washed_at).toLocaleDateString('id-ID'),
      assetType: 'Storage',
      kodeAset: asset.storage_code,
      tipeFeet: asset.feet ? String(asset.feet) : (asset.type || null),
      diliputOleh: washedBy?.name || 'N/A',
      keterangan: record.notes,
    };
  }).filter((item): item is HistoryItem => item !== null);

  return historyList;
}

export default async function WashingHistoryPage() {
  const historyData = await getWashingHistory();
  return (
    <WashingHistoryClient initialHistoryData={historyData} />
  );
}
