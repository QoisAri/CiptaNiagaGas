'use client';

import { useState } from 'react';
import { FaPrint } from 'react-icons/fa';
import { saveAs } from 'file-saver';
import { generateMaintenanceReport } from './action'; 
import { type MaintenanceItem } from './page';

type Props = {
  data: MaintenanceItem[];
};

export function DownloadButton({ data }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [period, setPeriod] = useState('all');
  const [isDownloading, setIsDownloading] = useState(false);

  // ## FUNGSI FILTER YANG SEBELUMNYA KOSONG, KINI SUDAH LENGKAP ##
  const filterDataByPeriod = () => {
    if (period === 'all') {
      return data;
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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
    return data;
  };

  const handleDownload = async () => {
    const dataToDownload = filterDataByPeriod();

    if (!dataToDownload || dataToDownload.length === 0) {
      alert('Tidak ada data untuk diunduh pada periode yang dipilih.');
      return;
    }

    setIsDownloading(true);
    try {
      const response = await generateMaintenanceReport(dataToDownload);

      if ('error' in response || !response.file) {
        throw new Error((response as any).error || 'Gagal membuat file Excel di server.');
      }
      
      const { file, fileName } = response;
      const byteCharacters = atob(file);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      saveAs(blob, fileName);
      setIsOpen(false);

    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat membuat laporan Excel.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700">
        <FaPrint /> Unduh Laporan
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Unduh Laporan Maintenance</h3>
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
              <button onClick={handleDownload} type="button" disabled={isDownloading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400">
                {isDownloading ? 'Memproses...' : 'Unduh Excel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}