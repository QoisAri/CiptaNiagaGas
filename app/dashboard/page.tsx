'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSelection } from '../context/SelectionContext';
import { useAuth } from '../context/AuthContext';
import { FaTruck, FaWarehouse, FaCogs } from 'react-icons/fa';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

// Import untuk Grafik
import dynamic from 'next/dynamic';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), { ssr: false });
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


const imageData = [
    { src: '/container-1.png', title: 'Volvo Chasis X90', jam: '11:08' },
    { src: '/container-2.png', title: 'Acura Polester 3', jam: '08:40' },
];
const reportSummaryData = {
    daily: { label: 'Laporan Hari Ini', value: 5 },
    weekly: { label: 'Laporan Minggu Ini', value: 42 },
    monthly: { label: 'Laporan Bulan Ini', value: 189 },
    yearly: { label: 'Laporan Tahun Ini', value: 2150 }
};

export default function DashboardPage() {
  const { selections, isLoading: isSelectionLoading } = useSelection();
  const { session, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  type ChartMode = 'daily' | 'weekly' | 'monthly' | 'yearly';
  const [chartMode, setChartMode] = useState<ChartMode>('monthly');

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prevIndex => (prevIndex + 1) % imageData.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Data dan Opsi untuk Grafik
  const chartLabels: Record<ChartMode, string[]> = { daily: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'], weekly: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'], monthly: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], yearly: ['2022', '2023', '2024', '2025'] };
  const chartDataSets: Record<ChartMode, number[]> = { daily: [5, 9, 7, 8, 6, 5, 4], weekly: [25, 30, 45, 40], monthly: [12, 19, 3, 5, 2, 3, 7, 8, 10, 15, 9, 11], yearly: [150, 180, 220, 210] };
  const chartData = { labels: chartLabels[chartMode], datasets: [{ label: 'Laporan', data: chartDataSets[chartMode], backgroundColor: 'rgba(59, 130, 246, 0.5)', borderColor: 'rgba(59, 130, 246, 1)', borderRadius: 5, borderWidth: 1 }] };
  const chartOptions = { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: `Grafik Laporan ${chartMode.charAt(0).toUpperCase() + chartMode.slice(1)}` } } };

  if (isSelectionLoading || isAuthLoading || !session) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  const currentCarouselItem = imageData[activeIndex];
  const currentSummary = reportSummaryData[chartMode];

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
      
      {/* KARTU FOTO CONTAINER (DIKEMBALIKAN) */}
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

      {/* Grid untuk Grafik dan Kartu Ringkasan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700">Grafik Laporan</h3>
            <select 
              value={chartMode} 
              onChange={(e) => setChartMode(e.target.value as ChartMode)} 
              className="border rounded-md px-3 py-1 text-sm bg-gray-50"
            >
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
          </div>
          <div className="h-72">
            <Bar options={chartOptions} data={chartData} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-gray-700 mb-4">Ringkasan Laporan</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
              <span className="font-semibold text-gray-600">{currentSummary.label}</span>
              <span className="font-bold text-2xl text-blue-600">
                <AnimatedCounter to={currentSummary.value} />
              </span>
            </div>
            <div className="text-sm text-gray-500 pt-4">
              <p>Ini adalah ringkasan data berdasarkan filter waktu yang Anda pilih.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}