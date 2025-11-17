export default function Loading() {
  // Skeleton loading yang spesifik untuk halaman /dashboard
  // Meniru 4 kartu statistik, 1 grafik, dan 1 ringkasan
  return (
    <div className="p-8 animate-pulse">
      {/* Skeleton untuk Judul "Fleet Monitoring" */}
      <div className="h-8 w-60 bg-gray-300 rounded-lg mb-6"></div>

      {/* Skeleton untuk 4 Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Kartu 1 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="h-5 w-3/4 bg-gray-300 rounded-md mb-4"></div>
          <div className="h-10 w-1/2 bg-gray-300 rounded-md"></div>
        </div>
        {/* Kartu 2 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="h-5 w-3/4 bg-gray-300 rounded-md mb-4"></div>
          <div className="h-10 w-1/2 bg-gray-300 rounded-md"></div>
        </div>
        {/* Kartu 3 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="h-5 w-3/4 bg-gray-300 rounded-md mb-4"></div>
          <div className="h-10 w-1/2 bg-gray-300 rounded-md"></div>
        </div>
        {/* Kartu 4 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="h-5 w-3/4 bg-gray-300 rounded-md mb-4"></div>
          <div className="h-10 w-1/2 bg-gray-300 rounded-md"></div>
        </div>
      </div>

      {/* Skeleton untuk Area Konten Utama (Grafik + Ringkasan) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Skeleton Grafik (Kiri) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <div className="h-6 w-1/3 bg-gray-300 rounded-md mb-4"></div>
          <div className="h-64 w-full bg-gray-300 rounded-md"></div>
        </div>

        {/* Skeleton Ringkasan (Kanan) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <div className="h-6 w-1/2 bg-gray-300 rounded-md mb-4"></div>
          <div className="h-5 w-3/4 bg-gray-300 rounded-md mb-3"></div>
          <div className="h-5 w-3/4 bg-gray-300 rounded-md mb-3"></div>
          <div className="h-5 w-3/4 bg-gray-300 rounded-md mb-3"></div>
          <div className="h-5 w-3/4 bg-gray-300 rounded-md"></div>
        </div>
      </div>
    </div>
  );
}