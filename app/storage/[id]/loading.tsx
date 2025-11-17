export default function Loading() {
  // Skeleton loading yang spesifik untuk halaman detail
  // Meniru Judul, Info Box, Tombol, dan Tabel Detail
  // (Sama seperti skeleton detail Casis)
  return (
    <div className="p-8 animate-pulse">
      {/* Skeleton untuk Judul "Detail Pemeriksaan Storage..." */}
      <div className="h-8 w-3/4 bg-gray-300 rounded-lg mb-6"></div>

      {/* Skeleton untuk Info Box (Informasi Pemeriksaan) */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-start">
          {/* Judul Info Box */}
          <div className="h-6 w-1/3 bg-gray-300 rounded-md mb-4"></div>
          {/* Tombol Unduh & Hapus */}
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-gray-300 rounded-md"></div>
            <div className="h-10 w-32 bg-gray-300 rounded-md"></div>
          </div>
        </div>
        {/* Detail Info (Nama, Nomor, dll) */}
        <div className="space-y-3 mt-4">
          <div className="h-5 w-1/2 bg-gray-300 rounded-md"></div>
          <div className="h-5 w-1/2 bg-gray-300 rounded-md"></div>
          <div className="h-5 w-1/2 bg-gray-300 rounded-md"></div>
          <div className="h-5 w-1/2 bg-gray-300 rounded-md"></div>
        </div>
      </div>

      {/* Skeleton untuk Judul Bagian (mis. "Sistem Pendingin") */}
      <div className="h-7 w-1/3 bg-gray-300 rounded-lg mb-4"></div>

      {/* Skeleton untuk Tabel Detail (ulangi 3x) */}
      
      {/* Tabel 1 */}
      <div className="w-full bg-white rounded-lg shadow-md mb-6">
        {/* Judul Tabel (Chamber, Coupler, dll) */}
        <div className="p-4 border-b">
          <div className="h-6 w-1/4 bg-gray-300 rounded-md"></div>
        </div>
        {/* Header Tabel */}
        <div className="p-4 border-b">
          <div className="h-5 w-full bg-gray-300 rounded-md"></div>
        </div>
        {/* Baris Data Tabel */}
        <div className="p-4">
          <div className="h-6 w-full bg-gray-300 rounded-md"></div>
        </div>
      </div>

      {/* Tabel 2 */}
      <div className="w-full bg-white rounded-lg shadow-md mb-6">
        {/* Judul Tabel */}
        <div className="p-4 border-b">
          <div className="h-6 w-1/4 bg-gray-300 rounded-md"></div>
        </div>
        {/* Header Tabel */}
        <div className="p-4 border-b">
          <div className="h-5 w-full bg-gray-300 rounded-md"></div>
        </div>
        {/* Baris Data Tabel */}
        <div className="p-4">
          <div className="h-6 w-full bg-gray-300 rounded-md"></div>
        </div>
      </div>

      {/* Tabel 3 */}
      <div className="w-full bg-white rounded-lg shadow-md mb-6">
        {/* Judul Tabel */}
        <div className="p-4 border-b">
          <div className="h-6 w-1/4 bg-gray-300 rounded-md"></div>
        </div>
        {/* Header Tabel */}
        <div className="p-4 border-b">
          <div className="h-5 w-full bg-gray-300 rounded-md"></div>
        </div>
        {/* Baris Data Tabel */}
        <div className="p-4">
          <div className="h-6 w-full bg-gray-300 rounded-md"></div>
        </div>
      </div>

    </div>
  );
}