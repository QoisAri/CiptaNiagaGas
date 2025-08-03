import MaintenanceListClient from './MaintenanceListClient';
import { createClient } from '@/utils/supabase/server';

async function getMaintenanceData() {
  const supabase = createClient();

  // PERBAIKAN: Mengambil kolom 'feet' dari tabel 'storages' dan 'chassis'
  const { data, error } = await supabase
    .from('maintenance_records')
    .select(`
      id, notes, repaired_at,
      repaired_by:profiles ( name ),
      inspection_results (
        inspection_items ( name ),
        inspections (
          tanggal,
          heads ( head_code, feet ),
          chassis ( chassis_code, feet ), 
          storages ( storage_code, feet )
        )
      )
    `)
    .order('repaired_at', { ascending: false });

  if (error) {
    console.error('Error fetching maintenance records:', error);
    return [];
  }

  const maintenanceList = data.map(record => {
    const result = Array.isArray(record.inspection_results) ? record.inspection_results[0] : record.inspection_results;
    if (!result) return null;
    const inspection = Array.isArray(result.inspections) ? result.inspections[0] : result.inspections;
    if (!inspection) return null;
    const item = Array.isArray(result.inspection_items) ? result.inspection_items[0] : result.inspection_items;
    const repairedBy = Array.isArray(record.repaired_by) ? record.repaired_by[0] : record.repaired_by;
    const headData = Array.isArray(inspection.heads) ? inspection.heads[0] : inspection.heads;
    const chassisData = Array.isArray(inspection.chassis) ? inspection.chassis[0] : inspection.chassis;
    const storageData = Array.isArray(inspection.storages) ? inspection.storages[0] : inspection.storages;

    let assetType = '';
    let kodeAset = '';
    let tipeFeetDisplay: string | null = null;
    let tipeFeetValue: string | null = null;

    if (headData) {
      assetType = 'Head';
      kodeAset = headData.head_code;
      tipeFeetDisplay = `${headData.feet} Feet`;
      tipeFeetValue = String(headData.feet);
    } else if (chassisData) {
      assetType = 'Chassis';
      kodeAset = chassisData.chassis_code;
      tipeFeetDisplay = `${chassisData.feet} Feet`; 
      tipeFeetValue = String(chassisData.feet);
    } else if (storageData) {
      assetType = 'Storage';
      kodeAset = storageData.storage_code;
      // PERBAIKAN: Menggunakan kolom 'feet' untuk Storage juga
      tipeFeetDisplay = `${storageData.feet} Feet`; 
      tipeFeetValue = String(storageData.feet);
    } else {
      return null;
    }

    return {
      id: record.id,
      tglDitemukan: new Date(inspection.tanggal).toLocaleDateString('id-ID'),
      assetType,
      kodeAset,
      tipeFeetDisplay,
      tipeFeetValue,
      deskripsiMasalah: item?.name || 'N/A',
      tglSelesai: new Date(record.repaired_at).toLocaleDateString('id-ID'),
      rawTglSelesai: record.repaired_at,
      keterangan: `${record.notes || ''} (Diperbaiki oleh: ${repairedBy?.name || 'N/A'})`,
    };
  }).filter(Boolean);

  return maintenanceList;
}

export default async function MaintenancePage() {
  const maintenanceData = await getMaintenanceData();
  return (
    <MaintenanceListClient initialMaintenanceData={maintenanceData as any[]} />
  );
}
