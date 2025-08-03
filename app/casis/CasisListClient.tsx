'use client';

import React from 'react';
import { useFormStatus } from 'react-dom';
import { deleteInspection } from '@/app/casis/actions';

// PERBAIKAN: Membuat tipe data yang lebih spesifik
type Row = { id: string; name: string; kondisi: string; keterangan: string | null; };
type SubGroup = { parentName: string; rows: Row[] };
type Group = Record<string, SubGroup[]>;

// PERBAIKAN: Tipe spesifik untuk inspectionHeader, menggantikan 'any'
type InspectionHeader = {
  id: string;
  tanggal: string;
  catatan: string | null;
  profiles: { name: string } | null;
  chassis: { chassis_code: string } | null;
};

type Props = { 
  inspectionHeader: InspectionHeader; 
  groups: Group; 
};

function DeleteInspectionButton({ inspectionId }: { inspectionId: string }) {
    const { pending } = useFormStatus();
    const handleDelete = (event: React.FormEvent<HTMLFormElement>) => {
        if (!confirm('Anda yakin ingin menghapus seluruh data inspeksi ini?')) {
            event.preventDefault();
        }
    }
    return (
        <form action={deleteInspection} onSubmit={handleDelete}>
            <input type="hidden" name="inspectionId" value={inspectionId} />
            <button type="submit" disabled={pending} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm">
                {pending ? 'Menghapus...' : 'Hapus Inspeksi'}
            </button>
        </form>
    );
}

export const CasisDetailClient = ({ inspectionHeader, groups }: Props) => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded p-4">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-xl font-semibold mb-2 text-black">Informasi Pemeriksaan</h2>
                <p className="text-black"><strong>Nama Pemeriksa:</strong> {inspectionHeader.profiles?.name || 'N/A'}</p>
                <p className="text-black"><strong>Nomor Casis:</strong> {inspectionHeader.chassis?.chassis_code || 'N/A'}</p>
                <p className="text-black"><strong>Tanggal:</strong> {new Date(inspectionHeader.tanggal).toLocaleDateString('id-ID')}</p>
                <p className="text-black"><strong>Catatan:</strong> {inspectionHeader.catatan || '-'}</p>
            </div>
            <div>
                <DeleteInspectionButton inspectionId={inspectionHeader.id} />
            </div>
        </div>
      </div>

      {Object.entries(groups).map(([pageTitle, subGroups]) => (
        <div key={pageTitle} className="bg-white shadow rounded p-4">
          <h3 className="text-lg font-bold mb-3 text-black">{pageTitle}</h3>
          <div className="overflow-x-auto">
            <table className="table-auto w-full border border-collapse border-black">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-black px-4 py-2 text-left font-bold text-black w-1/3">Item</th>
                  <th className="border border-black px-4 py-2 text-left font-bold text-black">Kondisi</th>
                  <th className="border border-black px-4 py-2 text-left font-bold text-black">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {subGroups.map((subGroup) => (
                  <React.Fragment key={subGroup.parentName}>
                    {subGroup.rows.length > 1 && subGroup.parentName !== subGroup.rows[0].name && (
                        <tr><td colSpan={3} className="bg-gray-100 font-semibold p-2 border border-black">{subGroup.parentName}</td></tr>
                    )}
                    {subGroup.rows.map((row) => (
                      <tr key={row.id}><td className="border border-black px-4 py-2 text-black">{row.name}</td><td className="border border-black px-4 py-2 text-black">{row.kondisi}</td><td className="border border-black px-4 py-2 text-black">{row.keterangan}</td></tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};
