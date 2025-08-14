'use client';

import { useState } from 'react';
import { FaImage, FaDownload } from 'react-icons/fa';
import Image from 'next/image';
import { type PendingRepairItem } from './page';
import { generatePendingRepairReport } from './actions';
import { saveAs } from 'file-saver';

export default function PendingRepairClient({ initialData }: { initialData: PendingRepairItem[] }) {
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Filter di client sudah tidak diperlukan lagi
  // const filteredData = useMemo(...);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      // Kirim data yang sudah terfilter dari server untuk diunduh
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
      <div className='flex justify-end mb-4'>
        <button onClick={handleDownload} disabled={isDownloading} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400">
            <FaDownload /> {isDownloading ? 'Memproses...' : 'Unduh Laporan'}
        </button>
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
      
      {modalImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" onClick={() => setModalImageUrl(null)}>
           {/* ... Modal Gambar ... */}
        </div>
      )}
    </>
  );
}