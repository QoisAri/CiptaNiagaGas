// app/add-inspection/page.tsx atau komponen form lainnya
'use client';

import React, { useState } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase';
import { HEAD_INSPECTION_CATEGORIES } from '@/constants/inspectionItems';
import { v4 as uuidv4 } from 'uuid'; // Pastikan sudah install 'uuid': npm install uuid @types/uuid

interface InspectionItemInput {
  kondisi: string;
  keterangan: string;
}

export default function AddInspectionPage() {
  const supabase = createClientSupabaseClient();
  const [inspectionData, setInspectionData] = useState<{ [key: string]: InspectionItemInput }>({});
  const [currentInspectionId, setCurrentInspectionId] = useState<string>(uuidv4()); // ID untuk sesi inspeksi ini

  const handleInputChange = (itemKey: string, field: 'kondisi' | 'keterangan', value: string) => {
    setInspectionData(prev => ({
      ...prev,
      [itemKey]: {
        ...(prev[itemKey] || { kondisi: '', keterangan: '' }),
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const resultsToInsert = [];
    for (const category in HEAD_INSPECTION_CATEGORIES) {
      for (const itemDef of HEAD_INSPECTION_CATEGORIES[category]) {
        const itemResult = inspectionData[itemDef.key];
        if (itemResult && itemResult.kondisi && itemResult.keterangan) {
          resultsToInsert.push({
            inspection_id: currentInspectionId,
            item_id: uuidv4(), // UUID unik untuk setiap baris hasil inspeksi
            item_name: itemDef.key, // Ini adalah UNIQUE KEY
            kondisi: itemResult.kondisi,
            keterangan: itemResult.keterangan,
            // created_at akan diisi otomatis oleh Supabase jika diatur default now()
          });
        }
      }
    }

    if (resultsToInsert.length === 0) {
      alert('Mohon isi setidaknya satu item inspeksi.');
      return;
    }

    const { error } = await supabase.from('inspection_results').insert(resultsToInsert);

    if (error) {
      console.error('Error inserting inspection results:', error);
      alert('Gagal menyimpan hasil inspeksi: ' + error.message);
    } else {
      alert('Hasil inspeksi berhasil disimpan!');
      setInspectionData({}); // Reset form
      setCurrentInspectionId(uuidv4()); // Generate ID baru untuk inspeksi berikutnya
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Form Inspeksi Head</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            ID Inspeksi Sesi Ini:
          </label>
          <input
            type="text"
            value={currentInspectionId}
            readOnly
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {Object.entries(HEAD_INSPECTION_CATEGORIES).map(([categoryName, items]) => (
          <div key={categoryName} className="mb-6 border border-gray-200 p-4 rounded-md bg-gray-50">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">{categoryName}</h3>
            {items.map(item => (
              <div key={item.key} className="flex flex-col md:flex-row md:items-center mb-4 p-2 bg-white rounded-md shadow-sm">
                <label className="w-full md:w-1/3 text-gray-700 font-medium mb-1 md:mb-0">
                  {item.label} ({item.description || 'N/A'}):
                </label>
                <select
                  value={inspectionData[item.key]?.kondisi || ''}
                  onChange={(e) => handleInputChange(item.key, 'kondisi', e.target.value)}
                  className="w-full md:w-1/4 border border-gray-300 p-2 rounded-md mr-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Pilih Kondisi</option>
                  <option value="Baik">Baik</option>
                  <option value="Tidak Baik">Tidak Baik</option>
                </select>
                <input
                  type="text"
                  placeholder="Keterangan (misal: pecah, karat)"
                  value={inspectionData[item.key]?.keterangan || ''}
                  onChange={(e) => handleInputChange(item.key, 'keterangan', e.target.value)}
                  className="w-full md:w-1/3 border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            ))}
          </div>
        ))}

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md shadow-lg transition duration-300 ease-in-out"
        >
          Simpan Hasil Inspeksi
        </button>
      </form>
    </div>
  );
}