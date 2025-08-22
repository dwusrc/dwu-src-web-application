import Image from 'next/image';

interface AboutHeroSectionProps {
  className?: string;
}

export function AboutHeroSection({ className }: AboutHeroSectionProps) {
  return (
    <section className={`relative overflow-hidden ${className || ''}`}>
      {/* Hero Image Background */}
      <div className="relative h-[60vh] min-h-[500px] w-full">
        <Image
          src="/images/about-heroimage.jpg"
          alt="DWU SRC - Student Representative Council"
          fill
          className="object-cover"
          priority
        />
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-6 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              About DWU SRC
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
              Empowering Students, Building Community, and Fostering Leadership at Divine Word University
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="bg-[#359d49]/90 hover:bg-[#359d49] text-white px-6 py-3 rounded-full font-semibold transition-colors">
                Student-Centered
              </div>
              <div className="bg-[#ddc753]/90 hover:bg-[#ddc753] text-[#2a6b39] px-6 py-3 rounded-full font-semibold transition-colors">
                Community-Driven
              </div>
              <div className="bg-[#2a6b39]/90 hover:bg-[#2a6b39] text-white px-6 py-3 rounded-full font-semibold transition-colors">
                Leadership-Focused
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
