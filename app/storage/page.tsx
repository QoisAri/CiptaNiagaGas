// app/storage/page.tsx

import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { DownloadButton } from './DownloadButton';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import StorageListClient from './StorageListClient'; // <-- IMPORT KOMPONEN CLIENT

// Komponen FilterForm (tidak ada perubahan)
function FilterForm({ storage_code, feet, pemeriksa, }: { storage_code?: string; feet?: string; pemeriksa?: string; }) {
  return (
    <form className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border items-end">
      <div>
        <label htmlFor="storage_code" className="block text-sm font-medium text-gray-700 mb-1">Filter Storage Code</label>
        <input type="text" id="storage_code" name="storage_code" defaultValue={storage_code} className="block w-full rounded-md border-gray-300 shadow-sm text-black p-2" placeholder="e.g., MK-03" />
      </div>
      <div>
        <label htmlFor="feet" className="block text-sm font-medium text-gray-700 mb-1">Filter Ukuran Feet</label>
        <select id="feet" name="feet" defaultValue={feet} className="block w-full rounded-md border-gray-300 shadow-sm text-black p-2">
          <option value="">Semua Feet</option>
          <option value="10">10 Feet</option>
          <option value="20">20 Feet</option>
          <option value="40">40 Feet</option>
        </select>
      </div>
      <div>
        <label htmlFor="pemeriksa" className="block text-sm font-medium text-gray-700 mb-1">Filter Nama Pemeriksa</label>
        <input type="text" id="pemeriksa" name="pemeriksa" defaultValue={pemeriksa} className="block w-full rounded-md border-gray-300 shadow-sm text-black p-2" placeholder="Nama pemeriksa..." />
      </div>
      <div className="flex space-x-2">
        <button type="submit" className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Cari</button>
        <Link href="/storage" className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Clear</Link>
      </div>
    </form>
  );
}

// Tipe data
type InspectionResult = { kondisi: string | null; };
type Inspection = { id: string; tanggal: string; storages: { storage_code: string | null; feet: number | null; } | null; profiles: { name: string | null; } | null; inspection_results: InspectionResult[]; };

const ITEMS_PER_PAGE = 50;

// Komponen Halaman Utama
export default async function StorageListPage({ 
    searchParams, 
}: { 
    searchParams?: { 
        storage_code?: string; 
        feet?: string; 
        pemeriksa?: string;
        page?: string;
    }; 
}) {
    const supabase = createClient();
    const storageCode = searchParams?.storage_code;
    const feet = searchParams?.feet;
    const pemeriksa = searchParams?.pemeriksa;
    const currentPage = Number(searchParams?.page) || 1;

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
  
    let query = supabase
        .from('inspections')
        .select('id, tanggal, storages!inspections_storage_id_fkey!inner(storage_code, feet), profiles!fk_inspector!inner(name), inspection_results(kondisi)', { count: 'exact' })
        .not('storage_id', 'is', null)
        .order('tanggal', { ascending: false });

    if (storageCode) query = query.ilike('storages.storage_code', `%${storageCode}%`);
    if (feet) query = query.eq('storages.feet', feet);
    if (pemeriksa) query = query.ilike('profiles.name', `%${pemeriksa}%`);

    query = query.range(from, to);

    const { data, error, count } = await query;
  
    // @ts-expect-error Tipe dari Supabase tidak cocok dengan hasil join, tapi data runtime sudah benar.
    const inspections: Inspection[] = data || [];
    const totalPages = Math.ceil((count ?? 0) / ITEMS_PER_PAGE);

    if (error) {
        return <div className="p-6 text-red-500">Error: {error.message}</div>;
    }

    // Format data untuk dikirim ke Client Component
    const formattedInspections = inspections.map(item => ({
        id: item.id,
        storage_code: item.storages?.storage_code ?? null,
        tanggal: item.tanggal,
        pemeriksa: item.profiles?.name ?? null,
        hasError: item.inspection_results.some((result) => result.kondisi === 'tidak_baik'),
    }));

    const params = new URLSearchParams();
    if (storageCode) params.set('storage_code', storageCode);
    if (feet) params.set('feet', feet);
    if (pemeriksa) params.set('pemeriksa', pemeriksa);
    const baseUrl = `/storage?${params.toString()}`;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-800">Daftar Seluruh Storage</h1>
                <DownloadButton />
            </div>
            <FilterForm storage_code={storageCode} feet={feet} pemeriksa={pemeriksa} />

            {totalPages > 1 && (
                <div className="my-6 flex justify-center items-center gap-4">
                    <Link 
                        href={`${baseUrl}&page=${currentPage - 1}`}
                        className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                    >
                        <FaArrowLeft /> Sebelumnya
                    </Link>
                    <span className="text-gray-700 font-medium">
                        Halaman {currentPage} dari {totalPages}
                    </span>
                    <Link 
                        href={`${baseUrl}&page=${currentPage + 1}`}
                        className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                    >
                        Selanjutnya <FaArrowRight />
                    </Link>
                </div>
            )}
            
            {/* Menggunakan Client Component untuk menampilkan tabel dan tombol-tombolnya */}
            <StorageListClient inspections={formattedInspections} startIndex={from} />

        </div>
    );
}