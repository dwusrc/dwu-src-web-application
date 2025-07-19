import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
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
      <Link href="/auth/login">
        <Button variant="secondary" size="md">
          Login
        </Button>
      </Link>
    </header>
  );
} 