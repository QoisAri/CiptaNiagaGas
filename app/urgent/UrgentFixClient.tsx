'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaImage, FaTrash, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { type ProblemReport } from './page'; 
import { deleteProblemReport } from './action';

type Props = {
  reports: ProblemReport[];
  currentPage: number;
  totalPages: number;
};

export default function UrgentFixClient({ reports, currentPage, totalPages }: Props) {
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const pathname = usePathname();

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'selesai':
      case 'diperbaiki':
        return 'bg-green-100 text-green-800';
      case 'dikerjakan':
        return 'bg-yellow-100 text-yellow-800';
      case 'menunggu':
      case 'baru':
      case 'reported': // Tambahkan status 'reported'
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleShowImage = (url: string) => {
    const cleanedUrl = url.replace(/([^:]\/)\/+/g, "$1");
    setModalImageUrl(cleanedUrl);
  };

  return (
    <>
      {totalPages > 1 && (
        <div className="mb-6 flex justify-center items-center gap-4">
            <Link 
                href={`${pathname}?page=${currentPage - 1}`}
                className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
                <FaArrowLeft /> Sebelumnya
            </Link>
            <span className="text-gray-700 font-medium">
                Halaman {currentPage} dari {totalPages}
            </span>
            <Link 
                href={`${pathname}?page=${currentPage + 1}`}
                className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
            >
                Selanjutnya <FaArrowRight />
            </Link>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Tanggal Lapor</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Tipe Aset</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Kode Aset</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Item Rusak</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Deskripsi Masalah</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-800 border-b">Foto</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Pelapor</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Deadline</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Status</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-800 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {reports.length > 0 ? (
              reports.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-4 py-3 border-b text-gray-900 whitespace-nowrap">{item.tanggalLapor}</td>
                  <td className="px-4 py-3 border-b text-gray-900">{item.tipeAset}</td>
                  <td className="px-4 py-3 border-b text-gray-900 font-semibold">{item.kodeAset}</td>
                  <td className="px-4 py-3 border-b text-gray-900">{item.itemRusak}</td>
                  <td className="px-4 py-3 border-b text-gray-900 min-w-[200px]">{item.deskripsiMasalah}</td>
                  <td className="px-4 py-3 border-b text-gray-900 text-center">
                    {item.problemPhotoUrl ? (
                      <button onClick={() => handleShowImage(item.problemPhotoUrl!)} className="text-blue-600 hover:text-blue-800">
                        <FaImage size={18} />
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 border-b text-gray-900">{item.pelapor}</td>
                  <td className="px-4 py-3 border-b text-gray-900 whitespace-nowrap">{item.deadline}</td>
                  <td className="px-4 py-3 border-b text-gray-900">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(item.status)}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b text-gray-900 text-center">
                    <form
                      action={deleteProblemReport}
                      onSubmit={(e) => {
                          if (!confirm('Apakah Anda yakin ingin menghapus laporan masalah ini?')) {
                              e.preventDefault();
                          }
                      }}
                    >
                      <input type="hidden" name="reportId" value={item.id} />
                      <button type="submit" className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors">
                          <FaTrash size={14} />
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={10} className="text-center py-10 text-gray-500">Tidak ada laporan perbaikan mendesak.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalImageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
          onClick={() => setModalImageUrl(null)}
        >
          <div className="relative p-4">
            <button 
              onClick={() => setModalImageUrl(null)}
              className="absolute -top-10 -right-4 text-white text-3xl font-bold"
            >
              &times;
            </button>
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
