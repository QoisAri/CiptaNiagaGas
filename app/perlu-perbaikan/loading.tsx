export default function Loading() {
  return (
    <div className="p-8 animate-pulse">
      {/* Skeleton untuk Judul & Tombol Unduh */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-60 bg-gray-300 rounded-lg"></div>
        <div className="h-10 w-36 bg-gray-300 rounded-md"></div>
      </div>

      {/* Skeleton untuk Area Filter */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex gap-4">
          <div className="h-10 w-1/3 bg-gray-300 rounded-md"></div>
          <div className="h-10 w-1/3 bg-gray-300 rounded-md"></div>
        </div>
      </div>

      {/* Skeleton untuk Paginasi */}
      <div className="flex justify-between items-center mb-4">
        <div className="h-9 w-28 bg-gray-300 rounded-md"></div>
        <div className="h-5 w-32 bg-gray-300 rounded-md"></div>
        <div className="h-9 w-28 bg-gray-300 rounded-md"></div>
      </div>

      {/* Skeleton untuk Tabel */}
      <div className="w-full bg-white rounded-lg shadow-md overflow-x-auto">
        {/* Header Tabel (8 kolom) */}
        <div className="p-4 border-b">
          <div className="h-5 w-full bg-gray-300 rounded-md"></div>
        </div>
        
        {/* Baris Tabel (ulangi) */}
        <div className="p-4 border-b">
          <div className="h-6 w-full bg-gray-300 rounded-md"></div>
        </div>
        <div className="p-4 border-b">
          <div className="h-6 w-full bg-gray-300 rounded-md"></div>
        </div>
        <div className="p-4 border-b">
          <div className="h-6 w-full bg-gray-300 rounded-md"></div>
        </div>
      </div>
    </div>
  );
}