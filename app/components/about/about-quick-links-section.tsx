import Link from 'next/link';

interface AboutQuickLinksSectionProps {
  className?: string;
}

export function AboutQuickLinksSection({ className }: AboutQuickLinksSectionProps) {
  const quickLinks = [
    {
      title: 'Our Departments',
      description: 'Explore the specialized SRC departments and their services',
      href: '/about/departments',
      icon: '🏢',
      color: 'from-[#359d49] to-[#2a6b39]'
    },
    {
      title: 'Leadership Team',
      description: 'Meet the dedicated students leading the SRC',
      href: '/about/leadership',
      icon: '👥',
      color: 'from-[#ddc753] to-[#359d49]'
    },
    {
      title: 'Get Involved',
      description: 'Learn how you can contribute to student representation',
      href: '/contact',
      icon: '🚀',
      color: 'from-[#2a6b39] to-[#359d49]'
    }
  ];

  return (
    <section className={`py-16 px-6 md:px-16 bg-gray-50 ${className || ''}`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#359d49] mb-4">
            Explore More About SRC
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the different aspects of our student representative council and find ways to get involved.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {quickLinks.map((link, index) => (
            <Link 
              key={index} 
              href={link.href}
              className="group block"
            >
              <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                <div className={`w-16 h-16 bg-gradient-to-br ${link.color} rounded-full flex items-center justify-center text-2xl mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  {link.icon}
                </div>
                <h3 className="text-xl font-bold text-[#359d49] mb-3 text-center group-hover:text-[#2a6b39] transition-colors">
                  {link.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {link.description}
                </p>
                <div className="mt-6 text-center">
                  <span className="text-[#359d49] font-semibold group-hover:text-[#2a6b39] transition-colors">
                    Learn More →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
