'use client';

import { useState } from 'react';
import { FaPrint } from 'react-icons/fa';

// Tipe data yang diterima dari props
type MaintenanceData = {
  tglDitemukan: string;
  kodeAset: string;
  tipeFeetDisplay: string | null;
  deskripsiMasalah: string;
  tglSelesai: string;
  keterangan: string;
  rawTglSelesai: string; // <-- PERBAIKAN: Tambahkan properti ini ke tipe data
};

type Props = {
  data: MaintenanceData[];
};

export function DownloadButton({ data }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [period, setPeriod] = useState('all');

  const filterDataByPeriod = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Gunakan 'rawTglSelesai' untuk perbandingan tanggal yang akurat
    if (period === 'daily') {
      return data.filter(item => {
        const itemDate = new Date(item.rawTglSelesai);
        return itemDate.getFullYear() === today.getFullYear() &&
               itemDate.getMonth() === today.getMonth() &&
               itemDate.getDate() === today.getDate();
      });
    }
    if (period === 'weekly') {
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return data.filter(item => new Date(item.rawTglSelesai) >= oneWeekAgo);
    }
    if (period === 'monthly') {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return data.filter(item => new Date(item.rawTglSelesai) >= firstDayOfMonth);
    }
    if (period === 'yearly') {
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        return data.filter(item => new Date(item.rawTglSelesai) >= firstDayOfYear);
    }
    return data; // 'all'
  };

  const handleDownload = () => {
    const dataToDownload = filterDataByPeriod();
    if (dataToDownload.length === 0) {
      alert('Tidak ada data untuk diunduh pada periode yang dipilih.');
      return;
    }

    const headers = ['Tgl Ditemukan', 'Kode Aset', 'Tipe Feet', 'Deskripsi Masalah', 'Tgl Selesai', 'Keterangan'];
    const csvContent = [
      headers.join(','),
      ...dataToDownload.map(item => [
        `"${item.tglDitemukan}"`,
        `"${item.kodeAset}"`,
        `"${item.tipeFeetDisplay || 'N/A'}"`,
        `"${item.deskripsiMasalah}"`,
        `"${item.tglSelesai}"`,
        `"${item.keterangan.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `rekapan_maintenance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700">
        <FaPrint /> Cetak Laporan
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Unduh Laporan Maintenance</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="period" className="block text-sm font-medium text-gray-700">Periode Data</label>
                <select id="period" value={period} onChange={(e) => setPeriod(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-black">
                  <option value="all">Semua Data</option>
                  <option value="daily">Hari Ini</option>
                  <option value="weekly">Minggu Ini</option>
                  <option value="monthly">Bulan Ini</option>
                  <option value="yearly">Tahun Ini</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsOpen(false)} type="button" className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
              <button onClick={handleDownload} type="button" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Unduh (Excel/CSV)</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}