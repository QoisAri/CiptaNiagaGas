import { createClient } from '@/utils/supabase/server';
import { WashingHistoryClient } from './WashingListClient';

async function getWashingHistory() {
  const supabase = createClient();

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
    console.error('Error fetching washing history:', error.message);
    return [];
  }

  const historyList = data.map(record => {
    const asset = Array.isArray(record.storages) ? record.storages[0] : record.storages;
    const washedBy = Array.isArray(record.washed_by) ? record.washed_by[0] : record.washed_by;

    if (!asset) return null;

    return {
      id: record.id,
      tanggal: new Date(record.washed_at).toLocaleDateString('id-ID'),
      assetType: 'Storage',
      kodeAset: asset.storage_code,
      tipeFeet: asset.feet ? String(asset.feet) : (asset.type || null),
      diliputOleh: washedBy?.name || 'N/A',
      keterangan: record.notes,
    };
  }).filter(Boolean);

  return historyList;
}

export default async function WashingHistoryPage() {
  const historyData = await getWashingHistory();
  return (
    <WashingHistoryClient initialHistoryData={historyData as any[]} />
  );
}
