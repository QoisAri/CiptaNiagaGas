// app/head/HeadListClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link'; // Import Link dari Next.js

interface InspectionSummary {
  id: string; // inspection_id
  head_code: string;
  tanggal_inspeksi: string;
  pemeriksa: string;
  tipe_feet: number;
}

interface HeadListClientProps {
  initialData: InspectionSummary[];
  selectedTypeFeet?: string;
}

const HeadListClient: React.FC<HeadListClientProps> = ({ initialData, selectedTypeFeet }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentSelectedType, setCurrentSelectedType] = useState(selectedTypeFeet || 'Semua');
  const [displayedData, setDisplayedData] = useState<InspectionSummary[]>(initialData);

  const typeFeetOptions = ['Semua', '10', '20', '40']; // Opsinya di sini

  useEffect(() => {
    setDisplayedData(initialData);
    setCurrentSelectedType(selectedTypeFeet || 'Semua');
  }, [initialData, selectedTypeFeet]);

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value;
    setCurrentSelectedType(newType);

    const params = new URLSearchParams(searchParams.toString());
    if (newType && newType !== 'Semua') {
      params.set('type', newType);
    } else {
      params.delete('type'); // Hapus parameter 'type' jika memilih 'Semua'
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Daftar Seluruh Head</h1>
          <p className="text-gray-600">Menampilkan tipe feet: {currentSelectedType}</p>
        </div>
        <div className="flex space-x-4">
          <select
            id="tipe-feet-select"
            value={currentSelectedType}
            onChange={handleTypeChange}
            className="border border-gray-300 p-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {typeFeetOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm">
            + Tambah Data
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm">
            Unduh Rekapan
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {displayedData.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Head Code
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pemeriksa
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedData.map((inspection, index) => (
                <tr key={inspection.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inspection.head_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(inspection.tanggal_inspeksi).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inspection.pemeriksa}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/head/${inspection.id}`} className="text-indigo-600 hover:text-indigo-900">
                      Lihat Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Tidak ada data inspeksi untuk kriteria yang dipilih.
          </div>
        )}
      </div>
    </div>
  );
};

export default HeadListClient;