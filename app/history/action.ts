// /app/history-pencucian/actions.ts

'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Tipe data ini membantu kita saat memproses data gabungan
type AssetInfo = {
  code: string;
  type: string;
};

export async function getWashingHistory() {
  const supabase = createClient();

  const { data: histories, error } = await supabase
    .from('washing_history')
    .select(`
      id,
      tanggal_pencucian,
      asset_type,
      asset_code,
      storage_id,
      profiles ( name )
    `)
    .order('tanggal_pencucian', { ascending: false });

  if (error) {
    console.error('Error fetching washing history:', error);
    return [];
  }

  // Kumpulkan semua storage_id yang ada
  const storageIds = histories.map(h => h.storage_id).filter(Boolean);

  // Ambil data hanya dari tabel storages
  const { data: storages } = await supabase.from('storages').select('id, storage_code, type').in('id', storageIds);

  // Buat "peta" untuk pencarian data storage yang cepat
  const assetsMap = new Map<string, AssetInfo>();
  storages?.forEach(s => assetsMap.set(s.id, { code: s.storage_code, type: s.type }));

  // Proses dan gabungkan data menjadi format yang diinginkan client
  return histories.map(item => {
    const assetInfo = item.storage_id ? assetsMap.get(item.storage_id) : null;

    return {
      id: item.id,
      tanggal: new Date(item.tanggal_pencucian).toLocaleDateString('id-ID'),
      // Tipe aset sekarang akan selalu Storage, atau sesuai data
      assetType: assetInfo?.type || item.asset_type,
      kodeAset: assetInfo?.code || item.asset_code,
      diliputOleh: (item.profiles as any)?.name || 'N/A',
      // tipeFeet tidak lagi relevan untuk storage
      tipeFeet: null,
    };
  });
}

export async function deleteWashingHistory(formData: FormData) {
  const historyId = formData.get('historyId') as string;
  if (!historyId) { return; }

  const supabase = createClient();
  const { error } = await supabase
    .from('washing_history')
    .delete()
    .eq('id', historyId);

  if (error) {
    console.error('Error deleting washing history:', error);
    return;
  }

  revalidatePath('/history'); // Sesuaikan dengan URL halaman Anda
}