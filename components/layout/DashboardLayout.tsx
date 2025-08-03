'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../app/context/AuthContext';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { session, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Daftar Casis', path: '/casis' },
    { name: 'Daftar Storage', path: '/storage' },
    { name: 'Daftar Head', path: '/head' },
    { name: 'Record Maintenance', path: '/maintenance' },
    { name: 'History Pencucian', path: '/washing' },
    { name: 'Urgent Fix', path: '/urgent' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-white shadow-lg flex-shrink-0 flex flex-col hide-on-print">
        <div className="px-6 py-4 font-bold text-xl border-b border-gray-200 text-slate-800">
          Admin Panel
        </div>
        
        <div className="flex flex-col justify-between flex-grow">
          <nav className="flex flex-col p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`block px-4 py-2 my-1 rounded-md transition-all duration-200 ${
                  // Logika untuk highlight menu yang aktif, termasuk halaman detail
                  pathname === item.path || (pathname.startsWith(item.path) && item.path !== '/')
                    ? 'bg-blue-600 text-white font-semibold shadow-md'
                    : 'text-slate-600 hover:bg-blue-100'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200">
            {session ? (
               <button
                onClick={logout}
                className="w-full text-left px-4 py-2 rounded-md transition text-slate-600 hover:bg-red-100 hover:text-red-700 font-semibold"
              >
                Logout
              </button>
            ) : (
               <Link
                href="/login"
                className="block text-center bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-md transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}