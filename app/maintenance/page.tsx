import MaintenanceListClient from './MaintenanceListClient';
import { createClient } from '@/utils/supabase/server';

export type MaintenanceItem = {
  id: string;
  tglDitemukan: string;
  assetType: string;
  kodeAset: string;
  tipeFeetDisplay: string | null;
  tipeFeetValue: string | null;
  deskripsiMasalah: string;
  tglSelesai: string;
  rawTglSelesai: string;
  keterangan: string;
  problemPhotoUrl: string | null; 
  repairPhotoUrl: string | null; 
};

type AssetInfo = {
  type: 'Head' | 'Chassis' | 'Storage';
  code: string;
  feet: number;
};

const ITEMS_PER_PAGE = 50;

// Fungsi getMaintenanceData sekarang menerima parameter untuk pagination dan filter
async function getMaintenanceData({ 
    currentPage,
    tipeAset,
    tipeFeet
}: {
    currentPage: number;
    tipeAset?: string;
    tipeFeet?: string;
}): Promise<{ data: MaintenanceItem[], totalCount: number }> {
    const supabase = createClient();
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    // Kita perlu mengambil semua ID dulu untuk melakukan filter yang kompleks
    let initialQuery = supabase.from('maintenance_records').select('id');

    // Karena filter tipeAset dan tipeFeet ada di tabel relasi,
    // kita perlu mengambil semua data dulu lalu memfilternya di server-side.
    // Ini kurang efisien untuk dataset besar, tapi cara paling akurat dengan struktur Anda saat ini.
    const { data: allRecords, error: allRecordsError } = await supabase
        .from('maintenance_records')
        .select('*')
        .order('repaired_at', { ascending: false });

    if (allRecordsError) {
        console.error('Error fetching all maintenance records:', allRecordsError);
        return { data: [], totalCount: 0 };
    }
    if (!allRecords) return { data: [], totalCount: 0 };

    // Logika join dan mapping data yang kompleks (tidak berubah)
    const inspectionResultIds = allRecords.map(r => r.inspection_result_id).filter(Boolean);
    const problemReportIds = allRecords.map(r => r.problem_report_id).filter(Boolean);
    const profileIds = allRecords.map(r => r.repaired_by_id).filter(Boolean);
    const { data: results } = await supabase.from('inspection_results').select('id, item_id, inspection_id, problem_photo_url').in('id', inspectionResultIds);
    const { data: reports } = await supabase.from('problem_reports').select('id, item_id, head_id, chassis_id, storage_id, reported_at, problem_photo_url').in('id', problemReportIds);
    const inspectionIdsFromResult = results?.map(r => r.inspection_id) || [];
    const itemIdsFromResult = results?.map(r => r.item_id) || [];
    const itemIdsFromReport = reports?.map(r => r.item_id) || [];
    const { data: inspections } = await supabase.from('inspections').select('id, tanggal, head_id, chassis_id, storage_id').in('id', inspectionIdsFromResult);
    const { data: items } = await supabase.from('inspection_items').select('id, name').in('id', [...itemIdsFromResult, ...itemIdsFromReport]);
    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', profileIds);
    const headIds = [...new Set([...(inspections?.map(i => i.head_id) || []), ...(reports?.map(r => r.head_id) || [])].filter(Boolean))];
    const chassisIds = [...new Set([...(inspections?.map(i => i.chassis_id) || []), ...(reports?.map(r => r.chassis_id) || [])].filter(Boolean))];
    const storageIds = [...new Set([...(inspections?.map(i => i.storage_id) || []), ...(reports?.map(r => r.storage_id) || [])].filter(Boolean))];
    const { data: heads } = await supabase.from('heads').select('id, head_code, feet').in('id', headIds);
    const { data: chassis } = await supabase.from('chassis').select('id, chassis_code, feet').in('id', chassisIds);
    const { data: storages } = await supabase.from('storages').select('id, storage_code, feet').in('id', storageIds);
    const resultsMap = new Map(results?.map(r => [r.id, { ...r }]));
    const reportsMap = new Map(reports?.map(r => [r.id, { ...r }]));
    const inspectionsMap = new Map(inspections?.map(i => [i.id, i]));
    const itemsMap = new Map(items?.map(i => [i.id, i.name]));
    const profilesMap = new Map(profiles?.map(p => [p.id, p.name]));
    const assetEntries: [string, AssetInfo][] = [
        ...(heads || []).map((h): [string, AssetInfo] => [h.id, { type: 'Head', code: h.head_code, feet: h.feet }]),
        ...(chassis || []).map((c): [string, AssetInfo] => [c.id, { type: 'Chassis', code: c.chassis_code, feet: c.feet }]),
        ...(storages || []).map((s): [string, AssetInfo] => [s.id, { type: 'Storage', code: s.storage_code, feet: s.feet }]),
    ];
    const assetsMap = new Map<string, AssetInfo>(assetEntries);

    const fullMaintenanceList = allRecords.map((record): MaintenanceItem | null => {
        let tglDitemukan: string | null = null;
        let deskripsiMasalah: string | null = null;
        let assetId: string | null = null;
        let problemPhotoUrl: string | null = null; 
        if (record.problem_report_id) {
            const report = reportsMap.get(record.problem_report_id);
            if (report) {
                tglDitemukan = new Date(report.reported_at).toLocaleDateString('id-ID');
                deskripsiMasalah = itemsMap.get(report.item_id) || 'N/A';
                assetId = report.head_id || report.chassis_id || report.storage_id;
                problemPhotoUrl = report.problem_photo_url;
            }
        } 
        else if (record.inspection_result_id) {
            const result = resultsMap.get(record.inspection_result_id);
            if (result) {
                const inspection = inspectionsMap.get(result.inspection_id);
                if(inspection) {
                    tglDitemukan = new Date(inspection.tanggal).toLocaleDateString('id-ID');
                    deskripsiMasalah = itemsMap.get(result.item_id) || 'N/A';
                    assetId = inspection.head_id || inspection.chassis_id || inspection.storage_id;
                    problemPhotoUrl = result.problem_photo_url;
                }
            }
        }
        if (!assetId || !tglDitemukan) return null;
        const asset = assetsMap.get(assetId);
        if (!asset) return null;
        const repairedBy = profilesMap.get(record.repaired_by_id);
        return {
            id: record.id,
            tglDitemukan,
            assetType: asset.type,
            kodeAset: asset.code,
            tipeFeetDisplay: asset.feet ? `${asset.feet} Feet` : null,
            tipeFeetValue: asset.feet ? String(asset.feet) : null,
            deskripsiMasalah: deskripsiMasalah || 'N/A',
            tglSelesai: new Date(record.repaired_at).toLocaleDateString('id-ID'),
            rawTglSelesai: record.repaired_at,
            keterangan: `${record.notes || ''} (Diperbaiki oleh: ${repairedBy || 'N/A'})`,
            problemPhotoUrl: problemPhotoUrl,
            repairPhotoUrl: record.repair_photo_url,
        };
    }).filter((item): item is MaintenanceItem => item !== null);

    // Terapkan filter di sini
    const filteredList = fullMaintenanceList.filter(item => {
        const assetFilterMatch = !tipeAset || tipeAset === 'all' || item.assetType.toLowerCase() === tipeAset;
        const feetFilterMatch = !tipeFeet || tipeFeet === 'all' || item.tipeFeetValue === tipeFeet;
        return assetFilterMatch && feetFilterMatch;
    });

    const totalCount = filteredList.length;
    const paginatedData = filteredList.slice(from, to + 1);

    return { data: paginatedData, totalCount };
}

export default async function MaintenancePage({
    searchParams
}: {
    searchParams: { page?: string; tipeAset?: string; tipeFeet?: string; }
}) {
    const currentPage = Number(searchParams.page) || 1;
    const { data: maintenanceData, totalCount } = await getMaintenanceData({
        currentPage,
        tipeAset: searchParams.tipeAset,
        tipeFeet: searchParams.tipeFeet
    });

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <MaintenanceListClient 
            initialMaintenanceData={maintenanceData} 
            currentPage={currentPage}
            totalPages={totalPages}
        />
    );
}
