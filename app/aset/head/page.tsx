'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client'; 

type Head = {
  id: string;
  head_code: string;
  type: string;
  feet: number;
  created_at: string;
};

// --- IKON-IKON ---

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

export default function DaftarHeadPage() {
  const supabase = createClient();
  
  // State Data
  const [headList, setHeadList] = useState<Head[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State Form Input
  const [newHeadCode, setNewHeadCode] = useState('');
  const [newHeadType, setNewHeadType] = useState('');
  const [newHeadFeet, setNewHeadFeet] = useState<number | ''>('');

  // State Edit Mode (null = Tambah, ada string = Edit ID tersebut)
  const [editingId, setEditingId] = useState<string | null>(null);

  // 1. FUNGSI AMBIL DATA (READ)
  const fetchHeads = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('heads')
      .select('*');

    if (error) {
      console.error('Error fetching heads:', error);
      setError('Gagal memuat data head.');
    } else {
      // Sorting: Feet kecil ke besar, lalu Head Code A-Z
      const sortedData = data.sort((a, b) => {
        if (a.feet < b.feet) return -1;
        if (a.feet > b.feet) return 1;
        return a.head_code.localeCompare(b.head_code, undefined, { numeric: true, sensitivity: 'base' });
      });
      setHeadList(sortedData);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchHeads();
  }, [fetchHeads]);

  // 2. FUNGSI SIMPAN (CREATE & UPDATE)
  const handleSaveHead = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validasi Input
    if (!newHeadCode || !newHeadType || !newHeadFeet) {
        alert('Semua field wajib diisi!');
        return;
    }

    const payload = { 
      head_code: newHeadCode, 
      type: newHeadType, 
      feet: Number(newHeadFeet) 
    };

    try {
      if (editingId) {
        // --- MODE EDIT (UPDATE) ---
        const { error } = await supabase
          .from('heads')
          .update(payload)
          .eq('id', editingId)
          .select(); // Pastikan data terupdate

        if (error) throw error;

      } else {
        // --- MODE TAMBAH (INSERT) ---
        const { error } = await supabase
          .from('heads')
          .insert([payload])
          .select();

        if (error) throw error;
      }

      // Jika sukses
      await fetchHeads(); // Refresh data tabel
      closeModal(); // Tutup modal

    } catch (error: any) {
      console.error('Error saving head:', error);
      alert(`Gagal menyimpan data: ${error.message}`);
    }
  };

  // 3. FUNGSI HAPUS (DELETE)
  const handleDeleteHead = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus head ini?')) {
      return;
    }
    const { error } = await supabase
      .from('heads')
      .delete()
      .match({ id: id });

    if (error) {
      console.error('Error deleting head:', error);
      alert(`Gagal menghapus head: ${error.message}`);
    } else {
      fetchHeads();
    }
  };

  // --- MANAJEMEN MODAL ---

  const openAddModal = () => {
    setEditingId(null); // Reset ke mode tambah
    setNewHeadCode('');
    setNewHeadType('');
    setNewHeadFeet('');
    setIsModalOpen(true);
  };

  const openEditModal = (head: Head) => {
    setEditingId(head.id); // Set ID yang sedang diedit
    setNewHeadCode(head.head_code);
    setNewHeadType(head.type);
    setNewHeadFeet(head.feet);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewHeadCode('');
    setNewHeadType('');
    setNewHeadFeet('');
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Daftar Aset Head</h1>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          <PlusIcon /> Tambah Head
        </button>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Kode Head</th>
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
            ) : headList.length > 0 ? (
              headList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b text-gray-900 font-semibold">{item.head_code}</td>
                  <td className="px-4 py-3 border-b text-gray-900">{item.type}</td>
                  <td className="px-4 py-3 border-b text-gray-900">{item.feet}</td>
                  <td className="px-4 py-3 border-b text-center">
                    <div className="flex justify-center gap-2">
                      {/* Tombol Edit */}
                      <button onClick={() => openEditModal(item)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors" aria-label="Edit">
                        <PencilIcon />
                      </button>
                      {/* Tombol Hapus */}
                      <button onClick={() => handleDeleteHead(item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors" aria-label="Hapus">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : ( 
              <tr><td colSpan={4} className="text-center py-10 text-gray-500">Tidak ada data head.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL POPUP --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            
            {/* Judul Dinamis */}
            <h2 className="text-xl font-bold mb-6 text-gray-900">
              {editingId ? 'Edit Data Head' : 'Tambah Head Baru'}
            </h2>
            
            <form onSubmit={handleSaveHead}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="head_code" className="block text-sm font-medium text-gray-800 mb-1">Kode Head</label>
                  <input type="text" id="head_code" value={newHeadCode} onChange={(e) => setNewHeadCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black" required />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-800 mb-1">Tipe</label>
                  <input type="text" id="type" value={newHeadType} onChange={(e) => setNewHeadType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black" required />
                </div>
                <div>
                  <label htmlFor="feet" className="block text-sm font-medium text-gray-800 mb-1">Feet</label>
                  <select
                    id="feet"
                    value={newHeadFeet}
                    onChange={(e) => setNewHeadFeet(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                    required
                  >
                    <option value="" disabled>Pilih ukuran...</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="40">40</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Batal</button>
                <button type="submit" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  {editingId ? 'Simpan Perubahan' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}