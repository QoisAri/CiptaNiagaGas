'use client'
import { useActionState, useEffect, useRef } from 'react'
import { addHead } from '../../app/head/actions'

interface AddHeadModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddHeadModal({ isOpen, onClose }: AddHeadModalProps) {
  const initialState = { message: '' }
  const [state, formAction] = useActionState(addHead, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.message.includes('berhasil')) {
      formRef.current?.reset()
      onClose()
    }
  }, [state, onClose])

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Tambah Data Head Baru</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <label htmlFor="head_code" className="block text-sm font-medium">Head Code</label>
            <input type="text" id="head_code" name="head_code" required className="mt-1 block w-full border border-gray-300 rounded-md p-2"/>
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium">Tipe</label>
            <input type="text" id="type" name="type" placeholder="Contoh: Arm Roll" className="mt-1 block w-full border border-gray-300 rounded-md p-2"/>
          </div>
          <div>
            <label htmlFor="feet" className="block text-sm font-medium">Ukuran Feet</label>
            <select id="feet" name="feet" required className="mt-1 block w-full border border-gray-300 rounded-md p-2">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="40">40</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
            Simpan Data
          </button>
          {state?.message && <p className="text-sm mt-2">{state.message}</p>}
        </form>
      </div>
    </div>
  )
}