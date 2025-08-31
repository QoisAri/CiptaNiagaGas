// app/casis/page.tsx

import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import CasisListClient from './CasisListClient'; // <-- IMPORT KOMPONEN CLIENT BARU

// Komponen untuk Form Filter (tidak ada perubahan)
function FilterForm({ feet, chassis_code, pemeriksa }: { feet?: string; chassis_code?: string; pemeriksa?: string; }) {
  return (
    <form className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg border items-end">
      <div>
        <label htmlFor="feet" className="block text-sm font-medium text-gray-700 mb-1">Filter Tipe Feet</label>
        <select id="feet" name="feet" defaultValue={feet} className="block w-full rounded-md border-gray-300 shadow-sm text-black p-2">
          <option value="">Semua Feet</option>
          <option value="20">20 Feet</option>
          <option value="40">40 Feet</option>
        </select>
      </div>
      <div>
        <label htmlFor="chassis_code" className="block text-sm font-medium text-gray-700 mb-1">Filter Chassis Code</label>
        <input type="text" id="chassis_code" name="chassis_code" defaultValue={chassis_code} className="block w-full rounded-md border-gray-300 shadow-sm text-black p-2" />
      </div>
      <div>
        <label htmlFor="pemeriksa" className="block text-sm font-medium text-gray-700 mb-1">Filter Nama Pemeriksa</label>
        <input type="text" id="pemeriksa" name="pemeriksa" defaultValue={pemeriksa} className="block w-full rounded-md border-gray-300 shadow-sm text-black p-2" />
      </div>
      <div className="flex space-x-2 col-span-1 md:col-span-2">
        <button type="submit" className="w-full inline-flex justify-center py-2 px-4 rounded-md text-white bg-indigo-600">Cari</button>
        <Link href="/casis" className="w-full inline-flex justify-center items-center py-2 px-4 rounded-md text-gray-700 bg-white border">Clear</Link>
      </div>
    </form>
  );
}

type InspectionResult = {
  kondisi: string | null;
};

type Inspection = {
  id: string;
  tanggal: string;
  chassis: { chassis_code: string | null; feet: number | null } | null;
  profiles: { name: string | null } | null;
  inspection_results: InspectionResult[];
};

const ITEMS_PER_PAGE = 50;

export default async function CasisListPage({ 
    searchParams 
}: { 
    searchParams?: { 
        feet?: string; 
        chassis_code?: string; 
        pemeriksa?: string; 
        page?: string; 
    }; 
}) {
    const supabase = createClient();
    const feet = searchParams?.feet;
    const chassisCode = searchParams?.chassis_code;
    const pemeriksa = searchParams?.pemeriksa;
    const currentPage = Number(searchParams?.page) || 1;

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
  
    let query = supabase
        .from('inspections')
        .select('id, tanggal, chassis!inspections_chassis_id_fkey!inner(chassis_code, feet), profiles!fk_inspector!inner(name), inspection_results(kondisi)', { count: 'exact' })
        .not('chassis_id', 'is', null)
        .order('tanggal', { ascending: false });

    if (feet) {
        query = query.eq('chassis.feet', feet);
    }
    if (chassisCode) {
        query = query.ilike('chassis.chassis_code', `%${chassisCode}%`);
    }
    if (pemeriksa) {
        query = query.ilike('profiles.name', `%${pemeriksa}%`);
    }

    query = query.range(from, to);

    const { data, error, count } = await query;
  
    // @ts-expect-error Tipe dari Supabase tidak cocok dengan hasil join, tapi data runtime sudah benar.
    const inspections: Inspection[] = data || [];

    const totalPages = Math.ceil((count ?? 0) / ITEMS_PER_PAGE);

    if (error) {
        console.error('Error loading casis data:', error.message);
        return <div className="p-6 text-red-500">Terjadi kesalahan saat memuat data. Silakan coba lagi nanti.</div>;
    }

    // -- FIX: Mengubah 'undefined' menjadi 'null' menggunakan operator '??' --
    const formattedInspections = inspections.map(item => ({
      id: item.id,
      chassis_code: item.chassis?.chassis_code ?? null,
      tanggal: item.tanggal,
      pemeriksa: item.profiles?.name ?? null,
      hasError: item.inspection_results.some((result) => result.kondisi === 'tidak_baik'),
    }));

    const params = new URLSearchParams();
    if (feet) params.set('feet', feet);
    if (chassisCode) params.set('chassis_code', chassisCode);
    if (pemeriksa) params.set('pemeriksa', pemeriksa);
    const baseUrl = `/casis?${params.toString()}`;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-800">Daftar Seluruh Casis</h1>
            </div>

            <FilterForm feet={feet} chassis_code={chassisCode} pemeriksa={pemeriksa} />

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
            
            <CasisListClient inspections={formattedInspections} startIndex={from} />
        </div>
    );
}