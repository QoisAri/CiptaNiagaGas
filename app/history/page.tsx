import { createClient } from '@/utils/supabase/server';
import { WashingListClient } from './WashingListClient';
import { type HistoryItem } from './action'; 

const ITEMS_PER_PAGE = 50;

async function getWashingHistory({ 
    currentPage, 
    tipeFeet, 
    dateRange 
}: { 
    currentPage: number, 
    tipeFeet?: string, 
    dateRange?: string 
}): Promise<{ data: HistoryItem[], totalCount: number }> {
    const supabase = createClient();
    
    // ## PERBAIKAN FINAL untuk Filter ##

    // 1. Dapatkan ID storage yang sesuai terlebih dahulu jika ada filter
    let storageIdsToFilter: string[] | null = null;
    if (tipeFeet && tipeFeet !== 'all') {
        const { data: storages } = await supabase
            .from('storages')
            .select('id')
            .eq('feet', Number(tipeFeet)); // Pastikan filter dikonversi ke Angka

        storageIdsToFilter = (storages || []).map(s => s.id);

        // Jika tidak ada storage yang cocok, langsung kembalikan data kosong
        if (storageIdsToFilter.length === 0) {
            return { data: [], totalCount: 0 };
        }
    }
    
    // 2. Buat query dasar ke washing_history
    let query = supabase.from('washing_history').select(`*, profiles(id, name)`, { count: 'exact' });

    // 3. Terapkan filter storage_id jika ada
    if (storageIdsToFilter) {
        query = query.in('storage_id', storageIdsToFilter);
    }

    // 4. Terapkan filter tanggal
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    if (dateRange) {
        switch(dateRange) {
            case 'harian': query = query.gte('washed_at', startOfToday.toISOString()); break;
            case 'mingguan': query = query.gte('washed_at', startOfWeek.toISOString()); break;
            case 'bulanan': query = query.gte('washed_at', startOfMonth.toISOString()); break;
            case 'tahunan': query = query.gte('washed_at', startOfYear.toISOString()); break;
        }
    }
    
    // 5. Terapkan pengurutan & pagination
    query = query.order('washed_at', { ascending: false });
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data: historyData, error: historyError, count } = await query;
    if (historyError || !historyData) {
        console.error("Error fetching washing history:", historyError?.message);
        return { data: [], totalCount: 0 };
    }

    // 6. Ambil data storage untuk item yang sudah di-join
    const storageIds = [...new Set(historyData.map(h => h.storage_id).filter(Boolean))];
    const { data: storages } = await supabase.from('storages').select('id, storage_code, feet, type').in('id', storageIds);
    const storagesMap = new Map((storages || []).map(s => [s.id, s]));

    // 7. Mapping data
    const finalHistoryList = historyData.map(record => {
        // @ts-ignore
        const washedBy = record.profiles;
        const asset = record.storage_id ? storagesMap.get(record.storage_id) : null;
        
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
    }).filter((item): item is HistoryItem => item !== null);

    return { data: finalHistoryList, totalCount: count ?? 0 };
}

export default async function HistoryPage({ searchParams }: { searchParams: { feet?: string; range?: string; page?: string; }}) {
    const currentPage = Number(searchParams.page) || 1;
    // Ganti nama parameter dari 'feet' ke 'tipeFeet' agar konsisten
    const { data: historyData, totalCount } = await getWashingHistory({
        currentPage,
        tipeFeet: searchParams.feet, 
        dateRange: searchParams.range
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

