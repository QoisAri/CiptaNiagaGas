import { createClient } from '../../utils/supabase/server';
import UrgentFixClient from './UrgentFixClient';

export type ProblemReport = {
  id: string;
  tanggalLapor: string;
  tipeAset: string;
  kodeAset: string;
  deskripsiMasalah: string;
  itemRusak: string;
  pelapor: string;
  status: string;
  deadline: string;
  problemPhotoUrl: string | null;
};

const ExclamationTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="text-red-600 w-7 h-7">
    <path fillRule="evenodd" d="M9.401 3.003c1.155-2.002 4.043-2.002 5.197 0l7.356 12.742c1.155 2.002-.728 4.5-3.13 4.5H5.175c-2.402 0-4.285-2.498-3.13-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
  </svg>
);

const ITEMS_PER_PAGE = 50;

async function getProblemReports({ 
    currentPage 
}: { 
    currentPage: number 
}): Promise<{ data: ProblemReport[], totalCount: number }> {
    const supabase = createClient();
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data: reports, error: reportsError, count } = await supabase
        .from('problem_reports')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (reportsError) {
        console.error('Error fetching problem reports:', reportsError.message);
        return { data: [], totalCount: 0 };
    }
    if (!reports) {
        return { data: [], totalCount: 0 };
    }

    // Logika join dan mapping data yang kompleks (tidak berubah)
    const profileIds = new Set<string>();
    const itemIds = new Set<string>();
    const headIds = new Set<string>();
    const chassisIds = new Set<string>();
    const storageIds = new Set<string>();
    reports.forEach(r => {
        if (r.reported_by_id) profileIds.add(r.reported_by_id);
        if (r.item_id) itemIds.add(r.item_id);
        if (r.head_id) headIds.add(r.head_id);
        if (r.chassis_id) chassisIds.add(r.chassis_id);
        if (r.storage_id) storageIds.add(r.storage_id);
    });
    const [{ data: profiles }, { data: items }, { data: heads }, { data: chassis }, { data: storages }] = await Promise.all([
        supabase.from('profiles').select('id, name').in('id', Array.from(profileIds)),
        supabase.from('inspection_items').select('id, name').in('id', Array.from(itemIds)),
        supabase.from('heads').select('id, head_code').in('id', Array.from(headIds)),
        supabase.from('chassis').select('id, chassis_code').in('id', Array.from(chassisIds)),
        supabase.from('storages').select('id, storage_code').in('id', Array.from(storageIds))
    ]);
    const profilesMap = new Map((profiles || []).map(p => [p.id, p.name]));
    const itemsMap = new Map((items || []).map(i => [i.id, i.name]));
    const headsMap = new Map((heads || []).map(h => [h.id, h.head_code]));
    const chassisMap = new Map((chassis || []).map(c => [c.id, c.chassis_code]));
    const storagesMap = new Map((storages || []).map(s => [s.id, s.storage_code]));

    const finalData = reports.map(report => {
        let assetType = 'Tidak Diketahui';
        let assetCode = 'N/A';
        if (report.head_id) {
            assetType = 'Head';
            assetCode = headsMap.get(report.head_id) || 'N/A';
        } else if (report.chassis_id) {
            assetType = 'Casis';
            assetCode = chassisMap.get(report.chassis_id) || 'N/A';
        } else if (report.storage_id) {
            assetType = 'Storage';
            assetCode = storagesMap.get(report.storage_id) || 'N/A';
        }
        return {
            id: report.id,
            tanggalLapor: new Date(report.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
            tipeAset: assetType,
            kodeAset: assetCode,
            deskripsiMasalah: report.problem_notes,
            itemRusak: itemsMap.get(report.item_id) || 'N/A',
            pelapor: profilesMap.get(report.reported_by_id) || 'Pengguna tidak dikenal',
            status: report.status,
            deadline: report.deadline_date ? new Date(report.deadline_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-',
            problemPhotoUrl: report.problem_photo_url,
        };
    });
    
    return { data: finalData, totalCount: count ?? 0 };
}

export default async function UrgentFixPage({
    searchParams
}: {
    searchParams: { page?: string; }
}) {
    const currentPage = Number(searchParams.page) || 1;
    const { data: reports, totalCount } = await getProblemReports({ currentPage });
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-6">
                <ExclamationTriangleIcon />
                <h1 className="text-2xl font-bold text-gray-800">Urgent Fix</h1>
            </div>
            <UrgentFixClient 
                reports={reports}
                currentPage={currentPage}
                totalPages={totalPages}
            />
        </div>
    );
}
