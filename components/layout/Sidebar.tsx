'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import { 
    LayoutDashboard, ChevronRight, HardHat, Wrench, CircleDot, 
    Truck, Container, Car, Package, FileClock, ShieldAlert, Waves 
} from 'lucide-react';

// Komponen ikon panah
const ArrowIcon = ({ isOpen }: { isOpen: boolean }) => (
  <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith('/aset')) {
      setOpenSubMenu('Aset Aktif');
    }
  }, [pathname]);

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Cheklist Casis', href: '/casis', icon: Truck },
    { name: 'Cheklist Storage', href: '/storage', icon: Container },
    { name: 'Cheklist Head', href: '/head', icon: Car },
    { name: 'Record Perbaikan', href: '/record-maintenance', icon: HardHat },
    { name: 'Perlu Perbaikan', href: '/perlu-perbaikan', icon: Wrench },
    { name: 'History Pencucian', href: '/history-pencucian', icon: Waves },
    { name: 'Urgent Fix', href: '/urgent-fix', icon: ShieldAlert },
    {
      name: 'Aset Aktif',
      icon: Package,
      subLinks: [
        { name: 'Daftar Head', href: '/aset/head', icon: CircleDot },
        { name: 'Daftar Casis', href: '/aset/casis', icon: CircleDot },
        { name: 'Daftar Storage', href: '/aset/storage', icon: CircleDot },
      ],
    },
  ];

  // ==========================================================
  // ## FUNGSI LOGOUT YANG SUDAH LENGKAP ##
  // ==========================================================
  const handleLogout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error logging out:', error);
    } else {
      // Arahkan ke halaman login setelah berhasil logout
      router.push('/login');
    }
  };

  const toggleSubMenu = (name: string) => {
    setOpenSubMenu(openSubMenu === name ? null : name);
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 text-gray-300 p-4 flex flex-col justify-between h-screen">
      <div>
        <div className="h-16 flex items-center px-4 mb-6">
          <FileClock className="text-blue-400 mr-3" size={32} />
          <h1 className="text-xl font-bold text-white">CNG Panel</h1>
        </div>
        <nav className="flex flex-col space-y-1">
          {navLinks.map((link) => {
            if (link.subLinks) {
              const isParentActive = link.subLinks.some(sub => pathname === sub.href);
              return (
                <div key={link.name}>
                  <button
                    onClick={() => toggleSubMenu(link.name)}
                    className={`w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-left transition-colors duration-200 ${
                      isParentActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <link.icon className="mr-3 flex-shrink-0" size={18} />
                      <span>{link.name}</span>
                    </div>
                    <ArrowIcon isOpen={openSubMenu === link.name} />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openSubMenu === link.name ? 'max-h-40 mt-1' : 'max-h-0'
                    }`}
                  >
                    <div className="flex flex-col space-y-1 pt-1 pl-8 border-l-2 ml-6 border-gray-700">
                      {link.subLinks.map((subLink) => (
                        <Link
                          key={subLink.name}
                          href={subLink.href}
                          className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors duration-200 ${
                            pathname === subLink.href
                              ? 'bg-gray-700 text-white font-semibold'
                              : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                           <subLink.icon className="mr-3 flex-shrink-0" size={8} />
                           {subLink.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={link.name}
                href={link.href!}
                className={`flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ${
                  pathname === link.href
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 hover:text-white'
                }`}
              >
                <link.icon className="mr-3 flex-shrink-0" size={18} />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-700 mt-4">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}