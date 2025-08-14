import { createClient } from '@/utils/supabase/server';
import PendingRepairClient from './PendingRepairClient';
import Link from 'next/link';

// Komponen untuk Form Filter
function FilterForm({ tipeAset }: { tipeAset?: string }) {
  return (
    <form className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
      <div>
        <label htmlFor="tipeAset" className="block text-sm font-medium text-gray-700">Filter Tipe Aset</label>
        <select 
          id="tipeAset"
          name="tipeAset"
          defaultValue={tipeAset || 'all'} 
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"
        >
          <option value="all">Semua Tipe</option>
          <option value="Head">Head</option>
          <option value="Chassis">Casis</option>
          <option value="Storage">Storage</option>
        </select>
      </div>
       {/* Spacer agar tombol di kanan */}
      <div></div>
      <div className="flex space-x-2 items-end">
        <button type="submit" className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
          Cari
        </button>
        <Link href="/perlu-perbaikan" className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
          Clear
        </Link>
      </div>
    </form>
  );
}

// Tipe data untuk setiap item perbaikan yang tertunda
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
};

// Fungsi getPendingRepairs sekarang menerima parameter filter
async function getPendingRepairs({ tipeAset }: { tipeAset?: string }): Promise<PendingRepairItem[]> {
  const supabase = createClient();
  let query = supabase
    .from('pending_repairs_view') 
    .select('*')
    .order('reported_at', { ascending: true });

  // Terapkan filter jika ada
  if (tipeAset && tipeAset !== 'all') {
    query = query.eq('unit_type', tipeAset);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching pending repairs:', error);
    return [];
  }

  if (!data) return [];

  return data.map((item: any) => ({
    id: item.result_id || item.problem_report_id,
    tanggalDitemukan: new Date(item.reported_at).toLocaleDateString('id-ID'),
    tipeAset: item.unit_type || 'N/A', 
    kodeAset: item.unit_code || 'N/A',
    tipeFeetDisplay: item.feet ? `${item.feet} Feet` : 'N/A',
    itemBermasalah: item.item_name,
    keterangan: item.problem_notes,
    pelapor: item.reported_by,
    problemPhotoUrl: item.problem_photo_url,
  }));
}

// Halaman utama sekarang menerima searchParams
export default async function PerluPerbaikanPage({ 
  searchParams 
}: { 
  searchParams: { tipeAset?: string };
}) {
  // Ambil data berdasarkan searchParams
  const pendingData = await getPendingRepairs({ tipeAset: searchParams.tipeAset });

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
       <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Perlu Perbaikan</h1>
          {/* Tombol unduh dipindahkan ke client component */}
       </div>
       {/* Kirim searchParams ke FilterForm untuk mengisi nilai default */}
       <FilterForm tipeAset={searchParams.tipeAset} />
       <PendingRepairClient initialData={pendingData} />
    </div>
  );
}