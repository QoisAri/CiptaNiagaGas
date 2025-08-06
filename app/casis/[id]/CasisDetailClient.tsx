'use client';

import React, { useState, useEffect } from 'react';
// FIX: Impor useFormState dari react-dom
import { useFormState, useFormStatus } from 'react-dom';
import { usePathname } from 'next/navigation';
import { upsertInspectionResult } from '@/app/casis/actions';
import { FaPrint, FaImage } from 'react-icons/fa';
import Image from 'next/image';

// Tipe data tidak berubah
type Row = {
  id: string;
  name: string;
  standard: string | null;
  resultId: string | null;
  kondisi: string;
  keterangan: string | null;
  problem_photo_url: string | null;
};
type Group = Record<string, SubGroup[]>;
type SubGroup = { parentName: string; rows: Row[] };

type InspectionHeaderType = {
  id: string;
  tanggal: string;
  catatan: string | null;
  profiles: { name: string; } | null;
  chassis: { chassis_code: string; } | null;
};

type Props = { 
  inspectionHeader: InspectionHeaderType; 
  groups: Group;
  deleteAction: (formData: FormData) => void; 
};

function SubmitButton({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button type="submit" disabled={pending} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md text-sm">
        {pending ? 'Menyimpan...' : 'Simpan'}
      </button>
      <button type="button" onClick={() => onCancel()} disabled={pending} className="bg-gray-200 hover:bg-gray-300 text-black font-semibold py-1 px-3 rounded-md text-sm">
        Batal
      </button>
    </>
  );
}

function ItemRow({ row, inspectionId, pathname, onShowImage }: { row: Row, inspectionId: string, pathname: string, onShowImage: (url: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  // FIX: Gunakan useFormState
  const [formState, formAction] = useFormState(upsertInspectionResult, { message: '', success: false });
  const formId = `form-${row.id}`;

  useEffect(() => {
    if (formState.success) setIsEditing(false);
  }, [formState]);
  
  const cleanedUrl = row.problem_photo_url?.replace(/([^:]\/)\/+/g, "$1") || '';

  return (
    <tr>
      <td className="border border-black px-4 py-2 text-black">{row.name}</td>
      <td className="border border-black px-4 py-2 text-black">{row.standard || '-'}</td>
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
      
      <td className="border border-black px-4 py-2 text-center">
        {row.problem_photo_url ? (
          <button onClick={() => onShowImage(cleanedUrl)} className="text-blue-600 hover:underline">
            <FaImage className="inline-block h-5 w-5" />
          </button>
        ) : (
          '-'
        )}
      </td>

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

export function CasisDetailClient({ inspectionHeader, groups, deleteAction }: Props) {
  const pathname = usePathname();
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

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
              <p className="text-black"><strong>Nomor Casis:</strong> {inspectionHeader.chassis?.chassis_code || 'N/A'}</p>
              <p className="text-black"><strong>Tanggal:</strong> {new Date(inspectionHeader.tanggal).toLocaleDateString('id-ID')}</p>
              <p className="text-black"><strong>Catatan:</strong> {inspectionHeader.catatan || '-'}</p>
            </div>
            <div className="flex space-x-2 no-print">
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700">
                <FaPrint /> Unduh
              </button>
              {/* FIX: Dihapus onSubmit dengan confirm() untuk menghindari masalah deploy */}
              <form action={deleteAction}>
                <input type="hidden" name="inspectionId" value={inspectionHeader.id} />
                <input type="hidden" name="redirectTo" value="/casis" />
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm">
                  Hapus Inspeksi
                </button>
              </form>
            </div>
          </div>
        </div>

        {Object.entries(groups).map(([pageTitle, subGroups]) => (
          <div key={pageTitle} className="bg-white shadow rounded p-4">
            <h3 className="text-lg font-bold mb-3 text-black">{pageTitle}</h3>
            {subGroups.map((subGroup) => (
              <div key={subGroup.parentName} className="mb-4">
                <h4 className="text-md font-semibold mb-2 text-gray-700">{subGroup.parentName}</h4>
                <div className="overflow-x-auto">
                  <table className="table-auto w-full border border-collapse border-black">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="border border-black px-4 py-2 text-left font-bold text-black w-1/3">Item</th>
                        <th className="border border-black px-4 py-2 text-left font-bold text-black">Standard</th>
                        <th className="border border-black px-4 py-2 text-left font-bold text-black">Kondisi</th>
                        <th className="border border-black px-4 py-2 text-left font-bold text-black">Keterangan</th>
                        <th className="border border-black px-4 py-2 text-center font-bold text-black">Foto</th>
                        <th className="border border-black px-4 py-2 text-center font-bold text-black w-48 no-print">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subGroup.rows.map((row) => (
                        <ItemRow key={row.id} row={row} inspectionId={inspectionHeader.id} pathname={pathname} onShowImage={setModalImageUrl} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ))}
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
              alt="Problem photo"
              width={800}
              height={600}
              className="max-w-screen-lg max-h-screen-lg object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
};