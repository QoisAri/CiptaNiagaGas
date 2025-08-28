'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { createClient } from '@/utils/supabase/client';
// 1. Impor ikon baru yang akan kita gunakan
import { LayoutGrid, Wrench, History, Siren } from 'lucide-react';

// Import untuk Grafik (Chart.js)
import dynamic from 'next/dynamic';
import { 
    Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), { ssr: false });
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler);

// Komponen Kartu Statistik
const StatCard = ({ title, value, icon: Icon, href }: {title: string, value: number, icon: any, href: string}) => {
    return (
        <Link href={href} className="block bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                        <AnimatedCounter to={value} />
                    </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                    <Icon className="text-blue-600" size={24} />
                </div>
            </div>
        </Link>
    );
};


export default function DashboardPage() {
    const { session, isLoading: isAuthLoading } = useAuth();
    const supabase = createClient();

    // 2. Ubah state untuk menyimpan data statistik yang baru
    const [statsData, setStatsData] = useState({ 
        totalAset: 0,
        perluPerbaikan: 0,
        recordPerbaikan: 0,
        urgentFix: 0
    });
    
    // State lainnya (tidak berubah)
    const [reportSummary, setReportSummary] = useState({ daily: 0, weekly: 0, monthly: 0, yearly: 0 });
    const [chartDataSets, setChartDataSets] = useState<Record<string, number[]>>({ 
        daily: [], weekly: [], monthly: [], yearly: [] 
    });
    const [chartMode, setChartMode] = useState<string>('daily');
    const [isLoadingChart, setIsLoadingChart] = useState(true);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    // 3. Modifikasi fungsi fetchStatsData untuk mengambil data baru
    const fetchStatsData = useCallback(async () => {
        setIsLoadingStats(true);
        try {
            const [
                { count: chassisCount },
                { count: headsCount },
                { count: storagesCount },
                { count: perluPerbaikanCount }, // Data 'Perlu Perbaikan'
                { count: recordPerbaikanCount },// Data 'Record Perbaikan'
                { count: urgentFixCount }      // Data 'Urgent Fix'
            ] = await Promise.all([
                // Query untuk total aset
                supabase.from('chassis').select('*', { count: 'exact', head: true }),
                supabase.from('heads').select('*', { count: 'exact', head: true }),
                supabase.from('storages').select('*', { count: 'exact', head: true }),
                
                // PERUBAHAN DI SINI: Query untuk 'Perlu Perbaikan'
                // Sekarang mengambil data dari view 'pending_repairs_view'.
                supabase.from('pending_repairs_view').select('*', { count: 'exact', head: true }),
                
                // Query untuk total 'Record Perbaikan' (semua baris)
                supabase.from('maintenance_records').select('*', { count: 'exact', head: true }),
                
                // Query untuk 'Urgent Fix'
                // Menghitung SEMUA baris di problem_reports tanpa filter status.
                supabase.from('problem_reports').select('*', { count: 'exact', head: true })
            ]);

            const totalAset = (chassisCount ?? 0) + (headsCount ?? 0) + (storagesCount ?? 0);

            setStatsData({
                totalAset: totalAset,
                perluPerbaikan: perluPerbaikanCount ?? 0,
                recordPerbaikan: recordPerbaikanCount ?? 0,
                urgentFix: urgentFixCount ?? 0,
            });
        } catch (error) {
            console.error("Error fetching stats data:", error);
        } finally {
            setIsLoadingStats(false);
        }
    }, [supabase]);

    // Fungsi fetchChartData (tidak berubah)
    const fetchChartData = useCallback(async () => {
        setIsLoadingChart(true);
        const { data: inspections, error } = await supabase
            .from('inspections')
            .select('tanggal');

        if (error || !inspections) {
            console.error("Error fetching chart data:", error);
            setIsLoadingChart(false);
            return;
        }

        const now = new Date();
        const startOfTodayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeekLocal = new Date(startOfTodayLocal);
        startOfWeekLocal.setDate(startOfWeekLocal.getDate() - startOfTodayLocal.getDay());
        const startOfMonthLocal = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYearLocal = new Date(now.getFullYear(), 0, 1);
        
        const dailyCounts = Array(7).fill(0);
        const weeklyCounts = Array(4).fill(0);
        const monthlyCounts = Array(12).fill(0);
        const yearlyCounts: Record<string, number> = {};
        
        let dailyTotal = 0, weeklyTotal = 0, monthlyTotal = 0, yearlyTotal = 0;

        inspections.forEach(inspection => {
            const reportDate = new Date(inspection.tanggal);
            if (reportDate >= startOfYearLocal) yearlyTotal++;
            if (reportDate.getFullYear() >= now.getFullYear() - 2) {
                const yearKey = reportDate.getFullYear().toString();
                yearlyCounts[yearKey] = (yearlyCounts[yearKey] || 0) + 1;
            }
            if (reportDate >= startOfMonthLocal) monthlyTotal++;
            if (reportDate.getFullYear() === now.getFullYear()) {
                monthlyCounts[reportDate.getMonth()]++;
            }
            if (reportDate >= startOfWeekLocal) {
                weeklyTotal++;
                dailyCounts[reportDate.getDay()]++;
            }
            if(reportDate.getFullYear() === now.getFullYear() && reportDate.getMonth() === now.getMonth()){
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
                const weekOfMonth = Math.floor((reportDate.getDate() + firstDayOfMonth - 1) / 7);
                if (weekOfMonth >= 0 && weekOfMonth < 4) {
                    weeklyCounts[weekOfMonth]++;
                }
            }
            if (reportDate >= startOfTodayLocal && reportDate < new Date(startOfTodayLocal.getTime() + 24 * 60 * 60 * 1000)) {
                dailyTotal++;
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
        fetchStatsData();
        fetchChartData();

        const channel = supabase
            .channel('realtime-dashboard-all')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inspections' }, fetchChartData)
            // Listener ini akan memicu fetchStatsData, yang kemudian akan query ke view
            .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_records' }, fetchStatsData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'problem_reports' }, fetchStatsData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chassis' }, fetchStatsData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'heads' }, fetchStatsData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'storages' }, fetchStatsData)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, fetchChartData, fetchStatsData]);

    // Definisikan kartu-kartu yang akan ditampilkan
    const stats = [
        { title: 'Total Aset Aktif', value: statsData.totalAset, icon: LayoutGrid, href: '/aset/head' },
        { title: 'Perlu Perbaikan', value: statsData.perluPerbaikan, icon: Wrench, href: '/perlu-perbaikan' },
        { title: 'Record Perbaikan', value: statsData.recordPerbaikan, icon: History, href: '/maintenance' },
        { title: 'Urgent Fix', value: statsData.urgentFix, icon: Siren, href: '/urgent' }
    ];

    // Sisa kode UI (tidak berubah)
    const chartLabels: Record<string, string[]> = {
        daily: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
        weekly: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
        monthly: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        yearly: [(new Date().getFullYear() - 2).toString(), (new Date().getFullYear() - 1).toString(), new Date().getFullYear().toString()]
    };
    const chartData = {
        labels: chartLabels[chartMode],
        datasets: [{
            label: 'Laporan Masuk',
            data: chartDataSets[chartMode],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#fff',
            pointHoverRadius: 7,
            pointHoverBorderWidth: 2,
        }]
    };
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, title: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: '#e5e7eb' } } }
    };
    
    if (isAuthLoading || !session) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Memuat Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Fleet Monitoring</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                {isLoadingStats ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm h-[108px] animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                        </div>
                    ))
                ) : (
                    stats.map(stat => <StatCard key={stat.title} {...stat} />)
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700 text-lg">Laporan Masuk</h3>
                        <select 
                            value={chartMode} 
                            onChange={(e) => setChartMode(e.target.value)} 
                            className="border rounded-md px-3 py-1 text-sm bg-gray-50 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="daily">Harian</option>
                            <option value="weekly">Mingguan</option>
                            <option value="monthly">Bulanan</option>
                            <option value="yearly">Tahunan</option>
                        </select>
                    </div>
                    <div className="h-80 relative">
                        {isLoadingChart ? (
                           <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
                             <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-blue-600"></div>
                           </div>
                        ) : (
                            <Line options={chartOptions as any} data={chartData} />
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <h3 className="font-bold text-gray-700 text-lg mb-4">Ringkasan Laporan</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Laporan Hari Ini</span>
                                <span className="font-bold text-gray-800"><AnimatedCounter to={reportSummary.daily} /></span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Laporan Minggu Ini</span>
                                <span className="font-bold text-gray-800"><AnimatedCounter to={reportSummary.weekly} /></span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Laporan Bulan Ini</span>
                                <span className="font-bold text-gray-800"><AnimatedCounter to={reportSummary.monthly} /></span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-gray-500">Laporan Tahun Ini</span>
                                <span className="font-bold text-gray-800"><AnimatedCounter to={reportSummary.yearly} /></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
