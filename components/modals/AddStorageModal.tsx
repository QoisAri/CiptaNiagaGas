'use client'

import { useActionState, useEffect, useRef } from 'react'
// Impor fungsi DAN tipe FormState
import { addStorage, type FormState } from '@/app/storage/actions'

interface AddStorageModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddStorageModal({ isOpen, onClose }: AddStorageModalProps) {
  // Berikan tipe yang jelas pada initialState
  const initialState: FormState = { message: '' };
  
  const [state, formAction] = useActionState(addStorage, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // 'state' sekarang memiliki tipe yang benar, tidak lagi 'never'
    if (state?.message.includes('berhasil')) {
      formRef.current?.reset();
      onClose();
    }
  }, [state, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Tambah Data Storage Baru</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <label htmlFor="storage_code" className="block text-sm font-medium">Storage Code</label>
            <input type="text" id="storage_code" name="storage_code" required className="mt-1 block w-full border border-gray-300 rounded-md p-2"/>
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium">Tipe</label>
            <input type="text" id="type" name="type" placeholder="Contoh: Vertical Storage" required className="mt-1 block w-full border border-gray-300 rounded-md p-2"/>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
            Simpan Data
          </button>
          {/* Kode ini sekarang akan berfungsi tanpa error */}
          {state?.message && <p className="text-sm mt-2 text-center">{state.message}</p>}
        </form>
      </div>
    </div>
  )
}