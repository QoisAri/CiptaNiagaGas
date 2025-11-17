export default function Loading() {
  return (
    <div className="p-8 animate-pulse">
      {/* Skeleton untuk Judul & Tombol Tambah */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-60 bg-gray-300 rounded-lg"></div>
        <div className="h-10 w-36 bg-gray-300 rounded-md"></div>
      </div>

      {/* Skeleton untuk Tabel */}
      <div className="w-full bg-white rounded-lg shadow-md">
        {/* Header Tabel */}
        <div className="flex justify-between p-4 border-b">
          <div className="h-5 w-3/12 bg-gray-300 rounded-md"></div>
          <div className="h-5 w-3/12 bg-gray-300 rounded-md"></div>
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