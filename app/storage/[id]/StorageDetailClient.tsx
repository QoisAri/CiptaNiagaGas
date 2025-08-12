'use client';

import React, { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { usePathname } from 'next/navigation';
// Impor fungsi unduh Word dari actions
import { upsertInspectionResult, generateStorageWordDoc } from '@/app/storage/actions'; 
import { FaFileWord, FaImage } from 'react-icons/fa'; // Ganti FaPrint dengan FaFileWord
import { saveAs } from 'file-saver';
import Image from 'next/image';

type Row = {
  id: string;
  name: string;
  standard: string | null;
  resultId: string | null;
  kondisi: string;
  keterangan: string | null;
  problem_photo_url: string | null;
};
type Group = Record<string, Row[]>;

type InspectionHeaderType = {
  id: string;
  tanggal: string;
  catatan: string | null;
  profiles: { name: string; } | null;
  storages: { storage_code: string; } | null;
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
      <button type="button" onClick={onCancel} disabled={pending} className="bg-gray-200 hover:bg-gray-300 text-black font-semibold py-1 px-3 rounded-md text-sm">
        Batal
      </button>
    </>
  );
}

function ItemRow({ row, inspectionId, pathname, onShowImage }: { row: Row, inspectionId: string, pathname: string, onShowImage: (url: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
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

export const StorageDetailClient = ({ inspectionHeader, groups, deleteAction }: Props) => {
  const pathname = usePathname();
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false); // State untuk download

  // Fungsi untuk handle download Word
  const handleDownloadWord = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const base64String = await generateStorageWordDoc(inspectionHeader.id);
      
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const fileName = `Laporan-Inspeksi-${inspectionHeader.storages?.storage_code}-${dateString}.docx`;
      saveAs(blob, fileName);

    } catch (error) {
      console.error("Gagal mengunduh file Word:", error);
      alert("Terjadi kesalahan saat mengunduh file.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <> {/* Tag pembuka fragment */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="space-y-6">
        <div className="bg-white shadow rounded p-4 print-area">
          <div className="flex justify-between items-start">
              <div>
                  <h2 className="text-xl font-semibold mb-2 text-black">Informasi Pemeriksaan</h2>
                  <p className="text-black"><strong>Nama Pemeriksa:</strong> {inspectionHeader.profiles?.name || 'N/A'}</p>
                  <p className="text-black"><strong>Nomor Storage:</strong> {inspectionHeader.storages?.storage_code || 'N/A'}</p>
                  <p className="text-black"><strong>Tanggal:</strong> {new Date(inspectionHeader.tanggal).toLocaleDateString('id-ID')}</p>
                  <p className="text-black"><strong>Catatan:</strong> {inspectionHeader.catatan || '-'}</p>
              </div>
              <div className="flex space-x-2 no-print">
                  <button onClick={handleDownloadWord} disabled={isDownloading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                    <FaFileWord /> {isDownloading ? 'Mengunduh...' : 'Unduh Word'}
                  </button>
                  <form action={deleteAction}>
                      <input type="hidden" name="inspectionId" value={inspectionHeader.id} />
                      <input type="hidden" name="redirectTo" value="/storage" />
                      <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm">
                          Hapus Inspeksi
                      </button>
                  </form>
              </div>
          </div>
        </div>

        <div className="print-area">
            {Object.entries(groups).map(([pageTitle, items]) => (
            <div key={pageTitle} className="bg-white shadow rounded p-4 mb-6">
                <h3 className="text-lg font-bold mb-3 text-black">{pageTitle}</h3>
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
                    {items.map((row) => (
                        <ItemRow key={row.id} row={row} inspectionId={inspectionHeader.id} pathname={pathname} onShowImage={setModalImageUrl} />
                    ))}
                    </tbody>
                </table>
                </div>
            </div>
            ))}
        </div>
      </div>
      
      {modalImageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 no-print"
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
    </> // <-- Pastikan tag penutup ini ada
  );
};