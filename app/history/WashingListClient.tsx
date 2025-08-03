'use client';

import { useState, useMemo } from 'react';
import { FaPrint, FaShower } from 'react-icons/fa';

export function WashingHistoryClient({ initialHistoryData }: { initialHistoryData: any[] }) {
  const [filterAsset, setFilterAsset] = useState('all');
  const [filterFeet, setFilterFeet] = useState('all');

  const filteredData = useMemo(() => {
    return initialHistoryData
      .filter(item => {
        if (filterAsset === 'all') return true;
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

      {/* Area Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg hide-on-print">
        <div>
          <label className="block text-sm font-medium text-gray-700">Filter Tipe Aset</label>
          <select value={filterAsset} onChange={e => setFilterAsset(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black">
            <option value="all">Semua Tipe</option>
            <option value="storage">Storage</option>
          </select>
        </div>
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
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Tipe Aset</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Kode Aset</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Diliput Oleh</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b text-gray-900">{index + 1}</td>
                  <td className="px-4 py-3 border-b text-gray-900">{item.tanggal}</td>
                  <td className="px-4 py-3 border-b text-gray-900">{item.assetType}</td>
                  <td className="px-4 py-3 border-b text-gray-900 font-semibold">{item.kodeAset}</td>
                  <td className="px-4 py-3 border-b text-gray-900">{item.diliputOleh}</td>
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
