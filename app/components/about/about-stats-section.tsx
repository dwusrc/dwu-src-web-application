interface AboutStatsSectionProps {
  className?: string;
}

export function AboutStatsSection({ className }: AboutStatsSectionProps) {
  const stats = [
    {
      number: '5000+',
      label: 'Students Represented',
      description: 'Across all academic programs'
    },
    {
      number: '7',
      label: 'SRC Departments',
      description: 'Specialized student services'
    },
    {
      number: '100%',
      label: 'Student-Led',
      description: 'By students, for students'
    },
    {
      number: '24/7',
      label: 'Support Available',
      description: 'Continuous student assistance'
    }
  ];

  return (
    <section className={`py-16 px-6 md:px-16 bg-gradient-to-br from-[#359d49] to-[#2a6b39] ${className || ''}`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            SRC by the Numbers
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Our impact in numbers - representing and serving the DWU student community.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-lg font-semibold text-white mb-2">
                  {stat.label}
                </div>
                <div className="text-sm text-white/80">
                  {stat.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
