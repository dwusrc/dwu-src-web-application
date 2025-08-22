interface AboutMissionSectionProps {
  className?: string;
}

export function AboutMissionSection({ className }: AboutMissionSectionProps) {
  return (
    <section className={`py-16 px-6 md:px-16 bg-[#359d49]/5 ${className || ''}`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#359d49] mb-6">
            Our Mission & Vision
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            The DWU Student Representative Council is committed to creating an inclusive, 
            supportive, and empowering environment for all students.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Mission */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#359d49] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#359d49]">Our Mission</h3>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              To represent and advocate for the interests, rights, and welfare of all students 
              at Divine Word University, ensuring their voices are heard and their needs are met 
              through effective communication with university administration and stakeholders.
            </p>
          </div>

          {/* Vision */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#ddc753] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#2a6b39]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#359d49]">Our Vision</h3>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              To be the leading student representative body that fosters academic excellence, 
              personal development, and community engagement, creating a vibrant and inclusive 
              campus environment where every student can thrive and succeed.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-[#359d49] text-center mb-8">Our Core Values</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Integrity',
                description: 'Maintaining honesty, transparency, and ethical behavior in all our actions.',
                icon: '️',
                color: 'bg-[#359d49]/10 border-[#359d49]/20'
              },
              {
                title: 'Inclusivity',
                description: 'Ensuring all students feel welcome, represented, and valued regardless of background.',
                icon: '🤝',
                color: 'bg-[#ddc753]/10 border-[#ddc753]/20'
              },
              {
                title: 'Innovation',
                description: 'Continuously improving our services and finding creative solutions to student needs.',
                icon: '💡',
                color: 'bg-[#2a6b39]/10 border-[#2a6b39]/20'
              }
            ].map((value, index) => (
              <div key={index} className={`p-6 rounded-xl border-2 ${value.color} text-center bg-white shadow-sm`}>
                <div className="text-4xl mb-4">{value.icon}</div>
                <h4 className="text-xl font-semibold text-[#359d49] mb-3">{value.title}</h4>
                <p className="text-gray-700">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
