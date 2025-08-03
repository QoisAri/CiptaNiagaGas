// app/head/DownloadButton.tsx
'use client';

import { useState } from 'react';

// Tentukan tipe data yang diterima
type InspectionData = {
  id: string;
  tanggal: string;
  heads?: { head_code: string } | null;
  profiles?: { name: string } | null;
  // Tambahkan properti lain jika perlu untuk rekapan
};

type Props = {
  data: InspectionData[];
};

export function DownloadButton({ data }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [period, setPeriod] = useState('all'); // all, daily, weekly, monthly

  const filterDataByPeriod = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (period === 'daily') {
      return data.filter(item => {
        const itemDate = new Date(new Date(item.tanggal).getFullYear(), new Date(item.tanggal).getMonth(), new Date(item.tanggal).getDate());
        return itemDate.getTime() === today.getTime();
      });
    }
    if (period === 'weekly') {
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return data.filter(item => new Date(item.tanggal) >= oneWeekAgo);
    }
    if (period === 'monthly') {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return data.filter(item => new Date(item.tanggal) >= firstDayOfMonth);
    }
    return data; // 'all'
  };

  const handleDownload = () => {
    const filteredData = filterDataByPeriod();
    if (filteredData.length === 0) {
      alert('Tidak ada data untuk diunduh pada periode yang dipilih.');
      return;
    }

    // Header untuk file CSV
    const headers = ['NO', 'HEAD CODE', 'TANGGAL', 'PEMERIKSA'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map((item, index) => [
        index + 1,
        item.heads?.head_code || 'N/A',
        new Date(item.tanggal).toLocaleDateString('id-ID'),
        item.profiles?.name || 'N/A',
      ].join(','))
    ].join('\n');

    // Buat file dan trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `rekapan_head_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm">
        Unduh Rekapan
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Pengaturan Unduh Rekapan</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="period" className="block text-sm font-medium text-gray-700">Periode Waktu</label>
                <select
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="all">Semua Data</option>
                  <option value="daily">Hari Ini</option>
                  <option value="weekly">7 Hari Terakhir</option>
                  <option value="monthly">Bulan Ini</option>
                </select>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700">Format File</label>
                <div className="mt-1 text-gray-500 text-sm">(Saat ini hanya tersedia Excel/CSV)</div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsOpen(false)} type="button" className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handleDownload} type="button" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                Unduh
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}