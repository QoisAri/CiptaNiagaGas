'use client';

import React, { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { usePathname } from 'next/navigation';
import { upsertInspectionResult, deleteInspection, type FormState } from '@/app/storage/actions';
import { FaPrint } from 'react-icons/fa';

// Tipe data
type Row = {
  id: string;
  name: string;
  resultId: string | null;
  kondisi: string;
  keterangan: string | null;
};
type Group = Record<string, Row[]>;
type Props = { 
  inspectionHeader: any; 
  groups: Group;
  deleteAction: (formData: FormData) => void; 
};

// Tombol Submit untuk form edit
function SubmitButton({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button type="submit" disabled={pending} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md text-sm">
        {pending ? 'Menyimpan...' : 'Simpan'}
      </button>
      <button type="button" onClick={onCancel} disabled={pending} className="bg-gray-200 hover:bg-gray-300 text-black font-semibold py-1 px-3 rounded-md text-sm">
        Batal
      </button>
    </>
  );
}

// Komponen untuk satu baris item dengan fungsionalitas edit
function ItemRow({ row, inspectionId, pathname }: { row: Row, inspectionId: string, pathname: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formState, formAction] = useActionState(upsertInspectionResult, { message: '', success: false });
  const formId = `form-${row.id}`;

  useEffect(() => {
    if (formState.success) setIsEditing(false);
  }, [formState]);

  return (
    <tr>
      <td className="border border-black px-4 py-2 text-black">{row.name}</td>
      {isEditing ? (
        <>
          <td className="border border-black px-4 py-2 text-black">
            <select name="kondisi" form={formId} defaultValue={row.kondisi !== 'Belum Diperiksa' ? row.kondisi : 'baik'} className="w-full p-1 border rounded-md">
              <option value="baik">Baik</option>
              <option value="tidak_baik">Tidak Baik</option>
            </select>
          </td>
          <td className="border border-black px-4 py-2 text-black">
            <input type="text" name="keterangan" form={formId} defaultValue={row.keterangan || ''} className="w-full p-1 border rounded-md" placeholder="Keterangan..." />
          </td>
        </>
      ) : (
        <>
          <td className="border border-black px-4 py-2 text-black">{row.kondisi}</td>
          <td className="border border-black px-4 py-2 text-black">{row.keterangan}</td>
        </>
      )}
      <td className="border border-black px-4 py-2 text-center space-x-2 no-print">
        {isEditing ? (
          <form id={formId} action={formAction}>
            <input type="hidden" name="resultId" value={row.resultId || undefined} />
            <input type="hidden" name="itemId" value={row.id} />
            <input type="hidden" name="inspectionId" value={inspectionId} />
            <input type="hidden" name="pathname" value={pathname} />
            <SubmitButton onCancel={() => setIsEditing(false)} />
          </form>
        ) : (
          <button type="button" onClick={() => setIsEditing(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-md text-sm">
            Edit
          </button>
        )}
      </td>
    </tr>
  );
}

// Komponen Utama
export const StorageDetailClient = ({ inspectionHeader, groups, deleteAction }: Props) => {
  const pathname = usePathname();

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="space-y-6 print-area">
        <div className="bg-white shadow rounded p-4">
          <div className="flex justify-between items-start">
              <div>
                  <h2 className="text-xl font-semibold mb-2 text-black">Informasi Pemeriksaan</h2>
                  <p className="text-black"><strong>Nama Pemeriksa:</strong> {inspectionHeader.profiles?.name || 'N/A'}</p>
                  <p className="text-black"><strong>Nomor Storage:</strong> {inspectionHeader.storages?.storage_code || 'N/A'}</p>
                  <p className="text-black"><strong>Tanggal:</strong> {new Date(inspectionHeader.tanggal).toLocaleDateString('id-ID')}</p>
                  <p className="text-black"><strong>Catatan:</strong> {inspectionHeader.catatan || '-'}</p>
              </div>
              <div className="flex space-x-2 no-print">
                  <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700">
                    <FaPrint /> Unduh
                  </button>
                  <form action={deleteAction} onSubmit={(e) => !confirm('Anda yakin?') && e.preventDefault()}>
                      <input type="hidden" name="inspectionId" value={inspectionHeader.id} />
                      <input type="hidden" name="redirectTo" value="/storage" />
                      <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm">
                          Hapus Inspeksi
                      </button>
                  </form>
              </div>
          </div>
        </div>

        {Object.entries(groups).map(([pageTitle, items]) => (
          <div key={pageTitle} className="bg-white shadow rounded p-4">
            <h3 className="text-lg font-bold mb-3 text-black">{pageTitle}</h3>
            <div className="overflow-x-auto">
              <table className="table-auto w-full border border-collapse border-black">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-black px-4 py-2 text-left font-bold text-black w-1/3">Item</th>
                    <th className="border border-black px-4 py-2 text-left font-bold text-black">Kondisi</th>
                    <th className="border border-black px-4 py-2 text-left font-bold text-black">Keterangan</th>
                    <th className="border border-black px-4 py-2 text-center font-bold text-black w-48 no-print">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <ItemRow key={row.id} row={row} inspectionId={inspectionHeader.id} pathname={pathname} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
