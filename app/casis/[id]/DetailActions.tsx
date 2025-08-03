'use client'

import { deleteInspection } from '../actions';

export default function DetailActions({ inspectionId }: { inspectionId: string }) {
  const handleDelete = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data inspeksi ini?')) {
      await deleteInspection(inspectionId);
    }
  };

  const handleEdit = () => {
    alert('Fungsionalitas Edit akan dibuat selanjutnya.');
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleEdit} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg">Edit</button>
      <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg">Hapus</button>
    </div>
  );
}