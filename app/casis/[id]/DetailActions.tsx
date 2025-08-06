// app/casis/[id]/DetailActions.tsx
'use client';

import { deleteInspection } from '../actions'; // Pastikan path ini benar

type Props = {
  inspectionId: string;
};

export function DetailActions({ inspectionId }: Props) {
  // Kita tidak lagi memerlukan fungsi handleDelete

  return (
    <div className="flex space-x-2 no-print">
      {/* Tombol lain bisa ditambahkan di sini */}

      {/* FIX: Bungkus tombol hapus dengan <form> */}
      <form action={deleteInspection}>
        {/* Kirim inspectionId melalui input tersembunyi */}
        <input type="hidden" name="inspectionId" value={inspectionId} />
        <input type="hidden" name="redirectTo" value="/casis" />
        
        <button 
          type="submit" 
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm"
        >
          Hapus Inspeksi
        </button>
      </form>
    </div>
  );
}