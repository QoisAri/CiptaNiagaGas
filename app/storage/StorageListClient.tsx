'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSelection } from '../context/SelectionContext';
import AddStorageModal from '@/components/modals/AddStorageModal';

// PERBAIKAN: Membuat tipe data yang spesifik untuk item storage
type StorageItem = {
  id: string;
  type: string | null; // Tipe bisa null
  code: string;
  tanggal: string;
  pemeriksa: string;
  hasError: boolean;
};

// PERBAIKAN: Mengganti 'any[]' dengan tipe yang sudah didefinisikan
export default function StorageListClient({ initialStorageData }: { initialStorageData: StorageItem[] }) {
  const { selections, isLoading } = useSelection();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const filteredData = selections.storage.length > 0
    ? initialStorageData.filter(item => {
        return selections.storage.some((selection: string) => 
          item.type && item.type.toLowerCase().includes(selection.toLowerCase())
        );
      })
    : initialStorageData;

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <>
      <AddStorageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800">Daftar Seluruh Storage</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg text-sm"
            >
              + Tambah Data
            </button>
            <button 
              onClick={() => alert('Fitur Unduh Rekapan belum dibuat.')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm"
            >
              Unduh Rekapan
            </button>
          </div>
        </div>
        <p className="text-gray-600 mb-6">
          Menampilkan tipe: <strong>{selections.storage.join(', ') || 'Semua'}</strong>
        </p>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">No</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Storage Code</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Pemeriksa</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-800 border-b">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item.id} className={`transition-colors ${item.hasError ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className={`px-4 py-3 border-b text-center ${item.hasError ? 'text-red-800' : 'text-gray-700'}`}>{index + 1}</td>
                    <td className={`px-4 py-3 border-b ${item.hasError ? 'text-red-800 font-semibold' : 'text-gray-700'}`}>{item.code}</td>
                    <td className={`px-4 py-3 border-b ${item.hasError ? 'text-red-800' : 'text-gray-700'}`}>{item.tanggal}</td>
                    <td className={`px-4 py-3 border-b ${item.hasError ? 'text-red-800' : 'text-gray-700'}`}>{item.pemeriksa}</td>
                    <td className="px-4 py-3 border-b text-center">
                      <Link href={`/storage/${item.id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                        Lihat Detail
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="text-center py-10 text-gray-500">Tidak ada data inspeksi untuk tipe storage yang dipilih.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
