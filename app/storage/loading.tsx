export default function Loading() {
  // Skeleton loading yang spesifik untuk halaman /dashboard/checklist-storage
  // Meniru Judul, Filter, Tombol Hapus, dan Tabel
  return (
    <div className="p-8 animate-pulse">
      {/* Skeleton untuk Judul "Daftar Seluruh Storage" */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-60 bg-gray-300 rounded-lg"></div>
        {/* Skeleton untuk tombol "Unduh Laporan" */}
        <div className="h-10 w-36 bg-gray-300 rounded-md"></div>
      </div>

      {/* Skeleton untuk Area Filter */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Filter 1 (Input) */}
          <div className="h-10 bg-gray-300 rounded-md"></div>
          {/* Filter 2 (Dropdown) */}
          <div className="h-10 bg-gray-300 rounded-md"></div>
          {/* Filter 3 (Input) */}
          <div className="h-10 bg-gray-300 rounded-md"></div>
          {/* Tombol Cari */}
          <div className="h-10 bg-gray-300 rounded-md"></div>
          {/* Tombol Clear */}
          <div className="h-10 bg-gray-300 rounded-md"></div>
        </div>
      </div>

      {/* Skeleton untuk Tombol Hapus Data */}
      <div className="flex justify-end mb-4">
        <div className="h-10 w-40 bg-gray-300 rounded-md"></div>
      </div>

      {/* Skeleton untuk Tabel */}
      <div className="w-full bg-white rounded-lg shadow-md">
        {/* Header Tabel */}
        <div className="flex justify-between p-4 border-b">
          <div className="h-5 w-1/12 bg-gray-300 rounded-md"></div>
          <div className="h-5 w-2/12 bg-gray-300 rounded-md"></div>
          <div className="h-5 w-2/12 bg-gray-300 rounded-md"></div>
          <div className="h-5 w-3/12 bg-gray-300 rounded-md"></div>
          <div className="h-5 w-2/12 bg-gray-300 rounded-md"></div>
        </div>
        
        {/* Baris Tabel (ulangi beberapa kali) */}
        <div className="p-4 border-b">
          <div className="h-6 w-full bg-gray-300 rounded-md"></div>
        </div>
        <div className="p-4 border-b">
          <div className="h-6 w-full bg-gray-300 rounded-md"></div>
        </div>
        <div className="p-4 border-b">
          <div className="h-6 w-full bg-gray-300 rounded-md"></div>
        </div>
        <div className="p-4 border-b">
          <div className="h-6 w-full bg-gray-300 rounded-md"></div>
        </div>
        <div className="p-4">
          <div className="h-6 w-full bg-gray-300 rounded-md"></div>
        </div>
      </div>
    </div>
  );
}