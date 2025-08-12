'use client';

import { useState, useMemo } from 'react';
import { FaPrint, FaShower, FaTrash } from 'react-icons/fa';
import { type HistoryItem } from './page';
// Impor action baru
import { deleteWashingHistory } from './action'; 

export function WashingListClient({ initialHistoryData }: { initialHistoryData: HistoryItem[] }) {
  const [filterAsset, setFilterAsset] = useState('all');
  const [filterFeet, setFilterFeet] = useState('all');

  const filteredData = useMemo(() => {
    return initialHistoryData
      .filter(item => {
        if (filterAsset === 'all') return true;
        // Sekarang assetType akan konsisten (Head, Chassis, Storage)
        return item.assetType.toLowerCase() === filterAsset;
      })
      .filter(item => {
        if (filterFeet === 'all') return true;
        return String(item.tipeFeet) === filterFeet;
      });
  }, [initialHistoryData, filterAsset, filterFeet]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md print-area">
      <div className="flex justify-between items-center mb-4 hide-on-print">
        <div className="flex items-center gap-3">
          <FaShower className="text-blue-800" size={28} />
          <h1 className="text-2xl font-bold text-blue-800">History Pencucian</h1>
        </div>
        <button 
          onClick={handlePrint} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700"
        >
          <FaPrint /> Cetak Laporan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg hide-on-print">
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Filter Tipe Feet</label>
          <select value={filterFeet} onChange={e => setFilterFeet(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black">
            <option value="all">Semua Feet</option>
            <option value="10">10 Feet</option>
            <option value="20">20 Feet</option>
            <option value="40">40 Feet</option>
          </select>
        </div>
      </div>

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
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b text-gray-900">{index + 1}</td>
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
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">Tidak ada history yang cocok dengan filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}