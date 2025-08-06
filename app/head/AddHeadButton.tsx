'use client';

import { useState, useEffect, useRef } from 'react';
// FIX: Impor useFormState dari react-dom
import { useFormState, useFormStatus } from 'react-dom';
import { addHead, type FormState } from './actions'; 

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
      {pending ? 'Menyimpan...' : 'Simpan Data Head'}
    </button>
  );
}

export function AddHeadButton() {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  const initialState: FormState = { message: '', success: false };
  // FIX: Gunakan useFormState
  const [formState, formAction] = useFormState(addHead, initialState);

  useEffect(() => {
    if (formState.success) {
      formRef.current?.reset();
      setIsOpen(false);
    }
  }, [formState]);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm">
        + Tambah Data
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Tambah Data Head Baru</h3>
            <form ref={formRef} action={formAction}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="head_code" className="block text-sm font-medium text-gray-700">Head Code (Contoh: B 9909 UVY)</label>
                  <input
                    type="text"
                    id="head_code"
                    name="head_code"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-black p-2"
                  />
                </div>
                
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipe</label>
                  <select
                    id="type"
                    name="type"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-black p-2"
                  >
                    <option value="">-- Pilih Tipe --</option>
                    <option value="Arm Roll">Arm Roll</option>
                    <option value="Feet 20">Feet 20</option>
                    <option value="Feet 40">Feet 40</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="feet" className="block text-sm font-medium text-gray-700">Ukuran Feet</label>
                  <select
                    id="feet"
                    name="feet"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-black p-2"
                  >
                    <option value="">-- Pilih Ukuran --</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="40">40</option>
                  </select>
                </div>

              </div>

              {formState.message && (
                // FIX: Menggunakan !formState.success untuk menentukan warna merah (error)
                <div className={`mt-4 text-sm ${!formState.success ? 'text-red-600' : 'text-green-600'}`}>
                  {formState.message}
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button onClick={() => setIsOpen(false)} type="button" className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Batal
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}