'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';
import { type ProblemReport } from './page'; // Impor tipe dari page.tsx

// --- FUNGSI UNTUK MENGUNDUH LAPORAN EXCEL ---
async function getAllProblemReportsForExcel(dateRange?: string): Promise<Omit<ProblemReport, 'id' | 'problemPhotoUrl' | 'rawTanggalLapor'>[]> {
    const supabase = createClient();

    let query = supabase
        .from('problem_reports')
        .select('*')
        .order('created_at', { ascending: false });

    if (dateRange && dateRange !== 'all') {
        const now = new Date();
        let startDate: Date | null = null;

        switch(dateRange) {
            case 'harian':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'mingguan':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - now.getDay());
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'bulanan':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'tahunan':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
        }
        if (startDate) {
            query = query.gte('created_at', startDate.toISOString());
        }
    }

    const { data: reports, error } = await query;

    if (error) {
        console.error("Error fetching problem reports for excel:", error);
        return [];
    }
    if (!reports) return [];

    // Logika join dan mapping data yang kompleks
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

    return reports.map(report => {
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
            tanggalLapor: new Date(report.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
            tipeAset: assetType,
            kodeAset: assetCode,
            itemRusak: report.customTitle || itemsMap.get(report.item_id) || 'N/A',
            deskripsiMasalah: report.problem_notes,
            pelapor: profilesMap.get(report.reported_by_id) || 'Pengguna tidak dikenal',
            deadline: report.deadline_date ? new Date(report.deadline_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-',
            status: report.status,
        };
    });
}

export async function generateUrgentFixReport(dateRange: string) {
    const dataToExport = await getAllProblemReportsForExcel(dateRange);

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Urgent Fix');

    worksheet['!cols'] = [
        { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, 
        { wch: 40 }, { wch: 25 }, { wch: 20 }, { wch: 15 }
    ];

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const base64 = Buffer.from(buffer).toString('base64');
    
    const fileName = `Laporan_Urgent_Fix_${dateRange}_${new Date().toISOString().split('T')[0]}.xlsx`;

    return { file: base64, fileName };
}

// --- FUNGSI UNTUK MENGHAPUS LAPORAN ---
export async function deleteProblemReport(formData: FormData) {
  const reportId = formData.get('reportId') as string;

  if (!reportId) {
    console.error('Gagal menghapus: ID laporan tidak ditemukan.');
    return;
  }

  const supabase = createClient();
  
  const { error } = await supabase
    .from('problem_reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    console.error('Error deleting problem report:', error);
    return; 
  }

  // Perbarui path agar sesuai dengan URL halaman Anda
  revalidatePath('/urgent-fix'); 
}
