'use client';

import { useState, useMemo, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FaWrench, FaImage, FaDownload } from 'react-icons/fa';
import Image from 'next/image';
import { type PendingRepairItem } from './page';
import { generatePendingRepairReport } from './actions';
import { saveAs } from 'file-saver';

export default function PendingRepairClient({ 
    initialData, 
    currentFilter 
}: { 
    initialData: PendingRepairItem[], 
    currentFilter?: string 
}) {
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set('tipeAset', value);
    } else {
      params.delete('tipeAset');
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const { file, fileName } = await generatePendingRepairReport(initialData);
      const byteCharacters = atob(file);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
    } catch (error) {
      console.error("Gagal mengunduh Excel:", error);
      alert("Terjadi kesalahan saat membuat laporan.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShowImage = (url: string) => {
    const cleanedUrl = url.replace(/([^:]\/)\/+/g, "$1");
    setModalImageUrl(cleanedUrl);
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <FaWrench className="text-red-600" size={28} />
            <h1 className="text-2xl font-bold text-gray-800">Perlu Perbaikan</h1>
          </div>
          <button onClick={handleDownload} disabled={isDownloading} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400">
            <FaDownload /> {isDownloading ? 'Memproses...' : 'Unduh Laporan'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700">Filter Tipe Aset</label>
            <select 
              value={currentFilter || 'all'} 
              onChange={e => handleFilterChange(e.target.value)}
              disabled={isPending}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"
            >
              <option value="all">Semua Tipe</option>
              <option value="Head">Head</option>
              <option value="Chassis">Casis</option>
              <option value="Storage">Storage</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Tgl Ditemukan</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Tipe Aset</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Kode Aset</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Item Bermasalah</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Keterangan</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-800 border-b">Foto</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Pelapor</th>
              </tr>
            </thead>
            <tbody>
              {initialData.length > 0 ? (
                initialData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b text-gray-900">{item.tanggalDitemukan}</td>
                    <td className="px-4 py-3 border-b text-gray-900">{item.tipeAset}</td>
                    <td className="px-4 py-3 border-b text-gray-900 font-semibold">{item.kodeAset}</td>
                    <td className="px-4 py-3 border-b text-gray-900">{item.itemBermasalah}</td>
                    <td className="px-4 py-3 border-b text-gray-900">{item.keterangan}</td>
                    <td className="px-4 py-3 border-b text-gray-900 text-center">
                      {item.problemPhotoUrl ? (
                        <button onClick={() => handleShowImage(item.problemPhotoUrl!)} className="text-blue-600 hover:text-blue-800">
                          <FaImage size={18} />
                        </button>
                      ) : ('-')}
                    </td>
                    <td className="px-4 py-3 border-b text-gray-900">{item.pelapor}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">Tidak ada item yang perlu perbaikan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {modalImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" onClick={() => setModalImageUrl(null)}>
           <div className="relative p-4">
              <button onClick={() => setModalImageUrl(null)} className="absolute -top-10 -right-4 text-white text-3xl font-bold">&times;</button>
              <Image 
                  src={modalImageUrl}
                  alt="Foto Masalah"
                  width={800}
                  height={600}
                  className="max-w-screen-lg max-h-screen-lg object-contain"
              />
          </div>
        </div>
      )}
    </>
  );
}