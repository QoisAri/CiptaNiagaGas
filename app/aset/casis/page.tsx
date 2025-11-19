'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client'; 

type Chassis = {
  id: number; // Sesuai kode asli Anda (number)
  chassis_code: string;
  type: string;
  feet: number;
  created_at: string;
};

// --- Ikon-ikon ---

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
  </svg>
);

const PencilIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
  </svg>
);

export default function DaftarCasisPage() {
  const supabase = createClient();
  const [chassisList, setChassisList] = useState<Chassis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State Form
  const [newChassisCode, setNewChassisCode] = useState('');
  const [newChassisType, setNewChassisType] = useState('');
  const [newChassisFeet, setNewChassisFeet] = useState<number | ''>('');

  // State Edit Mode (null = Tambah, angka = ID Edit)
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchChassis = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('chassis')
      .select('*');
      
    if (error) {
      console.error('Error fetching chassis:', error);
      setError('Gagal memuat data casis.');
    } else {
      const sortedData = data.sort((a, b) => {
        const aIsNumeric = /^\d+$/.test(a.chassis_code);
        const bIsNumeric = /^\d+$/.test(b.chassis_code);
        if (aIsNumeric && !bIsNumeric) return -1;
        if (!aIsNumeric && bIsNumeric) return 1;
        if (aIsNumeric && bIsNumeric) {
          return parseInt(a.chassis_code, 10) - parseInt(b.chassis_code, 10);
        }
        return a.chassis_code.localeCompare(b.chassis_code);
      });
      setChassisList(sortedData);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchChassis();
  }, [fetchChassis]);

  // --- FUNGSI SIMPAN (Insert & Update) ---
  const handleSaveChassis = async (e: FormEvent) => {
    e.preventDefault();
    if (!newChassisCode || !newChassisType || !newChassisFeet) {
        alert('Semua field wajib diisi!');
        return;
    }

    const payload = { 
      chassis_code: newChassisCode, 
      type: newChassisType, 
      feet: Number(newChassisFeet) 
    };

    console.log("Mengirim data:", payload, "Mode:", editingId ? "EDIT" : "TAMBAH");

    try {
      if (editingId !== null) {
        // === LOGIKA UPDATE (EDIT) ===
        const { data, error } = await supabase
          .from('chassis')
          .update(payload)
          .eq('id', editingId)
          .select();

        if (error) throw error;
        
        if (!data || data.length === 0) {
           throw new Error("Gagal update. ID tidak ditemukan atau izin RLS belum diatur.");
        }

      } else {
        // === LOGIKA INSERT (TAMBAH BARU) ===
        const { error } = await supabase
          .from('chassis')
          .insert([payload])
          .select();

        if (error) throw error;
      }

      await fetchChassis();
      closeModal();

    } catch (error: any) {
      console.error('Error saving chassis:', error);
      alert(`Gagal menyimpan data: ${error.message}`);
    }
  };

  const handleDeleteChassis = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus casis ini?')) {
      return;
    }
    const { error } = await supabase
      .from('chassis')
      .delete()
      .match({ id: id });

    if (error) {
      console.error('Error deleting chassis:', error);
      alert(`Gagal menghapus casis: ${error.message}`);
    } else {
      fetchChassis();
    }
  };

  // Manajemen Modal
  const openAddModal = () => {
    setEditingId(null);
    setNewChassisCode('');
    setNewChassisType('');
    setNewChassisFeet('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: Chassis) => {
    setEditingId(item.id);
    setNewChassisCode(item.chassis_code);
    setNewChassisType(item.type);
    setNewChassisFeet(item.feet);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewChassisCode('');
    setNewChassisType('');
    setNewChassisFeet('');
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Daftar Aset Casis</h1>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          <PlusIcon /> Tambah Casis
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Kode Casis</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Tipe</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Feet</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-800 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? ( 
              <tr><td colSpan={4} className="text-center py-10">Memuat data...</td></tr>
            ) : error ? ( 
              <tr><td colSpan={4} className="text-center py-10 text-red-500">{error}</td></tr>
            ) : chassisList.length > 0 ? (
              chassisList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b text-gray-900 font-semibold">{item.chassis_code}</td>
                  <td className="px-4 py-3 border-b text-gray-900">{item.type}</td>
                  <td className="px-4 py-3 border-b text-gray-900">{item.feet}</td>
                  <td className="px-4 py-3 border-b text-center">
                    <div className="flex justify-center gap-2">
                      {/* Tombol Edit */}
                      <button onClick={() => openEditModal(item)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors" aria-label="Edit">
                        <PencilIcon />
                      </button>
                      {/* Tombol Hapus */}
                      <button onClick={() => handleDeleteChassis(item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors" aria-label="Hapus">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : ( 
              <tr><td colSpan={4} className="text-center py-10 text-gray-500">Tidak ada data casis.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-6 text-gray-900">
              {editingId !== null ? 'Edit Data Casis' : 'Tambah Casis Baru'}
            </h2>
            <form onSubmit={handleSaveChassis}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="chassis_code" className="block text-sm font-medium text-gray-800 mb-1">Kode Casis</label>
                  <input type="text" id="chassis_code" value={newChassisCode} onChange={(e) => setNewChassisCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black" required />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-800 mb-1">Tipe</label>
                  <input type="text" id="type" value={newChassisType} onChange={(e) => setNewChassisType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black" required />
                </div>
                <div>
                  <label htmlFor="feet" className="block text-sm font-medium text-gray-800 mb-1">Feet</label>
                  <select
                    id="feet"
                    value={newChassisFeet}
                    onChange={(e) => setNewChassisFeet(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                    required
                  >
                    <option value="" disabled>Pilih ukuran...</option>
                    <option value="20">20</option>
                    <option value="40">40</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Batal</button>
                <button type="submit" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  {editingId !== null ? 'Simpan Perubahan' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}