import { PageLayout } from '../../components';
import Link from 'next/link';

export default function LeadershipPage() {
  const leadership = [
    {
      name: 'John Doe',
      position: 'SRC President',
      department: 'Executive',
      bio: 'Leading the student body with vision and dedication to creating positive change across campus.',
      email: 'president@student.dwu.ac.pg',
      image: '/images/placeholder-avatar.jpg',
      responsibilities: [
        'Overall SRC leadership and coordination',
        'University administration liaison',
        'Strategic planning and vision setting',
        'Student advocacy at the highest level'
      ]
    },
    {
      name: 'Jane Smith',
      position: 'Vice President',
      department: 'Executive',
      bio: 'Supporting the president and overseeing daily operations of the student representative council.',
      email: 'vicepresident@student.dwu.ac.pg',
      image: '/images/placeholder-avatar.jpg',
      responsibilities: [
        'Assist president in daily operations',
        'Coordinate between departments',
        'Oversee project implementation',
        'Student grievance resolution'
      ]
    },
    {
      name: 'Mike Johnson',
      position: 'Secretary General',
      department: 'Administration',
      bio: 'Ensuring proper documentation and communication across all SRC activities and meetings.',
      email: 'secretary@student.dwu.ac.pg',
      image: '/images/placeholder-avatar.jpg',
      responsibilities: [
        'Meeting documentation and minutes',
        'Official correspondence management',
        'Record keeping and archives',
        'Communication coordination'
      ]
    },
    {
      name: 'Sarah Wilson',
      position: 'Treasurer',
      department: 'Finance & Budget',
      bio: 'Managing SRC finances with transparency and accountability to ensure proper resource allocation.',
      email: 'treasurer@student.dwu.ac.pg',
      image: '/images/placeholder-avatar.jpg',
      responsibilities: [
        'Financial planning and budgeting',
        'Expense tracking and reporting',
        'Financial transparency initiatives',
        'Resource allocation oversight'
      ]
    },
    {
      name: 'David Brown',
      position: 'Academic Affairs Director',
      department: 'Academic Affairs',
      bio: 'Advocating for student academic interests and fostering positive student-faculty relationships.',
      email: 'academic@student.dwu.ac.pg',
      image: '/images/placeholder-avatar.jpg',
      responsibilities: [
        'Academic policy advocacy',
        'Curriculum feedback coordination',
        'Student-faculty mediation',
        'Academic standards improvement'
      ]
    },
    {
      name: 'Lisa Garcia',
      position: 'Student Welfare Director',
      department: 'Student Welfare',
      bio: 'Dedicated to improving student life, health services, and overall campus well-being.',
      email: 'welfare@student.dwu.ac.pg',
      image: '/images/placeholder-avatar.jpg',
      responsibilities: [
        'Student health and wellness advocacy',
        'Campus life improvement initiatives',
        'Counseling service coordination',
        'Student support program development'
      ]
    }
  ];

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#359d49] to-[#2a6b39] py-16 px-6 md:px-16">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Leadership Team
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Meet the dedicated students who lead the DWU Student Representative Council, 
            working tirelessly to represent your interests and improve campus life.
          </p>
        </div>
      </section>

      {/* Leadership Grid */}
      <section className="py-16 px-6 md:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {leadership.map((leader, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                {/* Leader Photo */}
                <div className="relative h-48 bg-gradient-to-br from-[#359d49]/10 to-[#2a6b39]/10">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-[#359d49] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {leader.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                </div>
                
                {/* Leader Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#359d49] mb-1">
                    {leader.name}
                  </h3>
                  <p className="text-[#2a6b39] font-semibold mb-2">
                    {leader.position}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {leader.department}
                  </p>
                  
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    {leader.bio}
                  </p>
                  
                  <h4 className="text-sm font-semibold text-[#359d49] mb-2">
                    Key Responsibilities:
                  </h4>
                  <ul className="space-y-1 mb-4">
                    {leader.responsibilities.slice(0, 3).map((responsibility, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="text-[#359d49] font-bold">•</span>
                        {responsibility}
                      </li>
                    ))}
                  </ul>
                  
                  <a 
                    href={`mailto:${leader.email}`}
                    className="text-[#359d49] hover:text-[#2a6b39] text-sm font-semibold transition-colors"
                  >
                    Contact {leader.name.split(' ')[0]} →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Election Information */}
      <section className="py-16 px-6 md:px-16 bg-[#359d49]/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#359d49] mb-6">
            Interested in Leadership?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            SRC leadership positions are elected annually by the student body. 
            If you&apos;re passionate about student representation and want to make a difference, 
            consider running in the next election cycle.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">🗳️</div>
              <h3 className="text-lg font-semibold text-[#359d49] mb-2">Elections</h3>
              <p className="text-sm text-gray-600">Annual elections held each academic year</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="text-lg font-semibold text-[#359d49] mb-2">Requirements</h3>
              <p className="text-sm text-gray-600">Good academic standing and student support</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="text-lg font-semibold text-[#359d49] mb-2">Commitment</h3>
              <p className="text-sm text-gray-600">Dedicated service to the student community</p>
            </div>
          </div>
          <Link href="/contact" className="bg-[#359d49] hover:bg-[#2a6b39] text-white font-semibold px-8 py-3 rounded-full transition-colors duration-300 shadow-lg hover:shadow-xl">
            Learn More About Elections
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
