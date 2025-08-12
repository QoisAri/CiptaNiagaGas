'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useState } from 'react'; // Impor useState

// Komponen untuk ikon panah (dropdown arrow)
const ArrowIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
  </svg>
);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  // State untuk melacak sub-menu yang sedang aktif/terbuka
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(() => {
    // Logika agar sub-menu tetap terbuka jika URL aktif
    if (pathname.startsWith('/aset')) return 'Aset Aktif';
    return null;
  });

  // Struktur navLinks diubah untuk mendukung sub-menu
  const navLinks = [
    { href: '/dashboard', name: 'Dashboard' },
    { href: '/casis', name: 'Cheklist Casis' },
    { href: '/storage', name: 'Cheklist Storage' },
    { href: '/head', name: 'Cheklist Head' },
    { href: '/maintenance', name: 'Record Maintenance' },
    { href: '/history', name: 'History Pencucian' },
    { href: '/urgent', name: 'Urgent Fix' },
    // Menu baru dengan sub-links
    {
      name: 'Aset Aktif',
      subLinks: [
        { href: '/aset/head', name: 'Daftar Head' },
        { href: '/aset/casis', name: 'Daftar Casis' },
        { href: '/aset/storage', name: 'Daftar Storage' },
      ],
    },
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (!error) {
      router.push('/login');
    } else {
      console.error('Error logging out:', error);
    }
  };

  // Fungsi untuk toggle sub-menu
  const toggleSubMenu = (name: string) => {
    setOpenSubMenu(openSubMenu === name ? null : name);
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white shadow-md p-4 flex flex-col justify-between">
      <div>
        <div className="h-16 flex items-center">
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
        </div>
        <nav className="flex flex-col space-y-2 mt-4">
          {navLinks.map((link) => {
            // Cek apakah item ini memiliki sub-menu
            if (link.subLinks) {
              const isParentActive = link.subLinks.some(sub => pathname.startsWith(sub.href));
              return (
                <div key={link.name}>
                  <button
                    onClick={() => toggleSubMenu(link.name)}
                    className={`w-full flex justify-between items-center px-4 py-3 rounded-lg text-base ${
                      isParentActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{link.name}</span>
                    <ArrowIcon isOpen={openSubMenu === link.name} />
                  </button>
                  {/* Tampilkan sub-menu jika terbuka */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openSubMenu === link.name ? 'max-h-40 mt-2' : 'max-h-0'
                    }`}
                  >
                    <div className="flex flex-col space-y-2 pl-4 border-l-2 ml-4 border-gray-200">
                      {link.subLinks.map((subLink) => (
                        <Link
                          key={subLink.name}
                          href={subLink.href}
                          className={`px-4 py-2 rounded-md text-sm ${
                            pathname === subLink.href
                              ? 'bg-blue-100 text-blue-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {subLink.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            // Render link biasa jika tidak ada sub-menu
            return (
              <Link
                key={link.name}
                href={link.href!} // Tanda seru (!) karena kita tahu href pasti ada di sini
                className={`px-4 py-3 rounded-lg text-base ${
                  pathname === link.href
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t mt-4">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}