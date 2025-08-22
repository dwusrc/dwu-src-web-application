import Link from 'next/link';

interface AboutCTASectionProps {
  className?: string;
}

export function AboutCTASection({ className }: AboutCTASectionProps) {
  return (
    <section className={`py-16 px-6 md:px-16 bg-white ${className || ''}`}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[#359d49] mb-6">
          Ready to Get Involved?
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          The DWU SRC is always looking for passionate students who want to make a difference. 
          Whether you want to join a department, run for leadership, or simply stay informed, 
          we&apos;re here to help you get started.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact">
            <button className="bg-[#359d49] hover:bg-[#2a6b39] text-white font-semibold px-8 py-3 rounded-full transition-colors duration-300 shadow-lg hover:shadow-xl">
              Contact Us
            </button>
          </Link>
          <Link href="/news">
            <button className="border-2 border-[#359d49] text-[#359d49] hover:bg-[#359d49] hover:text-white font-semibold px-8 py-3 rounded-full transition-colors duration-300 shadow-lg hover:shadow-xl">
              Stay Updated
            </button>
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          Have questions? Reach out to us at{' '}
          <a href="mailto:src@student.dwu.ac.pg" className="text-[#359d49] hover:underline">
            src@student.dwu.ac.pg
          </a>
        </div>
      </div>
    </section>
  );
}
