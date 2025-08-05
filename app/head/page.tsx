// app/head/page.tsx

import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { AddHeadButton } from './AddHeadButton';

// Komponen FilterForm (tidak diexport default)
function FilterForm({ feet, head_code, pemeriksa }: { feet?: string; head_code?: string; pemeriksa?: string; }) {
  return (
    <form className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg border items-end">
      <div>
        <label htmlFor="feet" className="block text-sm font-medium text-gray-700 mb-1">Filter Tipe Feet</label>
        <select id="feet" name="feet" defaultValue={feet} className="block w-full rounded-md border-gray-300 shadow-sm text-black p-2">
          <option value="">Semua Feet</option>
          <option value="10">10 Feet</option>
          <option value="20">20 Feet</option>
          <option value="40">40 Feet</option>
        </select>
      </div>
      <div>
        <label htmlFor="head_code" className="block text-sm font-medium text-gray-700 mb-1">Filter Head Code</label>
        <input type="text" id="head_code" name="head_code" defaultValue={head_code} className="block w-full rounded-md border-gray-300 shadow-sm text-black p-2" placeholder="e.g., H-01" />
      </div>
      <div>
        <label htmlFor="pemeriksa" className="block text-sm font-medium text-gray-700 mb-1">Filter Nama Pemeriksa</label>
        <input type="text" id="pemeriksa" name="pemeriksa" defaultValue={pemeriksa} className="block w-full rounded-md border-gray-300 shadow-sm text-black p-2" placeholder="Nama pemeriksa..." />
      </div>
      <div className="flex space-x-2 col-span-1 md:col-span-2">
        <button type="submit" className="w-full inline-flex justify-center py-2 px-4 rounded-md text-white bg-indigo-600">Cari</button>
        <Link href="/head" className="w-full inline-flex justify-center items-center py-2 px-4 rounded-md text-gray-700 bg-white border">Clear</Link>
      </div>
    </form>
  );
}

// Tipe data yang dibutuhkan
type InspectionResult = { kondisi: string | null; };
type Inspection = { id: string; tanggal: string; heads: { head_code: string | null; feet: number | null; } | null; profiles: { name: string | null; } | null; inspection_results: InspectionResult[]; };

// Komponen Halaman (yang diexport default)
export default async function HeadListPage({ searchParams }: { searchParams: { feet?: string; head_code?: string; pemeriksa?: string; }; }) {
  const supabase = await createClient();
  const feet = searchParams.feet;
  const headCode = searchParams.head_code;
  const pemeriksa = searchParams.pemeriksa;

  let query = supabase
    .from('inspections')
    .select('id, tanggal, heads!inspections_head_id_fkey!inner(head_code, feet), profiles!fk_inspector!inner(name), inspection_results(kondisi)')
    .not('head_id', 'is', null)
    .order('tanggal', { ascending: false });

  if (feet) query = query.eq('heads.feet', feet);
  if (headCode) query = query.ilike('heads.head_code', `%${headCode}%`);
  if (pemeriksa) query = query.ilike('profiles.name', `%${pemeriksa}%`);

  const { data, error } = await query;
  
  // @ts-expect-error Tipe dari Supabase tidak cocok dengan hasil join, tapi data runtime sudah benar.
  const inspections: Inspection[] = data || [];
  
  if (error) {
    return <div className="p-6 text-red-500">Error loading data: {error.message}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Daftar Seluruh Head</h1>
        <div className="flex items-center space-x-2"><AddHeadButton /></div>
      </div>
      <FilterForm feet={feet} head_code={headCode} pemeriksa={pemeriksa} />
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Head Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pemeriksa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inspections && inspections.length > 0 ? (
              inspections.map((item, index) => {
                const hasError = item.inspection_results.some((result: InspectionResult) => result.kondisi === 'tidak_baik');
                return (
                  <tr key={item.id} className={hasError ? 'bg-red-100' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{item.heads?.head_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.profiles?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/head/${item.id}`} className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 px-3 py-1 rounded-md">Lihat Detail</Link>
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