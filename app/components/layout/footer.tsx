import Image from 'next/image';
import Link from 'next/link';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={`w-full py-8 px-6 md:px-16 flex flex-col md:flex-row items-center justify-between gap-4 text-white bg-[#359d49] ${className || ''}`}
    >
      <div className="flex items-center gap-2">
        <Image
          src="/images/dwu logo.png"
          alt="DWU Logo"
          width={32}
          height={32}
          className="bg-white rounded"
        />
        <span className="font-semibold">Divine Word University SRC</span>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-4 text-sm">
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
        </div>
        <div>&copy; {new Date().getFullYear()} All rights reserved.</div>
      </div>
    </footer>
  );
} 