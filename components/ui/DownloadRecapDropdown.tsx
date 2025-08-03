'use client'

import { useState } from 'react';
import { getRecapData } from '@/app/casis/actions';
import * as XLSX from 'xlsx';

// PERBAIKAN: Membuat tipe data yang spesifik untuk baris rekap
type RecapRow = Record<string, string | number | null>;

export default function DownloadRecapDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState('');

  const sanitizeSheetName = (name: string) => {
    return name.replace(/[:\\/?*[\]]/g, '').substring(0, 31);
  };

  const handleDownload = async (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    setStatus(`Mempersiapkan rekap ${period}...`);
    setIsDownloading(true);
    setIsOpen(false);

    try {
      // Kita asumsikan getRecapData mengembalikan array dari objek RecapRow
      const data: RecapRow[] = await getRecapData(period);

      if (data.length === 0) {
        setStatus('Tidak ada data untuk diunduh.');
        setTimeout(() => setStatus(''), 3000);
        setIsDownloading(false);
        return;
      }

      // PERBAIKAN: Mengganti 'any[]' dengan 'RecapRow[]' yang lebih aman
      const groupedByAsset = data.reduce((acc, row) => {
        const assetCode = (row['Kode Aset'] as string) || 'Tanpa Kode';
        if (!acc[assetCode]) {
          acc[assetCode] = [];
        }
        acc[assetCode].push(row);
        return acc;
      }, {} as Record<string, RecapRow[]>);

      const wb = XLSX.utils.book_new();

      for (const assetCode in groupedByAsset) {
        const sheetData = groupedByAsset[assetCode];
        const sheetName = sanitizeSheetName(assetCode);
        const ws = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }

      XLSX.writeFile(wb, `rekap-${period}-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setStatus('Download berhasil!');

    } catch (error) {
      console.error('Download failed:', error);
      setStatus('Download gagal.');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button 
          type="button" 
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none"
        >
          {isDownloading ? 'Downloading...' : 'Unduh Rekapan'}
          <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button onClick={() => handleDownload('daily')} className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" role="menuitem">Rekap Harian</button>
            <button onClick={() => handleDownload('weekly')} className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" role="menuitem">Rekap Mingguan</button>
            <button onClick={() => handleDownload('monthly')} className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" role="menuitem">Rekap Bulanan</button>
            <button onClick={() => handleDownload('yearly')} className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" role="menuitem">Rekap Tahunan</button>
          </div>
        </div>
      )}
      {status && <p className="text-sm text-gray-500 absolute right-0 mt-2">{status}</p>}
    </div>
  );
}
