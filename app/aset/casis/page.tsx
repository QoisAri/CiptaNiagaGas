'use client';

// PERBAIKAN: Mengimpor useCallback
import { useState, useEffect, FormEvent, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client'; 

type Chassis = {
  id: number;
  chassis_code: string;
  type: string;
  feet: number;
  created_at: string;
};

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


export default function DaftarCasisPage() {
  const supabase = createClient();
  const [chassisList, setChassisList] = useState<Chassis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newChassisCode, setNewChassisCode] = useState('');
  const [newChassisType, setNewChassisType] = useState('');
  const [newChassisFeet, setNewChassisFeet] = useState<number | ''>('');

  // PERBAIKAN: Membungkus fungsi dengan useCallback agar tidak dibuat ulang di setiap render
  const fetchChassis = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('chassis')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chassis:', error);
      setError('Gagal memuat data casis.');
    } else {
      setChassisList(data);
    }
    setIsLoading(false);
  }, [supabase]); // supabase client stabil, jadi ini aman

  // PERBAIKAN: Menambahkan fetchChassis ke dependency array
  useEffect(() => {
    fetchChassis();
  }, [fetchChassis]);

  const handleAddChassis = async (e: FormEvent) => {
    e.preventDefault();
    if (!newChassisCode || !newChassisType || !newChassisFeet) {
        alert('Semua field wajib diisi!');
        return;
    }

    const { data, error } = await supabase
      .from('chassis')
      .insert([{ 
        chassis_code: newChassisCode, 
        type: newChassisType, 
        feet: newChassisFeet 
      }])
      .select();

    if (error) {
      console.error('Error adding chassis:', error);
      alert('Gagal menambahkan casis baru.');
    } else if (data) {
      setChassisList([data[0], ...chassisList]);
      closeModal();
    }
  };

  const handleDeleteChassis = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus casis ini?')) {
      return;
    }

    const { error } = await supabase
      .from('chassis')
      .delete()
      .match({ id: id });

    if (error) {
      console.error('Error deleting chassis:', error);
      alert('Gagal menghapus casis.');
    } else {
      setChassisList(chassisList.filter(chassis => chassis.id !== id));
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewChassisCode('');
    setNewChassisType('');
    setNewChassisFeet('');
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Daftar Aset Casis</h1>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon />
          Tambah Casis
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Kode Casis</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Tipe</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Feet</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-800 border-b">Aksi</th>
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
                  <td className="px-4 py-3 border-b text-gray-900">
                    <button 
                      onClick={() => handleDeleteChassis(item.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
                      aria-label="Hapus"
                    >
                      <TrashIcon />
                    </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-6">Tambah Casis Baru</h2>
            <form onSubmit={handleAddChassis}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="chassis_code" className="block text-sm font-medium text-gray-700 mb-1">Kode Casis</label>
                  <input
                    type="text"
                    id="chassis_code"
                    value={newChassisCode}
                    onChange={(e) => setNewChassisCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                  <input
                    type="text"
                    id="type"
                    value={newChassisType}
                    onChange={(e) => setNewChassisType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="feet" className="block text-sm font-medium text-gray-700 mb-1">Feet</label>
                  <input
                    type="number"
                    id="feet"
                    value={newChassisFeet}
                    onChange={(e) => setNewChassisFeet(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
