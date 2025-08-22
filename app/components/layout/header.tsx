'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, useIsAuthenticated } from '@/app/contexts/session-context';
import { useState, useEffect, useRef } from 'react';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { user, profile, signOut } = useSession();
  const { isAuthenticated } = useIsAuthenticated();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAboutMenu, setShowAboutMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileAboutMenu, setShowMobileAboutMenu] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const aboutMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (aboutMenuRef.current && !aboutMenuRef.current.contains(event.target as Node)) {
        setShowAboutMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
        setShowMobileAboutMenu(false);
      }
    };

    if (showUserMenu || showAboutMenu || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showAboutMenu, showMobileMenu]);

  // Close menu when pressing Escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setShowAboutMenu(false);
        setShowMobileMenu(false);
        setShowMobileAboutMenu(false);
      }
    };

    if (showUserMenu || showAboutMenu || showMobileMenu) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showUserMenu, showAboutMenu, showMobileMenu]);

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple clicks
    
    setIsSigningOut(true);
    setShowUserMenu(false);
    setShowMobileMenu(false);
    setShowMobileAboutMenu(false);
    
    try {
      const result = await signOut(true); // Use API route for logout
      
      if (result.success) {
        // Use Next.js router for navigation instead of window.location
        router.push('/');
        router.refresh(); // Force a refresh of the page data
      } else {
        console.error('Sign out failed:', result.error);
        // Even if sign out fails, redirect to home page
        router.push('/');
      }
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if sign out fails, redirect to home page
      router.push('/');
    } finally {
      setIsSigningOut(false);
    }
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
    setShowAboutMenu(false);
    setShowMobileAboutMenu(false);
  };

  const toggleMobileAboutMenu = () => {
    setShowMobileAboutMenu(!showMobileAboutMenu);
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
      
      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-6 text-base font-medium">
        {/* About Dropdown */}
        <div className="relative" ref={aboutMenuRef}>
          <button
            onClick={() => setShowAboutMenu(!showAboutMenu)}
            onMouseEnter={() => setShowAboutMenu(true)}
            className="flex items-center gap-1 hover:underline underline-offset-4 transition-all duration-200"
          >
            About
            <svg
              className={`w-4 h-4 transition-transform ${showAboutMenu ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAboutMenu && (
            <div 
              className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50 border border-gray-200"
              onMouseLeave={() => setShowAboutMenu(false)}
            >
              <Link
                href="/about"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:underline underline-offset-2 transition-all duration-200"
                onClick={() => setShowAboutMenu(false)}
              >
                Overview
              </Link>
              <Link
                href="/about/departments"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:underline underline-offset-2 transition-all duration-200"
                onClick={() => setShowAboutMenu(false)}
              >
                Departments
              </Link>
              <Link
                href="/about/leadership"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:underline underline-offset-2 transition-all duration-200"
                onClick={() => setShowAboutMenu(false)}
              >
                Leadership
              </Link>
              <Link
                href="/about/events"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:underline underline-offset-2 transition-all duration-200"
                onClick={() => setShowAboutMenu(false)}
              >
                Events
              </Link>
            </div>
          )}
        </div>

        <Link href="/news" className="hover:underline underline-offset-4 transition-all duration-200">
          News & Updates
        </Link>
        <Link href="/contact" className="hover:underline underline-offset-4 transition-all duration-200">
          Contact
        </Link>
      </nav>

      {/* Desktop User Menu */}
      <div className="hidden md:flex items-center gap-4">
        {isAuthenticated ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 bg-white text-[#359d49] font-semibold px-4 py-2 rounded-full shadow hover:bg-[#ddc753] hover:text-[#2a6b39] transition-colors"
              disabled={isSigningOut}
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
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:underline underline-offset-2 transition-all duration-200"
                  onClick={() => setShowUserMenu(false)}
                >
                  Dashboard
                </Link>
                
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:underline underline-offset-2 transition-all duration-200"
                  onClick={() => setShowUserMenu(false)}
                >
                  Profile
                </Link>

                {profile?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:underline underline-offset-2 transition-all duration-200"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Admin Panel
                  </Link>
                )}

                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className={`block w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors ${
                    isSigningOut 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-red-600 hover:bg-gray-100'
                  }`}
                >
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
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

      {/* Mobile Hamburger Menu Button */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="md:hidden flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Toggle mobile menu"
      >
        <svg
          className={`w-6 h-6 transition-transform ${showMobileMenu ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {showMobileMenu ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeMobileMenu} />
      )}

      {/* Mobile Menu Content */}
      <div
        ref={mobileMenuRef}
        className={`md:hidden fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          showMobileMenu ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#359d49]">Menu</h2>
            <button
              onClick={closeMobileMenu}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <nav className="flex-1 p-6 space-y-4">
            {/* About Section with Toggle */}
            <div>
              <button
                onClick={toggleMobileAboutMenu}
                className="flex items-center justify-between w-full text-lg font-semibold text-[#359d49] mb-3 hover:text-[#2a6b39] transition-colors group"
              >
                <span>About</span>
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${showMobileAboutMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className={`space-y-2 ml-4 transition-all duration-200 overflow-hidden ${
                showMobileAboutMenu ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <Link
                  href="/about"
                  className="block text-gray-700 hover:text-[#359d49] hover:underline underline-offset-2 transition-all duration-200"
                  onClick={closeMobileMenu}
                >
                  Overview
                </Link>
                <Link
                  href="/about/departments"
                  className="block text-gray-700 hover:text-[#359d49] hover:underline underline-offset-2 transition-all duration-200"
                  onClick={closeMobileMenu}
                >
                  Departments
                </Link>
                <Link
                  href="/about/leadership"
                  className="block text-gray-700 hover:text-[#359d49] hover:underline underline-offset-2 transition-all duration-200"
                  onClick={closeMobileMenu}
                >
                  Leadership
                </Link>
                <Link
                  href="/about/events"
                  className="block text-gray-700 hover:text-[#359d49] hover:underline underline-offset-2 transition-all duration-200"
                  onClick={closeMobileMenu}
                >
                  Events
                </Link>
              </div>
            </div>

            {/* Other Navigation Links */}
            <div className="space-y-2">
              <Link
                href="/news"
                className="block text-lg font-semibold text-[#359d49] hover:text-[#2a6b39] hover:underline underline-offset-2 transition-all duration-200"
                onClick={closeMobileMenu}
              >
                News & Updates
              </Link>
              <Link
                href="/contact"
                className="block text-lg font-semibold text-[#359d49] hover:text-[#2a6b39] hover:underline underline-offset-2 transition-all duration-200"
                onClick={closeMobileMenu}
              >
                Contact
              </Link>
            </div>
          </nav>

          {/* Mobile User Section */}
          <div className="p-6 border-t border-gray-200">
            {isAuthenticated ? (
              <div className="space-y-4">
                {/* User Info */}
                <div className="text-center">
                  <div className="font-medium text-gray-900">{profile?.full_name}</div>
                  <div className="text-sm text-gray-500 capitalize">{profile?.role}</div>
                  {profile?.department && (
                    <div className="text-sm text-gray-500">{profile.department}</div>
                  )}
                </div>

                {/* User Actions */}
                <div className="space-y-2">
                  <Link
                    href="/dashboard"
                    className="block w-full text-center bg-[#359d49] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#2a6b39] transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>
                  
                  <Link
                    href="/profile"
                    className="block w-full text-center border border-[#359d49] text-[#359d49] font-semibold py-2 px-4 rounded-lg hover:bg-[#359d49] hover:text-white transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Profile
                  </Link>

                  {profile?.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="block w-full text-center border border-[#ddc753] text-[#ddc753] font-semibold py-2 px-4 rounded-lg hover:bg-[#ddc753] hover:text-white transition-colors"
                      onClick={closeMobileMenu}
                    >
                      Admin Panel
                    </Link>
                  )}

                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className={`block w-full text-center border border-red-500 text-red-500 font-semibold py-2 px-4 rounded-lg transition-colors ${
                      isSigningOut 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    {isSigningOut ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full text-center bg-[#359d49] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#2a6b39] transition-colors"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="block w-full text-center border border-[#359d49] text-[#359d49] font-semibold py-3 px-4 rounded-lg hover:bg-[#359d49] hover:text-white transition-colors"
                  onClick={closeMobileMenu}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}