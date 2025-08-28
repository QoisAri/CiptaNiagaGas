import { createClient } from '@/utils/supabase/server';
import PendingRepairClient from './PendingRepairClient';

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
  rawTanggalDitemukan: string; 
};

const ITEMS_PER_PAGE = 50;

async function getPendingRepairs({ 
    tipeAset, 
    currentPage,
    dateRange
}: { 
    tipeAset?: string;
    currentPage: number;
    dateRange?: string;
}) {
    const supabase = createClient();
  
    let query = supabase
        .from('pending_repairs_view') 
        .select('*')
        .order('reported_at', { ascending: true });

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching pending repairs:', error);
        return { data: [], totalCount: 0 };
    }

    if (!data) return { data: [], totalCount: 0 };

    const mappedData: PendingRepairItem[] = data.map((item: any) => ({
        id: item.result_id || item.problem_report_id,
        tanggalDitemukan: new Date(item.reported_at).toLocaleDateString('id-ID'),
        rawTanggalDitemukan: item.reported_at,
        tipeAset: item.unit_type || 'N/A', 
        kodeAset: item.unit_code || 'N/A',
        tipeFeetDisplay: item.feet ? `${item.feet} Feet` : 'N/A',
        itemBermasalah: item.item_name,
        keterangan: item.problem_notes,
        pelapor: item.reported_by,
        problemPhotoUrl: item.problem_photo_url,
    }));

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const filteredList = mappedData.filter(item => {
        const itemDate = new Date(item.rawTanggalDitemukan);

        let dateMatch = true;
        if (dateRange) {
            switch(dateRange) {
                case 'harian':
                    dateMatch = itemDate >= startOfToday;
                    break;
                case 'mingguan':
                    dateMatch = itemDate >= startOfWeek;
                    break;
                case 'bulanan':
                    dateMatch = itemDate >= startOfMonth;
                    break;
                case 'tahunan':
                    dateMatch = itemDate >= startOfYear;
                    break;
            }
        }

        // --- PERBAIKAN DI SINI ---
        // Memastikan perbandingan tidak case-sensitive (tidak peduli huruf besar/kecil)
        const assetMatch = !tipeAset || tipeAset === 'all' || item.tipeAset.toLowerCase() === tipeAset.toLowerCase();
        
        return dateMatch && assetMatch;
    });
    
    const totalCount = filteredList.length;
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE;
    const paginatedData = filteredList.slice(from, to);

    return { data: paginatedData, totalCount };
}

export default async function PerluPerbaikanPage({ 
  searchParams 
}: { 
  searchParams: { tipeAset?: string; page?: string; range?: string; };
}) {
    const currentPage = Number(searchParams.page) || 1;
    const { data: pendingData, totalCount } = await getPendingRepairs({ 
        tipeAset: searchParams.tipeAset,
        currentPage,
        dateRange: searchParams.range,
    });

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <PendingRepairClient 
            initialData={pendingData} 
            currentPage={currentPage}
            totalPages={totalPages}
        />
    );
}
