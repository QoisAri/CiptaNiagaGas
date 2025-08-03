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
};

// PERBAIKAN: Menambahkan tipe spesifik untuk data aset di dalam Map
type AssetInfo = {
  type: 'Head' | 'Chassis' | 'Storage';
  code: string;
  feet: number;
};

// Pendekatan baru yang lebih aman untuk mengambil data
async function getMaintenanceData(): Promise<MaintenanceItem[]> {
  const supabase = createClient();

  // 1. Ambil data utama dari maintenance_records
  const { data: records, error: recordsError } = await supabase
    .from('maintenance_records')
    .select('*')
    .order('repaired_at', { ascending: false });

  if (recordsError) {
    console.error('Error fetching maintenance records:', recordsError);
    return [];
  }
  if (!records || records.length === 0) return [];

  // 2. Kumpulkan semua ID yang dibutuhkan dari berbagai kolom relasi
  const inspectionResultIds = records.map(r => r.inspection_result_id).filter(Boolean);
  const problemReportIds = records.map(r => r.problem_report_id).filter(Boolean);
  const profileIds = records.map(r => r.repaired_by_id).filter(Boolean);

  // 3. Ambil data pendukung berdasarkan ID yang sudah dikumpulkan
  // Data dari Inspection Results
  const { data: results } = await supabase.from('inspection_results').select('id, item_id, inspection_id').in('id', inspectionResultIds);
  // Data dari Problem Reports
  const { data: reports } = await supabase.from('problem_reports').select('id, item_id, head_id, chassis_id, storage_id, reported_at').in('id', problemReportIds);
  
  // Kumpulkan ID lanjutan dari hasil query di atas
  const inspectionIdsFromResult = results?.map(r => r.inspection_id) || [];
  const itemIdsFromResult = results?.map(r => r.item_id) || [];
  const itemIdsFromReport = reports?.map(r => r.item_id) || [];
  
  // Ambil data Inspections, Items, dan Profiles
  const { data: inspections } = await supabase.from('inspections').select('id, tanggal, head_id, chassis_id, storage_id').in('id', inspectionIdsFromResult);
  const { data: items } = await supabase.from('inspection_items').select('id, name').in('id', [...itemIdsFromResult, ...itemIdsFromReport]);
  const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', profileIds);

  // Kumpulkan ID Aset (Head, Chassis, Storage)
  const headIds = [...new Set([...(inspections?.map(i => i.head_id) || []), ...(reports?.map(r => r.head_id) || [])].filter(Boolean))];
  const chassisIds = [...new Set([...(inspections?.map(i => i.chassis_id) || []), ...(reports?.map(r => r.chassis_id) || [])].filter(Boolean))];
  const storageIds = [...new Set([...(inspections?.map(i => i.storage_id) || []), ...(reports?.map(r => r.storage_id) || [])].filter(Boolean))];

  // Ambil data detail Aset
  const { data: heads } = await supabase.from('heads').select('id, head_code, feet').in('id', headIds);
  const { data: chassis } = await supabase.from('chassis').select('id, chassis_code, feet').in('id', chassisIds);
  const { data: storages } = await supabase.from('storages').select('id, storage_code, feet').in('id', storageIds);

  // 4. Buat Peta (Map) untuk pencocokan data yang super cepat
  const resultsMap = new Map(results?.map(r => [r.id, r]));
  const reportsMap = new Map(reports?.map(r => [r.id, r]));
  const inspectionsMap = new Map(inspections?.map(i => [i.id, i]));
  const itemsMap = new Map(items?.map(i => [i.id, i.name]));
  const profilesMap = new Map(profiles?.map(p => [p.id, p.name]));
  
  // PERBAIKAN: Membuat array terlebih dahulu dengan tipe yang benar
  const assetEntries: [string, AssetInfo][] = [
    ...(heads || []).map((h): [string, AssetInfo] => [h.id, { type: 'Head', code: h.head_code, feet: h.feet }]),
    ...(chassis || []).map((c): [string, AssetInfo] => [c.id, { type: 'Chassis', code: c.chassis_code, feet: c.feet }]),
    ...(storages || []).map((s): [string, AssetInfo] => [s.id, { type: 'Storage', code: s.storage_code, feet: s.feet }]),
  ];
  const assetsMap = new Map<string, AssetInfo>(assetEntries);

  // 5. Gabungkan semua data menjadi satu format yang rapi
  const maintenanceList = records.map((record): MaintenanceItem | null => {
    let tglDitemukan: string | null = null;
    let deskripsiMasalah: string | null = null;
    let assetId: string | null = null;

    // Skenario 1: Data berasal dari Laporan Masalah (Problem Report)
    if (record.problem_report_id) {
        const report = reportsMap.get(record.problem_report_id);
        if (report) {
            tglDitemukan = new Date(report.reported_at).toLocaleDateString('id-ID');
            deskripsiMasalah = itemsMap.get(report.item_id) || 'N/A';
            assetId = report.head_id || report.chassis_id || report.storage_id;
        }
    } 
    // Skenario 2: Data berasal dari Hasil Inspeksi
    else if (record.inspection_result_id) {
        const result = resultsMap.get(record.inspection_result_id);
        if (result) {
            const inspection = inspectionsMap.get(result.inspection_id);
            if(inspection) {
                tglDitemukan = new Date(inspection.tanggal).toLocaleDateString('id-ID');
                deskripsiMasalah = itemsMap.get(result.item_id) || 'N/A';
                assetId = inspection.head_id || inspection.chassis_id || inspection.storage_id;
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
    };
  }).filter((item): item is MaintenanceItem => item !== null);

  return maintenanceList;
}

export default async function MaintenancePage() {
  const maintenanceData = await getMaintenanceData();
  return (
    <MaintenanceListClient initialMaintenanceData={maintenanceData} />
  );
}
