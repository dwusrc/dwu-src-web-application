'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSession, useIsAuthenticated } from '@/app/contexts/session-context';
import { useState } from 'react';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { user, profile, signOut } = useSession();
  const { isAuthenticated } = useIsAuthenticated();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <header
      className={`w-full flex items-center justify-between px-6 py-4 shadow-md text-white bg-[#359d49] ${className || ''}`}
    >
      <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
        <Image
          src="/images/dwu logo.png"
          alt="Divine Word University Logo"
          width={48}
          height={48}
          className="rounded bg-white p-1"
          priority
        />
        <span className="text-2xl font-bold tracking-tight">DWU SRC</span>
      </Link>
      
      <nav className="hidden md:flex gap-6 text-base font-medium">
        <Link href="/news" className="hover:underline underline-offset-4">
          News
        </Link>
        <Link href="/complaints" className="hover:underline underline-offset-4">
          Complaints
        </Link>
        <Link href="/forum" className="hover:underline underline-offset-4">
          Forum
        </Link>
        <Link href="/chat" className="hover:underline underline-offset-4">
          Chat
        </Link>
        <Link href="/reports" className="hover:underline underline-offset-4">
          Reports
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 bg-white text-[#359d49] font-semibold px-4 py-2 rounded-full shadow hover:bg-[#ddc753] hover:text-[#2a6b39] transition-colors"
            >
              <span className="hidden sm:inline">
                {profile?.full_name || user?.email?.split('@')[0]}
              </span>
              <span className="sm:hidden">Menu</span>
              <svg
                className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                  <div className="font-medium">{profile?.full_name}</div>
                  <div className="text-gray-500 capitalize">{profile?.role}</div>
                  {profile?.department && (
                    <div className="text-gray-500">{profile.department}</div>
                  )}
                </div>
                
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  Dashboard
                </Link>
                
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  Profile
                </Link>

                {profile?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Admin Panel
                  </Link>
                )}

                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login">
            <button className="rounded-full border border-[#359d49] bg-white text-[#359d49] font-semibold px-5 py-2 shadow hover:bg-[#ddc753] hover:text-[#2a6b39] transition-colors">
              Login
            </button>
          </Link>
        )}
      </div>
    </header>
  );
} 