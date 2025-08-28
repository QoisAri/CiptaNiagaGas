'use client';

import { useState, useMemo, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaTools, FaImage, FaTrash, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { DownloadButton } from './DownloadButton';
import { type MaintenanceItem } from './page';
import { deleteMaintenanceRecord } from './action';
import Image from 'next/image';

export default function MaintenanceListClient({ 
    initialMaintenanceData,
    currentPage,
    totalPages
}: { 
    initialMaintenanceData: MaintenanceItem[],
    currentPage: number,
    totalPages: number
}) {
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Ambil nilai filter dari URL
    const currentAssetFilter = searchParams.get('tipeAset') || 'all';
    const currentFeetFilter = searchParams.get('tipeFeet') || 'all';

    const handleFilterChange = (filterType: 'tipeAset' | 'tipeFeet', value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== 'all') {
            params.set(filterType, value);
        } else {
            params.delete(filterType);
        }
        params.set('page', '1'); // Selalu reset ke halaman 1 saat filter berubah
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handleShowImage = (url: string) => {
        const cleanedUrl = url.replace(/([^:]\/)\/+/g, "$1");
        setModalImageUrl(cleanedUrl);
    };

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md print-area">
                <div className="flex justify-between items-center mb-4 hide-on-print">
                    <div className="flex items-center gap-3">
                        <FaTools className="text-blue-800" size={28} />
                        <h1 className="text-2xl font-bold text-blue-800">Record Maintenance</h1>
                    </div>
                    <DownloadButton data={initialMaintenanceData} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg hide-on-print">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Filter Tipe Aset</label>
                        <select 
                            value={currentAssetFilter} 
                            onChange={e => handleFilterChange('tipeAset', e.target.value)} 
                            disabled={isPending}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"
                        >
                            <option value="all">Semua Tipe</option>
                            <option value="head">Head</option>
                            <option value="chassis">Casis</option>
                            <option value="storage">Storage</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Filter Ukuran Feet</label>
                        <select 
                            value={currentFeetFilter} 
                            onChange={e => handleFilterChange('tipeFeet', e.target.value)} 
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
                            href={`${pathname}?page=${currentPage - 1}&tipeAset=${currentAssetFilter}&tipeFeet=${currentFeetFilter}`}
                            className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                        >
                            <FaArrowLeft /> Sebelumnya
                        </Link>
                        <span className="text-gray-700 font-medium">
                            Halaman {currentPage} dari {totalPages}
                        </span>
                        <Link 
                            href={`${pathname}?page=${currentPage + 1}&tipeAset=${currentAssetFilter}&tipeFeet=${currentFeetFilter}`}
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
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Tgl Ditemukan</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Tipe Aset</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Kode Aset</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Ukuran Feet</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Deskripsi Masalah</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Tgl Selesai</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Keterangan</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-800 border-b">Foto Masalah</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-800 border-b">Foto Perbaikan</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-800 border-b">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {initialMaintenanceData.length > 0 ? (
                                initialMaintenanceData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 border-b text-gray-900">{item.tglDitemukan}</td>
                                        <td className="px-4 py-3 border-b text-gray-900">{item.assetType}</td>
                                        <td className="px-4 py-3 border-b text-gray-900 font-semibold">{item.kodeAset}</td>
                                        <td className="px-4 py-3 border-b text-gray-900">{item.tipeFeetDisplay}</td>
                                        <td className="px-4 py-3 border-b text-gray-900">{item.deskripsiMasalah}</td>
                                        <td className="px-4 py-3 border-b text-gray-900">{item.tglSelesai}</td>
                                        <td className="px-4 py-3 border-b text-gray-900">{item.keterangan}</td>
                                        <td className="px-4 py-3 border-b text-gray-900 text-center">
                                            {item.problemPhotoUrl ? (
                                                <button onClick={() => handleShowImage(item.problemPhotoUrl!)} className="text-blue-600 hover:text-blue-800">
                                                    <FaImage size={18} />
                                                </button>
                                            ) : ('-')}
                                        </td>
                                        <td className="px-4 py-3 border-b text-gray-900 text-center">
                                            {item.repairPhotoUrl ? (
                                                <button onClick={() => handleShowImage(item.repairPhotoUrl!)} className="text-green-600 hover:text-green-800">
                                                    <FaImage size={18} />
                                                </button>
                                            ) : ('-')}
                                        </td>
                                        <td className="px-4 py-3 border-b text-gray-900 text-center">
                                            <form
                                                action={deleteMaintenanceRecord}
                                                onSubmit={(e) => {
                                                    if (!confirm('Apakah Anda yakin ingin menghapus catatan perbaikan ini?')) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            >
                                                <input type="hidden" name="maintenanceId" value={item.id} />
                                                <button type="submit" className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors">
                                                    <FaTrash size={14} />
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={10} className="text-center py-10 text-gray-500">Tidak ada data perbaikan yang cocok dengan filter.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
                            alt="Foto Detail"
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
