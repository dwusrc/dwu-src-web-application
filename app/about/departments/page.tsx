import { PageLayout } from '../../components';
import Link from 'next/link';

export default function DepartmentsPage() {
  const departments = [
    {
      name: 'Academic Affairs',
      description: 'Addressing academic concerns, curriculum feedback, and student-faculty relations.',
      icon: '📚',
      color: 'from-[#359d49] to-[#2a6b39]',
      responsibilities: [
        'Academic policy advocacy',
        'Curriculum review and feedback',
        'Student-faculty liaison',
        'Academic grievance support'
      ]
    },
    {
      name: 'Student Welfare',
      description: 'Ensuring student well-being, health services, and campus life improvements.',
      icon: '❤️',
      color: 'from-[#ddc753] to-[#359d49]',
      responsibilities: [
        'Health and wellness programs',
        'Counseling service coordination',
        'Student housing advocacy',
        'Campus safety initiatives'
      ]
    },
    {
      name: 'Finance & Budget',
      description: 'Managing SRC finances and advocating for transparent fee structures.',
      icon: '💰',
      color: 'from-[#2a6b39] to-[#359d49]',
      responsibilities: [
        'Budget planning and oversight',
        'Fee structure transparency',
        'Financial aid advocacy',
        'Expense management'
      ]
    },
    {
      name: 'Events & Activities',
      description: 'Organizing campus events, cultural activities, and student engagement programs.',
      icon: '🎉',
      color: 'from-[#359d49] to-[#ddc753]',
      responsibilities: [
        'Campus event planning',
        'Cultural celebration coordination',
        'Student engagement activities',
        'Community outreach programs'
      ]
    },
    {
      name: 'Communications',
      description: 'Managing SRC communications, social media, and information dissemination.',
      icon: '📢',
      color: 'from-[#ddc753] to-[#2a6b39]',
      responsibilities: [
        'Social media management',
        'Newsletter publication',
        'Information campaigns',
        'Public relations'
      ]
    },
    {
      name: 'Sports & Recreation',
      description: 'Promoting sports activities, recreational facilities, and fitness programs.',
      icon: '⚽',
      color: 'from-[#2a6b39] to-[#ddc753]',
      responsibilities: [
        'Sports event organization',
        'Recreation facility advocacy',
        'Fitness program coordination',
        'Inter-university competitions'
      ]
    },
    {
      name: 'Environmental & Sustainability',
      description: 'Promoting environmental awareness and sustainable campus practices.',
      icon: '🌱',
      color: 'from-[#359d49] to-[#2a6b39]',
      responsibilities: [
        'Environmental awareness campaigns',
        'Sustainability initiatives',
        'Green campus advocacy',
        'Waste management programs'
      ]
    }
  ];

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#359d49] to-[#2a6b39] py-16 px-6 md:px-16">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            SRC Departments
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Discover our specialized departments working tirelessly to serve and represent 
            the diverse needs of the DWU student community.
          </p>
        </div>
      </section>

      {/* Departments Grid */}
      <section className="py-16 px-6 md:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {departments.map((dept, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                {/* Department Header */}
                <div className={`bg-gradient-to-br ${dept.color} p-6 text-center`}>
                  <div className="text-4xl mb-3">{dept.icon}</div>
                  <h3 className="text-xl font-bold text-white">{dept.name}</h3>
                </div>
                
                {/* Department Content */}
                <div className="p-6">
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {dept.description}
                  </p>
                  
                  <h4 className="text-lg font-semibold text-[#359d49] mb-3">
                    Key Responsibilities:
                  </h4>
                  <ul className="space-y-2">
                    {dept.responsibilities.map((responsibility, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-[#359d49] font-bold">•</span>
                        {responsibility}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-6 md:px-16 bg-[#359d49]/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#359d49] mb-6">
            Get Involved with a Department
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Interested in joining one of our departments? Each department welcomes passionate 
            students who want to make a difference in their area of expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="bg-[#359d49] hover:bg-[#2a6b39] text-white font-semibold px-8 py-3 rounded-full transition-colors duration-300 shadow-lg hover:shadow-xl">
              Contact Us
            </Link>
            <a href="mailto:src@student.dwu.ac.pg" className="border-2 border-[#359d49] text-[#359d49] hover:bg-[#359d49] hover:text-white font-semibold px-8 py-3 rounded-full transition-colors duration-300 shadow-lg hover:shadow-xl">
              Email Directly
            </a>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
