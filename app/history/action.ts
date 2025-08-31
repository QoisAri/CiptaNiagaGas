'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';

export type HistoryItem = {
  id: string;
  tanggal: string;
  assetType: 'Storage' | 'Head' | 'Casis';
  kodeAset: string;
  tipeFeet: string | null;
  diliputOleh: string;
  keterangan: string | null;
};

export async function deleteWashingHistory(formData: FormData) {
  const historyId = formData.get('historyId') as string;
  if (!historyId) return;
  const supabase = createClient();
  await supabase.from('washing_history').delete().eq('id', historyId);
  revalidatePath('/history');
}

async function getAllWashingHistoryForDownload({ 
    tipeFeet, 
    dateRange 
}: { 
    tipeFeet?: string;
    dateRange?: string;
}): Promise<HistoryItem[]> {
    const supabase = createClient();

    let historyQuery = supabase.from('washing_history').select('*');
    
    // ## PERBAIKAN DI SINI ##
    if (tipeFeet && tipeFeet !== 'all') {
        // Mengubah nilai filter menjadi Angka sebelum membandingkan
        const { data: storageIdsData } = await supabase.from('storages').select('id').eq('feet', Number(tipeFeet));
        const storageIds = (storageIdsData || []).map(s => s.id);
        if (storageIds.length > 0) {
            historyQuery = historyQuery.in('storage_id', storageIds);
        } else {
            return [];
        }
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    if (dateRange) {
        switch(dateRange) {
            case 'harian': historyQuery = historyQuery.gte('washed_at', startOfToday.toISOString()); break;
            case 'mingguan': historyQuery = historyQuery.gte('washed_at', startOfWeek.toISOString()); break;
            case 'bulanan': historyQuery = historyQuery.gte('washed_at', startOfMonth.toISOString()); break;
            case 'tahunan': historyQuery = historyQuery.gte('washed_at', startOfYear.toISOString()); break;
        }
    }
    
    historyQuery = historyQuery.order('washed_at', { ascending: false });

    const { data: historyData, error } = await historyQuery;
    if (error || !historyData) return [];

    const storageIds = [...new Set(historyData.map(h => h.storage_id).filter(Boolean))];
    const profileIds = [...new Set(historyData.map(h => h.washed_by_id).filter(Boolean))];
    const { data: storages } = await supabase.from('storages').select('id, storage_code, feet, type').in('id', storageIds);
    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', profileIds);
    const storagesMap = new Map((storages || []).map(s => [s.id, s]));
    const profilesMap = new Map((profiles || []).map(p => [p.id, p.name]));

    return historyData.map(record => {
        const asset = storagesMap.get(record.storage_id);
        const washedBy = profilesMap.get(record.washed_by_id);
        if (!asset) return null;
        return {
          id: record.id,
          tanggal: new Date(record.washed_at).toLocaleDateString('id-ID'),
          assetType: 'Storage',
          kodeAset: asset.storage_code,
          tipeFeet: asset.feet ? String(asset.feet) : (asset.type || null),
          diliputOleh: washedBy || 'N/A',
          keterangan: record.notes,
        };
    }).filter((item): item is HistoryItem => item !== null);
}


export async function generateWashingHistoryReport(
    tipeFeet?: string,
    dateRange?: string
): Promise<{ file: string, fileName: string }> {
    const data = await getAllWashingHistoryForDownload({ tipeFeet, dateRange });

    const dataToExport = data.map((item, index) => ({
        'No': index + 1,
        'Tanggal': item.tanggal,
        'Kode Aset': item.kodeAset,
        'Tipe Feet': item.tipeFeet || '-',
        'Diliput Oleh': item.diliputOleh,
        'Keterangan': item.keterangan || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'History Pencucian');

    worksheet['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 40 },
    ];

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const base64 = buffer.toString('base64');

    return {
        file: base64,
        fileName: 'Laporan_History_Pencucian.xlsx'
    };
}

