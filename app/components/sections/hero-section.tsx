import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section className={`flex flex-col-reverse md:flex-row items-center justify-between px-6 md:px-16 py-12 gap-10 bg-gradient-to-br from-[#359d49]/10 to-[#ddc753]/10 ${className || ''}`}>
      <div className="flex-1 flex flex-col items-start gap-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#359d49] mb-2 leading-tight">
          Empowering Students. <br /> Connecting DWU.
        </h1>
        <p className="text-lg md:text-xl text-gray-700 max-w-xl">
          The official platform for Divine Word University&apos;s Student Representative Council. Stay informed, raise your voice, and connect with your SRC.
        </p>
        <div className="flex gap-4 mt-2">
          <Link href="/news">
            <Button variant="primary" size="lg">
              Explore Features
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="secondary" size="lg">
              About SRC
            </Button>
          </Link>
        </div>
      </div>
      <div className="flex-1 flex justify-center">
        <Image
          src="/images/hero image.jpg"
          alt="Students at Divine Word University"
          width={480}
          height={360}
          className="rounded-xl shadow-lg object-cover w-full max-w-md h-auto"
          priority
        />
      </div>
    </section>
  );
} 