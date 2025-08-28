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

const ITEMS_PER_PAGE = 50;

// Fungsi getWashingHistory sekarang menerima parameter
async function getWashingHistory({ 
    currentPage,
    tipeFeet
}: {
    currentPage: number;
    tipeFeet?: string;
}): Promise<{ data: HistoryItem[], totalCount: number }> {
    const supabase = createClient();

    // Karena filter 'tipeFeet' ada di tabel relasi, kita ambil semua data dulu,
    // lalu filter dan paginasi di server-side.
    const { data: historyData, error: historyError } = await supabase
        .from('washing_history')
        .select(`
            *,
            storages ( id, storage_code, feet, type ),
            profiles ( id, name )
        `)
        .order('washed_at', { ascending: false });

    if (historyError) {
        console.error("Error fetching washing history:", historyError.message);
        return { data: [], totalCount: 0 };
    }
    if (!historyData) {
        return { data: [], totalCount: 0 };
    }

    // Gabungkan dan map data
    const fullHistoryList = historyData.map(record => {
        const asset = record.storages;
        const washedBy = record.profiles;

        if (!asset) return null;

        return {
            id: record.id,
            tanggal: new Date(record.washed_at).toLocaleDateString('id-ID'),
            assetType: 'Storage', // Asumsi saat ini hanya storage
            kodeAset: asset.storage_code,
            tipeFeet: asset.feet ? String(asset.feet) : (asset.type || null),
            diliputOleh: washedBy?.name || 'N/A',
            keterangan: record.notes,
        };
    }).filter((item): item is HistoryItem => item !== null);

    // Terapkan filter di server
    const filteredList = fullHistoryList.filter(item => {
        if (!tipeFeet || tipeFeet === 'all') return true;
        return item.tipeFeet === tipeFeet;
    });

    const totalCount = filteredList.length;

    // Terapkan pagination (slice) pada data yang sudah difilter
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE;
    const paginatedData = filteredList.slice(from, to);

    return { data: paginatedData, totalCount };
}

export default async function HistoryPage({
    searchParams
}: {
    searchParams: { page?: string; tipeFeet?: string; }
}) {
    const currentPage = Number(searchParams.page) || 1;
    const { data: historyData, totalCount } = await getWashingHistory({
        currentPage,
        tipeFeet: searchParams.tipeFeet
    });

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <WashingListClient 
            initialHistoryData={historyData}
            currentPage={currentPage}
            totalPages={totalPages}
        />
    );
}
