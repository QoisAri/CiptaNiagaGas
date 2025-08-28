'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaFileExcel, FaShower, FaTrash, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { type HistoryItem } from './page';
import { deleteWashingHistory } from './action'; 
import * as XLSX from 'xlsx';

export function WashingListClient({ 
    initialHistoryData,
    currentPage,
    totalPages
}: { 
    initialHistoryData: HistoryItem[],
    currentPage: number,
    totalPages: number
}) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentFeetFilter = searchParams.get('tipeFeet') || 'all';

    const handleFilterChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== 'all') {
            params.set('tipeFeet', value);
        } else {
            params.delete('tipeFeet');
        }
        params.set('page', '1'); // Reset ke halaman 1 saat filter berubah
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handleExportExcel = () => {
        // Fungsi unduh Excel tidak perlu diubah, karena akan mengunduh data yang ditampilkan saat ini
        const dataToExport = initialHistoryData.map((item, index) => ({
            'No': ((currentPage - 1) * 50) + index + 1, // Sesuaikan nomor urut dengan halaman
            'Tanggal': item.tanggal,
            'Kode Aset': item.kodeAset,
            'Tipe Feet': item.tipeFeet || '-',
            'Diliput Oleh': item.diliputOleh,
            'Keterangan': item.keterangan || '-',
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'History Pencucian');
        worksheet['!cols'] = [
            { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 40 },
        ];
        XLSX.writeFile(workbook, 'Laporan_History_Pencucian.xlsx');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md print-area">
            <div className="flex justify-between items-center mb-4 hide-on-print">
                <div className="flex items-center gap-3">
                    <FaShower className="text-blue-800" size={28} />
                    <h1 className="text-2xl font-bold text-blue-800">History Pencucian</h1>
                </div>
                <button 
                    onClick={handleExportExcel} 
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700"
                >
                    <FaFileExcel /> Unduh Excel
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg hide-on-print">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Filter Tipe Feet</label>
                    <select 
                        value={currentFeetFilter} 
                        onChange={e => handleFilterChange(e.target.value)} 
                        disabled={isPending}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"
                    >
                        <option value="all">Semua Feet</option>
                        <option value="10">10 Feet</option>
                        <option value="20">20 Feet</option>
                        <option value="40">40 Feet</option>
                    </select>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="mb-6 flex justify-center items-center gap-4">
                    <Link 
                        href={`${pathname}?page=${currentPage - 1}&tipeFeet=${currentFeetFilter}`}
                        className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                    >
                        <FaArrowLeft /> Sebelumnya
                    </Link>
                    <span className="text-gray-700 font-medium">
                        Halaman {currentPage} dari {totalPages}
                    </span>
                    <Link 
                        href={`${pathname}?page=${currentPage + 1}&tipeFeet=${currentFeetFilter}`}
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
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">No</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Tanggal</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Kode Storage</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Diliput Oleh</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialHistoryData.length > 0 ? (
                            initialHistoryData.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 border-b text-gray-900">{((currentPage - 1) * 50) + index + 1}</td>
                                    <td className="px-4 py-3 border-b text-gray-900">{item.tanggal}</td>
                                    <td className="px-4 py-3 border-b text-gray-900 font-semibold">{item.kodeAset}</td>
                                    <td className="px-4 py-3 border-b text-gray-900">{item.diliputOleh}</td>
                                    <td className="px-4 py-3 border-b text-gray-900">
                                        <form
                                            action={deleteWashingHistory}
                                            onSubmit={(e) => {
                                                if (!confirm('Apakah Anda yakin ingin menghapus history ini?')) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            <input type="hidden" name="historyId" value={item.id} />
                                            <button type="submit" className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors">
                                                <FaTrash size={14} />
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="text-center py-10 text-gray-500">Tidak ada history yang cocok dengan filter.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
