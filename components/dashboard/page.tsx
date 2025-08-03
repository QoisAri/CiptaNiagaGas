'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSelection } from '../../app/context/SelectionContext';
import { useAuth } from '../../app/context/AuthContext';
import { FaTruck, FaWarehouse, FaCogs } from 'react-icons/fa';

const imageData = [
    { src: '/container-1.png', title: 'Volvo Chasis X90', jam: '11:08' },
    { src: '/container-2.png', title: 'Acura Polester 3', jam: '08:40' },
];

export default function DashboardPage() {
  const { selections, isLoading: isSelectionLoading } = useSelection();
  const { session, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prevIndex => (prevIndex + 1) % imageData.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isSelectionLoading || isAuthLoading || !session) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  const currentCarouselItem = imageData[activeIndex];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <button 
          onClick={() => router.push('/select')}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
        >
          Ganti Tipe
        </button>
      </div>

      {/* Kartu Tipe Dipilih */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md"><div className="flex items-center gap-4"><FaTruck className="text-blue-500" size={24} /><p className="text-sm text-gray-500">Tipe Casis Dipilih</p></div><p className="text-3xl font-bold text-gray-800 mt-2">{selections.casis.join(', ') || 'Tidak ada'}</p></div>
        <div className="bg-white rounded-xl p-6 shadow-md"><div className="flex items-center gap-4"><FaWarehouse className="text-blue-500" size={24} /><p className="text-sm text-gray-500">Tipe Storage Dipilih</p></div><p className="text-3xl font-bold text-gray-800 mt-2">{selections.storage.join(', ') || 'Tidak ada'}</p></div>
        <div className="bg-white rounded-xl p-6 shadow-md"><div className="flex items-center gap-4"><FaCogs className="text-blue-500" size={24} /><p className="text-sm text-gray-500">Tipe Head Dipilih</p></div><p className="text-3xl font-bold text-gray-800 mt-2">{selections.head.join(', ') || 'Tidak ada'}</p></div>
      </div>
      
      {/* Kartu Foto Container */}
      <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold mb-4 text-gray-700">Foto Container</h3>
          <div className="relative aspect-video max-h-[300px] w-full overflow-hidden rounded-lg">
              <Image src={currentCarouselItem.src} alt={currentCarouselItem.title} fill className="object-cover" />
          </div>
          <div className="flex justify-center gap-2 mt-4">
              {imageData.map((_, i) => (
                  <button key={i} className={`w-3 h-3 rounded-full transition-all ${i === activeIndex ? 'bg-blue-600 scale-125' : 'bg-gray-300'}`} onClick={() => setActiveIndex(i)} />
              ))}
          </div>
          <div className='text-center mt-4 border-t pt-4'>
              <p className='text-sm text-gray-500'>Terakhir dicek pukul:</p>
              <p className='font-bold text-blue-600 text-lg'>{currentCarouselItem.jam}</p>
          </div>
      </div>

      {/* Kartu Grafik (Placeholder) */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-bold text-gray-700">Grafik Laporan</h3>
        <div className="mt-4 text-center text-gray-400">
            <p>(Komponen Grafik akan ditampilkan di sini)</p>
        </div>
      </div>
    </div>
  );
}