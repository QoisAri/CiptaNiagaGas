import { createClient } from '@/utils/supabase/server';
import { WashingListClient } from './WashingListClient';

// Tipe data untuk hasil akhir yang akan ditampilkan
export type HistoryItem = {
  id: string;
  tanggal: string;
  assetType: 'Storage' | 'Head' | 'Casis';
  kodeAset: string;
  tipeFeet: string | null;
  diliputOleh: string;
  keterangan: string | null;
};

async function getWashingHistory(): Promise<HistoryItem[]> {
  const supabase = await createClient();

  // Langkah 1: Ambil semua data mentah dari washing_history
  const { data: historyData, error: historyError } = await supabase
    .from('washing_history')
    .select('*')
    .order('washed_at', { ascending: false });

  if (historyError) {
    console.error("Error fetching washing history:", historyError.message);
    return [];
  }
  if (!historyData || historyData.length === 0) {
    return [];
  }

  // Langkah 2: Kumpulkan semua ID yang dibutuhkan untuk relasi
  const storageIds = [...new Set(historyData.map(h => h.storage_id).filter(Boolean))];
  const profileIds = [...new Set(historyData.map(h => h.washed_by_id).filter(Boolean))];

  // Langkah 3: Ambil data pendukung (storages dan profiles) dalam query terpisah
  const { data: storages } = await supabase.from('storages').select('id, storage_code, feet, type').in('id', storageIds);
  const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', profileIds);

  // Langkah 4: Buat Peta (Map) untuk pencocokan data yang cepat
  const storagesMap = new Map((storages || []).map(s => [s.id, s]));
  const profilesMap = new Map((profiles || []).map(p => [p.id, p.name]));

  // Langkah 5: Gabungkan semua data secara manual. Ini jauh lebih aman.
  const finalHistoryList = historyData.map(record => {
    const asset = storagesMap.get(record.storage_id);
    const washedBy = profilesMap.get(record.washed_by_id);

    // Kita hanya akan menampilkan data jika asetnya ada.
    if (!asset) {
      return null;
    }

    return {
      id: record.id,
      tanggal: new Date(record.washed_at).toLocaleDateString('id-ID'),
      assetType: 'Storage', // Asumsi saat ini hanya storage
      kodeAset: asset.storage_code,
      tipeFeet: asset.feet ? String(asset.feet) : (asset.type || null),
      diliputOleh: washedBy || 'N/A', // Jika pencuci tidak ada, tampilkan N/A
      keterangan: record.notes,
    };
  }).filter((item): item is HistoryItem => item !== null);

  return finalHistoryList;
}

export default async function HistoryPage() {
  const historyData = await getWashingHistory();
  return (
    <WashingListClient initialHistoryData={historyData} />
  );
}
