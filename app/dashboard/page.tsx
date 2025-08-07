'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSelection } from '../context/SelectionContext';
import { useAuth } from '../context/AuthContext';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { createClient } from '@/utils/supabase/client';

// Import untuk Grafik
import dynamic from 'next/dynamic';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), { ssr: false });
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// FIX: Hapus impor gambar. Cukup gunakan path string.
// import cngImage from '../../../public/cng.png';
// import trukcngImage from '../../../public/trukcng.webp';

// FIX: Gunakan path string langsung dari folder public
const imageData = [
    { src: '/CNG_Survey2.jpg', title: 'Volvo Chasis X90', },
    { src: '/Vision_Mision.jpg', title: 'Acura Polester 3', },
];

// Komponen animasi dengan palet warna yang disesuaikan
const HeaderAnimation = () => (
    <div className="relative w-full h-28 bg-gray-900 rounded-xl overflow-hidden shadow-lg flex items-center justify-center">
        <div className="absolute inset-0 z-0">
            <div className="aurora-layer aurora-1"></div>
            <div className="aurora-layer aurora-2"></div>
            <div className="aurora-layer aurora-3"></div>
            <div className="aurora-layer aurora-4"></div>
        </div>
        <h2 className="relative z-10 text-2xl font-bold text-white text-shadow">
            Selamat Datang di Panel Admin
        </h2>
        <style jsx>{`
            .text-shadow {
                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            }
            .aurora-layer {
                position: absolute;
                width: 200%;
                height: 200%;
                opacity: 0.25;
                filter: blur(60px);
                mix-blend-mode: screen;
                border-radius: 50%;
            }
            .aurora-1 {
                background: radial-gradient(circle, #3b82f6 0%, transparent 60%); /* Biru */
                top: -50%;
                left: -50%;
                animation: moveAurora 15s cubic-bezier(0.42, 0, 0.58, 1) infinite;
            }
            .aurora-2 {
                background: radial-gradient(circle, #14b8a6 0%, transparent 60%); /* Teal */
                top: -50%;
                right: -50%;
                animation: moveAurora 17s cubic-bezier(0.42, 0, 0.58, 1) infinite reverse;
            }
            .aurora-3 {
                background: radial-gradient(circle, #8b5cf6 0%, transparent 60%); /* Ungu */
                bottom: -50%;
                left: -50%;
                animation: moveAurora 19s cubic-bezier(0.42, 0, 0.58, 1) infinite;
            }
            .aurora-4 {
                background: radial-gradient(circle, #e0f2fe 0%, transparent 70%); /* Biru Langit (Cerah) */
                bottom: -50%;
                right: -50%;
                animation: moveAurora 21s cubic-bezier(0.42, 0, 0.58, 1) infinite reverse;
            }
            @keyframes moveAurora {
                0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.25; }
                50% { transform: translate(20%, -10%) rotate(180deg) scale(1.2); opacity: 0.4; }
                100% { transform: translate(0, 0) rotate(360deg) scale(1); opacity: 0.25; }
            }
        `}</style>
    </div>
);


