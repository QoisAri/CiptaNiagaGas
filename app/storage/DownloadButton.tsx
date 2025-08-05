// app/storage/DownloadButton.tsx
'use client';

import { useState } from 'react';
import { generateStorageReport } from './actions';
import { FaDownload, FaSpinner } from 'react-icons/fa';

export function DownloadButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingReport, setLoadingReport] = useState<string | null>(null);

  const handleDownload = async (reportType: 'checked' | 'problematic' | 'maintained', reportName: string) => {
    setLoadingReport(reportName);
    try {
      const result = await generateStorageReport(reportType);
      if (result.file) {
        const byteCharacters = atob(result.file);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `laporan-storage-${reportType}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (result.error) {
        alert(`Gagal membuat laporan: ${result.error}`);
      }
    } catch (error) {
      alert('Terjadi kesalahan saat mengunduh laporan.');
      console.error(error);
    } finally {
      setLoadingReport(null);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FaDownload className="-ml-1 mr-2 h-5 w-5" />
          Unduh Laporan
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <a
              href="#"
              onClick={() => handleDownload('checked', 'Dicek')}
              className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100"
            >
              {loadingReport === 'Dicek' ? <FaSpinner className="animate-spin inline mr-2" /> : null}
              Laporan Sudah/Belum Dicek
            </a>
            <a
              href="#"
              onClick={() => handleDownload('problematic', 'Bermasalah')}
              className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100"
            >
               {loadingReport === 'Bermasalah' ? <FaSpinner className="animate-spin inline mr-2" /> : null}
              Laporan Bermasalah
            </a>
            <a
              href="#"
              onClick={() => handleDownload('maintained', 'Diperbaiki')}
              className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100"
            >
               {loadingReport === 'Diperbaiki' ? <FaSpinner className="animate-spin inline mr-2" /> : null}
              Laporan Sudah Diperbaiki
            </a>
          </div>
        </div>
      )}
    </div>
  );
}