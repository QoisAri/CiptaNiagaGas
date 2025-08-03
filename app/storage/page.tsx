import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { AddStorageButton } from './AddStorageButton';

// =================================================================
// BAGIAN 1: Definisi Komponen FilterForm yang Diperbarui
// =================================================================
function FilterForm({
  storage_code,
  feet, // Diubah dari 'type' menjadi 'feet'
  pemeriksa,
}: {
  storage_code?: string;
  feet?: string; // Diubah dari 'type' menjadi 'feet'
  pemeriksa?: string;
}) {
  return (
    <form className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border items-end">
      <div>
        <label htmlFor="storage_code" className="block text-sm font-medium text-gray-700 mb-1">
          Filter Storage Code
        </label>
        <input
          type="text"
          id="storage_code"
          name="storage_code"
          defaultValue={storage_code}
          className="block w-full rounded-md border-gray-300 shadow-sm text-black p-2"
          placeholder="e.g., MK-03"
        />
      </div>
      
      {/* PERBAIKAN: Mengubah input 'Tipe' menjadi dropdown 'Ukuran Feet' */}
      <div>
        <label htmlFor="feet" className="block text-sm font-medium text-gray-700 mb-1">
          Filter Ukuran Feet
        </label>
        <select
          id="feet"
          name="feet"
          defaultValue={feet}
          className="block w-full rounded-md border-gray-300 shadow-sm text-black p-2"
        >
          <option value="">Semua Feet</option>
          <option value="10">10 Feet</option>
          <option value="20">20 Feet</option>
          <option value="40">40 Feet</option>
        </select>
      </div>

       <div>
        <label htmlFor="pemeriksa" className="block text-sm font-medium text-gray-700 mb-1">
          Filter Nama Pemeriksa
        </label>
        <input
          type="text"
          id="pemeriksa"
          name="pemeriksa"
          defaultValue={pemeriksa}
          className="block w-full rounded-md border-gray-300 shadow-sm text-black p-2"
          placeholder="Nama pemeriksa..."
        />
      </div>
      <div className="flex space-x-2">
        <button type="submit" className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
          Cari
        </button>
        <a href="/storage" className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
          Clear
        </a>
      </div>
    </form>
  );
}


// =================================================================
// BAGIAN 2: Halaman Utama yang Diperbarui
// =================================================================
export default async function StorageListPage({
  searchParams,
}: {
  searchParams?: {
    storage_code?: string;
    feet?: string; // Diubah dari 'type' menjadi 'feet'
    pemeriksa?: string;
  };
}) {
  const supabase = createClient();
  const storageCode = searchParams?.storage_code;
  const feet = searchParams?.feet; // Diubah dari 'type' menjadi 'feet'
  const pemeriksa = searchParams?.pemeriksa;
  
  // PERBAIKAN: Mengambil kolom 'feet' dari tabel 'storages'
  let query = supabase
    .from('inspections')
    .select('*, storages!inner(storage_code, feet), profiles!inner(name), inspection_results(kondisi)')
    .not('storage_id', 'is', null)
    .order('tanggal', { ascending: false });

  // Terapkan filter jika ada
  if (storageCode) {
    query = query.ilike('storages.storage_code', `%${storageCode}%`);
  }
  // PERBAIKAN: Memfilter berdasarkan kolom 'feet'
  if (feet) {
    query = query.eq('storages.feet', feet);
  }
  if (pemeriksa) {
    query = query.ilike('profiles.name', `%${pemeriksa}%`);
  }

  const { data: inspections, error } = await query;
  
  if (error) {
    return <div className="p-6 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Daftar Seluruh Storage</h1>
        <AddStorageButton />
      </div>
      
      <FilterForm storage_code={storageCode} feet={feet} pemeriksa={pemeriksa} />
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NO</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pemeriksa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inspections && inspections.length > 0 ? (
              inspections.map((item, index) => {
                const hasError = item.inspection_results.some((result: any) => result.kondisi === 'tidak_baik');
                return (
                  <tr key={item.id} className={hasError ? 'bg-red-100' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{item.storages?.storage_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.profiles?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/storage/${item.id}`} className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 px-3 py-1 rounded-md">
                        Lihat Detail
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={5} className="text-center py-10 text-gray-500">Tidak ada data inspeksi yang cocok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