export default function DashboardPage() {
    const { selections, isLoading: isSelectionLoading } = useSelection();
    const { session, isLoading: isAuthLoading } = useAuth();
    const [activeIndex, setActiveIndex] = useState(0);
    type ChartMode = 'daily' | 'weekly' | 'monthly' | 'yearly';
    const [chartMode, setChartMode] = useState<ChartMode>('monthly');

    const [reportSummary, setReportSummary] = useState({ daily: 0, weekly: 0, monthly: 0, yearly: 0 });
    const [chartDataSets, setChartDataSets] = useState<Record<ChartMode, number[]>>({ daily: [], weekly: [], monthly: [], yearly: [] });
    const [isLoadingChart, setIsLoadingChart] = useState(true);

    const supabase = createClient();

    const fetchChartData = useCallback(async () => {
        setIsLoadingChart(true);
        const { data: reports, error } = await supabase
            .from('problem_reports')
            .select('created_at');

        if (error) {
            console.error("Error fetching chart data:", error);
            setIsLoadingChart(false);
            return;
        }

        const now = new Date();
        const dailyCounts = Array(7).fill(0);
        const weeklyCounts = Array(4).fill(0);
        const monthlyCounts = Array(12).fill(0);
        const yearlyCounts: Record<string, number> = {};

        let dailyTotal = 0;
        let weeklyTotal = 0;
        let monthlyTotal = 0;
        let yearlyTotal = 0;

        reports.forEach(report => {
            const reportDate = new Date(report.created_at);

            if (reportDate.getFullYear() === now.getFullYear()) {
                yearlyTotal++;
                const yearKey = reportDate.getFullYear().toString();
                yearlyCounts[yearKey] = (yearlyCounts[yearKey] || 0) + 1;
            }
            if (reportDate.getFullYear() === now.getFullYear()) {
                if (reportDate.getMonth() === now.getMonth()) {
                    monthlyTotal++;
                }
                monthlyCounts[reportDate.getMonth()]++;
            }
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const weekOfMonth = Math.ceil((reportDate.getDate() + firstDayOfMonth.getDay()) / 7) - 1;
            if (reportDate.getFullYear() === now.getFullYear() && reportDate.getMonth() === now.getMonth()) {
                 if (weekOfMonth >= 0 && weekOfMonth < 4) {
                    weeklyCounts[weekOfMonth]++;
                }
                const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                if(reportDate >= firstDayOfWeek) weeklyTotal++;
            }
            const dayOfWeek = reportDate.getDay();
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            if (reportDate >= startOfWeek) {
                 dailyCounts[dayOfWeek]++;
                 if(reportDate.toDateString() === now.toDateString()) dailyTotal++;
            }
        });
        
        const currentYear = now.getFullYear();
        const yearLabels = [(currentYear - 2).toString(), (currentYear - 1).toString(), currentYear.toString()];
        const finalYearlyCounts = yearLabels.map(year => yearlyCounts[year] || 0);

        setReportSummary({ daily: dailyTotal, weekly: weeklyTotal, monthly: monthlyTotal, yearly: yearlyTotal });
        setChartDataSets({ daily: dailyCounts, weekly: weeklyCounts, monthly: monthlyCounts, yearly: finalYearlyCounts });
        setIsLoadingChart(false);
    }, [supabase]);

    useEffect(() => {
        fetchChartData();
        const channel = supabase
            .channel('realtime-reports')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'problem_reports' },
                (payload) => {
                    console.log('Perubahan terdeteksi!', payload);
                    fetchChartData();
                }
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, fetchChartData]);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex(prevIndex => (prevIndex + 1) % imageData.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const chartLabels: Record<ChartMode, string[]> = {
        daily: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
        weekly: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
        monthly: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        yearly: [(new Date().getFullYear() - 2).toString(), (new Date().getFullYear() - 1).toString(), new Date().getFullYear().toString()]
    };
    const chartData = { labels: chartLabels[chartMode], datasets: [{ label: 'Laporan', data: chartDataSets[chartMode], backgroundColor: 'rgba(59, 130, 246, 0.5)', borderColor: 'rgba(59, 130, 246, 1)', borderRadius: 5, borderWidth: 1 }] };
    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: `Grafik Laporan ${chartMode.charAt(0).toUpperCase() + chartMode.slice(1)}` } } };

    if (isSelectionLoading || isAuthLoading || !session) {
        return <div className="flex justify-center items-center h-screen">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
                <p className="mt-4 text-gray-600">Memuat Data...</p>
            </div>
        </div>;
    }

    const currentCarouselItem = imageData[activeIndex];
    const currentSummaryValue = reportSummary[chartMode];
    const currentSummaryLabel = {
        daily: 'Laporan Hari Ini',
        weekly: 'Laporan Minggu Ini',
        monthly: 'Laporan Bulan Ini',
        yearly: 'Laporan Tahun Ini'
    }[chartMode];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            </div>

            {/* FIX: Kartu Tipe Dipilih diganti dengan animasi baru */}
            <HeaderAnimation />
            
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
                
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">Grafik Laporan</h3>
                        <select 
                            value={chartMode} 
                            onChange={(e) => setChartMode(e.target.value as ChartMode)} 
                            className="border rounded-md px-3 py-1 text-sm bg-gray-50 text-black"
                        >
                            <option value="daily">Harian</option>
                            <option value="weekly">Mingguan</option>
                            <option value="monthly">Bulanan</option>
                            <option value="yearly">Tahunan</option>
                        </select>
                    </div>
                    <div className="h-72 relative">
                        {isLoadingChart ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
                                <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-blue-600"></div>
                            </div>
                        ) : (
                            <Bar options={chartOptions} data={chartData} />
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="font-bold text-gray-700 mb-4">Ringkasan Laporan</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                            <span className="font-semibold text-gray-600">{currentSummaryLabel}</span>
                            <span className="font-bold text-2xl text-blue-600">
                                <AnimatedCounter to={currentSummaryValue} />
                            </span>
                        </div>
                        <div className="text-sm text-gray-500 pt-4">
                            <p>Data ini diperbarui secara real-time berdasarkan laporan masalah yang masuk.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>  
    );
}
