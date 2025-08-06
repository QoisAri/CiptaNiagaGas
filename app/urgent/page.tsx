import { createClient } from '../../utils/supabase/server';

// Tipe data untuk hasil akhir yang akan ditampilkan di tabel
type ProblemReport = {
  id: string;
  tanggalLapor: string;
  tipeAset: string;
  kodeAset: string;
  deskripsiMasalah: string;
  itemRusak: string;
  pelapor: string;
  status: string;
  deadline: string;
};

// Komponen SVG untuk menggantikan FaExclamationTriangle dari react-icons
const ExclamationTriangleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-red-600 w-7 h-7" // Menggunakan w-7 h-7 untuk ukuran mendekati 28px
  >
    <path
      fillRule="evenodd"
      d="M9.401 3.003c1.155-2.002 4.043-2.002 5.197 0l7.356 12.742c1.155 2.002-.728 4.5-3.13 4.5H5.175c-2.402 0-4.285-2.498-3.13-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
      clipRule="evenodd"
    />
  </svg>
);


/**
 * Fungsi ini mengambil data laporan masalah dari Supabase,
 * menggabungkannya dengan data dari tabel lain (profiles, items, assets),
 * dan mengembalikannya dalam format yang siap ditampilkan.
 */
async function getProblemReports(): Promise<ProblemReport[]> {
  const supabase = createClient();

  // --- LANGKAH 1: Ambil data utama dari tabel problem_reports ---
  const { data: reports, error: reportsError } = await supabase
    .from('problem_reports')
    .select('*')
    .order('created_at', { ascending: false });

  // Penanganan jika terjadi error saat mengambil data
  if (reportsError) {
    console.error('Error fetching problem reports:', reportsError.message);
    return [];
  }
  // Penanganan jika tidak ada data yang ditemukan
  if (!reports || reports.length === 0) {
    return [];
  }

  // --- LANGKAH 2: Kumpulkan semua ID yang dibutuhkan untuk query selanjutnya ---
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
  
  // --- LANGKAH 3: Ambil data pendukung dalam beberapa query terpisah ---
  const [
    { data: profiles },
    { data: items },
    { data: heads },
    { data: chassis },
    { data: storages }
  ] = await Promise.all([
    supabase.from('profiles').select('id, name').in('id', Array.from(profileIds)),
    supabase.from('inspection_items').select('id, name').in('id', Array.from(itemIds)),
    supabase.from('heads').select('id, head_code').in('id', Array.from(headIds)),
    supabase.from('chassis').select('id, chassis_code').in('id', Array.from(chassisIds)),
    supabase.from('storages').select('id, storage_code').in('id', Array.from(storageIds))
  ]);

  // --- LANGKAH 4: Buat Peta (Map) untuk pencocokan data yang cepat (O(1) lookup) ---
  const profilesMap = new Map((profiles || []).map(p => [p.id, p.name]));
  const itemsMap = new Map((items || []).map(i => [i.id, i.name]));
  const headsMap = new Map((heads || []).map(h => [h.id, h.head_code]));
  const chassisMap = new Map((chassis || []).map(c => [c.id, c.chassis_code]));
  const storagesMap = new Map((storages || []).map(s => [s.id, s.storage_code]));

  // --- LANGKAH 5: Gabungkan semua data menjadi satu format yang rapi ---
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
    };
  });
  
  return finalData;
}

/**
 * Komponen Halaman (Page Component) untuk menampilkan daftar perbaikan mendesak.
 */
export default async function UrgentFixPage() {
  const reports = await getProblemReports();

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'selesai':
      case 'diperbaiki':
        return 'bg-green-100 text-green-800';
      case 'dikerjakan':
        return 'bg-yellow-100 text-yellow-800';
      case 'menunggu':
      case 'baru':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <ExclamationTriangleIcon />
        <h1 className="text-2xl font-bold text-gray-800">Urgent Fix</h1>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Tanggal Lapor</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Tipe Aset</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Kode Aset</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Item Rusak</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Deskripsi Masalah</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Pelapor</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Deadline</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {reports.length > 0 ? (
              reports.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-4 py-3 border-b text-gray-900 whitespace-nowrap">{item.tanggalLapor}</td>
                  <td className="px-4 py-3 border-b text-gray-900">{item.tipeAset}</td>
                  <td className="px-4 py-3 border-b text-gray-900 font-semibold">{item.kodeAset}</td>
                  <td className="px-4 py-3 border-b text-gray-900">{item.itemRusak}</td>
                  <td className="px-4 py-3 border-b text-gray-900 min-w-[200px]">{item.deskripsiMasalah}</td>
                  <td className="px-4 py-3 border-b text-gray-900">{item.pelapor}</td>
                  <td className="px-4 py-3 border-b text-gray-900 whitespace-nowrap">{item.deadline}</td>
                  <td className="px-4 py-3 border-b text-gray-900">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500">
                  Tidak ada laporan perbaikan mendesak.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
