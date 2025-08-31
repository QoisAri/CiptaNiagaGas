// app/storage/StorageListClient.tsx

'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { deleteStorageInspectionsByIds, deleteStorageInspectionsByDateRange } from './actions';

// Tipe data yang diterima komponen ini dari page.tsx
type StorageItem = {
  id: string; // ID inspeksi, bukan ID storage
  storage_code: string | null;
  tanggal: string;
  pemeriksa: string | null;
  hasError: boolean;
};

type Props = {
  inspections: StorageItem[];
  startIndex: number;
};

export default function StorageListClient({ inspections, startIndex }: Props) {
  // State untuk fitur hapus massal
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPending, startTransition] = useTransition();

  // Handler untuk fitur hapus massal
  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };
  const handleSelectAll = () => {
    if (selectedIds.length === inspections.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(inspections.map((item) => item.id));
    }
  };
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) {
      alert('Pilih setidaknya satu data untuk dihapus.');
      return;
    }
    if (window.confirm(`Yakin ingin menghapus ${selectedIds.length} data inspeksi terpilih?`)) {
      startTransition(async () => {
        await deleteStorageInspectionsByIds(selectedIds);
        setSelectedIds([]);
        setIsDeleteMode(false);
      });
    }
  };
  const handleDeleteByDateRange = () => {
    if (!startDate || !endDate) {
      alert('Silakan pilih tanggal mulai dan tanggal selesai.');
      return;
    }
    if (window.confirm(`Yakin ingin menghapus semua data dari ${startDate} sampai ${endDate}?`)) {
      startTransition(async () => {
        await deleteStorageInspectionsByDateRange(startDate, endDate);
        setStartDate('');
        setEndDate('');
        setIsDeleteMode(false);
      });
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Header HANYA untuk tombol aksi hapus */}
      <div className="p-4 border-b min-h-[80px] flex justify-end items-center flex-wrap gap-4">
        <div className="flex flex-col items-end gap-2">
          {!isDeleteMode ? (
            <button
              onClick={() => setIsDeleteMode(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-semibold shadow-sm"
            >
              Hapus Data Inspeksi
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleDeleteSelected}
                disabled={isPending || selectedIds.length === 0}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 font-semibold shadow-sm"
              >
                {isPending ? 'Menghapus...' : `Hapus (${selectedIds.length}) Terpilih`}
              </button>
              <button
                onClick={() => { setIsDeleteMode(false); setSelectedIds([]); }}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 font-semibold shadow-sm"
              >
                Batal
              </button>
            </div>
          )}
          {isDeleteMode && (
            <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50 mt-2 shadow-sm">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-1 rounded text-sm"/>
              <span className="text-gray-600">s/d</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-1 rounded text-sm"/>
              <button
                onClick={handleDeleteByDateRange}
                disabled={isPending || !startDate || !endDate}
                className="bg-orange-500 text-white px-3 py-1 rounded-md text-sm hover:bg-orange-600 disabled:bg-gray-400 font-semibold"
              >
                Hapus Rentang
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabel Data */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {isDeleteMode && (
                <th className="px-4 py-3 text-center w-12">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={inspections.length > 0 && selectedIds.length === inspections.length}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NO</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pemeriksa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inspections.length > 0 ? (
              inspections.map((item, index) => (
                <tr key={item.id} className={`${item.hasError ? 'bg-red-100' : ''} ${selectedIds.includes(item.id) ? 'bg-blue-100' : 'hover:bg-gray-50'}`}>
                  {isDeleteMode && (
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleSelectRow(item.id)}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{startIndex + index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{item.storage_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.pemeriksa}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/storage/${item.id}`} className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 px-3 py-1 rounded-md">
                      Lihat Detail
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={isDeleteMode ? 6 : 5} className="text-center py-10 text-gray-500">Tidak ada data inspeksi yang cocok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}