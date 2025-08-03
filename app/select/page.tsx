'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelection } from '../context/SelectionContext';
import { FaTruck, FaWarehouse, FaCogs } from 'react-icons/fa';

const options = {
  casis: { name: 'Casis', icon: FaTruck, types: ['20', '40'] },
  storage: { name: 'Storage', icon: FaWarehouse, types: ['10', '20', '40'] },
  head: { name: 'Head', icon: FaCogs, types: ['10 (armroll)', '20', '40'] },
};
type Category = keyof typeof options;

export default function SelectMultiTypePage() {
  const router = useRouter();
  const { setSelections } = useSelection();
  
  const [localSelections, setLocalSelections] = useState({ casis: [] as string[], storage: [] as string[], head: [] as string[] });

  const handleCheckboxChange = (category: Category, type: string) => {
    const typeValue = type.split(' ')[0];
    setLocalSelections(prev => {
      const currentCategorySelections = prev[category];
      const newSelections = currentCategorySelections.includes(typeValue)
        ? currentCategorySelections.filter(t => t !== typeValue)
        : [...currentCategorySelections, typeValue];
      return { ...prev, [category]: newSelections };
    });
  };

  const handleContinue = () => {
    setSelections(localSelections);
    router.push('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800">Pilih Aset</h1>
          <p className="text-gray-600 mt-2">Pilih tipe aset yang ingin Anda tampilkan di dasbor.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.keys(options).map(cat => {
            const category = cat as Category;
            const Icon = options[category].icon;
            return (
              <div key={category} className="border p-4 rounded-lg">
                <h2 className="font-bold text-lg text-blue-700 mb-3 flex items-center gap-2"><Icon /> {options[category].name}</h2>
                <div className="space-y-2">
                  {options[category].types.map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" onChange={() => handleCheckboxChange(category, type)} />
                      <span className="text-gray-800">{type} Feet</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <button onClick={handleContinue} className="bg-green-500 text-white font-bold py-3 px-12 rounded-lg shadow-md hover:bg-green-600 transition-colors text-lg">
            Masuk ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}