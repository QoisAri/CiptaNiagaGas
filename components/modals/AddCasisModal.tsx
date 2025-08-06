'use client'
// FIX 2: Impor useFormState dari react-dom
import { useFormState } from 'react-dom'
import { useEffect, useRef } from 'react'
import { addCasis, type FormState } from '@/app/casis/actions'

interface AddCasisModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddCasisModal({ isOpen, onClose }: AddCasisModalProps) {
  // FIX 1: Lengkapi initialState agar cocok dengan tipe FormState
  const initialState: FormState = { message: '', success: false };
  
  // FIX 2: Gunakan useFormState
  const [state, formAction] = useFormState(addCasis, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    // Gunakan state.success untuk logika yang lebih andal
    if (state.success) {
      formRef.current?.reset()
      onClose()
    }
  }, [state, onClose])

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Tambah Data Casis Baru</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <label htmlFor="chassis_code" className="block text-sm font-medium">Chassis Code</label>
            <input type="text" id="chassis_code" name="chassis_code" required className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"/>
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium">Tipe</label>
            <input type="text" id="type" name="type" placeholder="Contoh: 2-Axle 20ft" required className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"/>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
            Simpan Data
          </button>
          {state?.message && (
            <p className={`text-sm mt-2 ${!state.success ? 'text-red-600' : 'text-green-600'}`}>
              {state.message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
