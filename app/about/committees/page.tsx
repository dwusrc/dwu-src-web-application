'use client';

import { useState } from 'react';
import { PageLayout } from '../../components';
import Link from 'next/link';

interface CommitteeMember {
  name: string;
  email: string;
}

interface Committee {
  name: string;
  description: string;
  icon: string;
  color: string;
  responsibilities: string[];
  members: CommitteeMember[];
}

export default function CommitteesPage() {
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const committees = [
    {
      name: 'Assets',
      description: 'Manages and maintains SRC property, equipment, and resources to ensure they are well-kept and used responsibly.',
      icon: '🏗️',
      color: 'from-[#2a6b39] to-[#359d49]',
      responsibilities: [
        'Property and equipment management',
        'Resource allocation and maintenance',
        'Asset inventory and tracking',
        'Facility upkeep coordination',
        'Resource utilization optimization'
      ],
      members: [
        { name: 'Jason Tabun', email: '230102@student.dwu.ac.pg' },
        { name: 'Melva Laka', email: '220228@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'Missioning',
      description: 'Supports and coordinates student participation in university mission activities, faith-based programs, and community outreach aligned with DWU&apos;s values.',
      icon: '⛪',
      color: 'from-[#7c3aed] to-[#6d28d9]',
      responsibilities: [
        'Faith-based program coordination',
        'Community outreach initiatives',
        'Mission activity support',
        'Spiritual development programs',
        'Values-based community service'
      ],
      members: [
        { name: 'Gamong Masia', email: '230250@student.dwu.ac.pg' },
        { name: 'Anton Alphonse', email: '230503@student.dwu.ac.pg' },
        { name: 'Joseph Vagi Hera', email: '240008@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'Community Service',
      description: 'Organizes service projects, volunteer activities, and initiatives that connect students with surrounding communities.',
      icon: '🤝',
      color: 'from-[#059669] to-[#047857]',
      responsibilities: [
        'Volunteer program coordination',
        'Community outreach projects',
        'Service learning initiatives',
        'Partnership development',
        'Social impact programs'
      ],
      members: [
        { name: 'Daniel Kabata', email: '220358@student.dwu.ac.pg' },
        { name: 'Nicolyn Jack', email: '221364@student.dwu.ac.pg' },
        { name: 'Jerome Nekints', email: '220266@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'Cultural',
      description: 'Promotes and celebrates Papua New Guinea&apos;s diverse traditions and cultures through events, performances, and cultural awareness activities.',
      icon: '🌺',
      color: 'from-[#dc2626] to-[#b91c1c]',
      responsibilities: [
        'Cultural event organization',
        'Traditional performance coordination',
        'Cultural awareness programs',
        'Heritage celebration activities',
        'Diversity promotion initiatives'
      ],
      members: [
        { name: 'Issabella Narapal', email: '210666@student.dwu.ac.pg' },
        { name: 'Graham Kuman', email: '230276@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'Debate',
      description: 'Encourages critical thinking and public speaking by organizing debates, discussions, and intellectual competitions among students.',
      icon: '💭',
      color: 'from-[#2563eb] to-[#1d4ed8]',
      responsibilities: [
        'Debate competition organization',
        'Public speaking workshops',
        'Intellectual discussion forums',
        'Critical thinking development',
        'Academic discourse promotion'
      ],
      members: [
        { name: 'Karen Korowa', email: '220061@student.dwu.ac.pg' },
        { name: 'Derlilah Wills', email: '210518@student.dwu.ac.pg' },
        { name: 'Richard William', email: '241292@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'Enrichment',
      description: 'Facilitates programs that develop students&apos; personal and academic growth outside the classroom, such as workshops and skills training.',
      icon: '📚',
      color: 'from-[#d97706] to-[#b45309]',
      responsibilities: [
        'Skills development workshops',
        'Personal growth programs',
        'Academic enrichment activities',
        'Leadership training sessions',
        'Professional development courses'
      ],
      members: [
        { name: 'Theresha Orere', email: '230254@student.dwu.ac.pg' },
        { name: 'Pheobe Papa', email: '220343@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'Electoral',
      description: 'Oversees the fair and transparent conduct of SRC elections, ensuring student representation is democratic.',
      icon: '🗳️',
      color: 'from-[#0891b2] to-[#0e7490]',
      responsibilities: [
        'Election process management',
        'Voter registration coordination',
        'Campaign oversight and fairness',
        'Result verification and transparency',
        'Democratic process integrity'
      ],
      members: [
        { name: 'Essie Tika', email: '220268@student.dwu.ac.pg' },
        { name: 'Marcella Iko', email: '230067@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'Pageant',
      description: 'Organizes and manages beauty pageants and talent shows, promoting student confidence, creativity, and entertainment.',
      icon: '👑',
      color: 'from-[#ec4899] to-[#db2777]',
      responsibilities: [
        'Talent show organization',
        'Pageant event management',
        'Confidence building programs',
        'Creative expression support',
        'Entertainment event coordination'
      ],
      members: [
        { name: 'Abigail Biti', email: '230050@student.dwu.ac.pg' },
        { name: 'Narisha Asoh', email: '210639@student.dwu.ac.pg' },
        { name: 'Antonia Inau', email: '240262@student.dwu.ac.pg' },
        { name: 'Rayln Ganisi', email: '240063@student.dwu.ac.pg' },
        { name: 'Nizal Goi', email: '200123@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'Fundraising',
      description: 'Plans and carries out income-generating activities to support SRC projects, events, and student initiatives.',
      icon: '💰',
      color: 'from-[#16a34a] to-[#15803d]',
      responsibilities: [
        'Fundraising event planning',
        'Revenue generation strategies',
        'Donor relationship management',
        'Financial goal setting',
        'Project funding coordination'
      ],
      members: [
        { name: 'John Kambavas', email: '220206@student.dwu.ac.pg' },
        { name: 'Shanilla Samuel', email: '220241@student.dwu.ac.pg' },
        { name: 'Anthony Rajam', email: '240129@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'Gutpela Sindaun',
      description: 'Promotes student welfare, discipline, and moral values, ensuring harmony and good living within the campus community.',
      icon: '🌟',
      color: 'from-[#ddc753] to-[#d4af37]',
      responsibilities: [
        'Student welfare promotion',
        'Discipline and conduct guidance',
        'Moral values education',
        'Campus harmony initiatives',
        'Good living standards advocacy'
      ],
      members: [
        { name: 'Clara Petrus', email: '230091@student.dwu.ac.pg' },
        { name: 'Rosemary Mase', email: '230012@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'ICT',
      description: 'Provides technical support for SRC projects, manages digital platforms, and promotes the effective use of technology among students.',
      icon: '💻',
      color: 'from-[#6366f1] to-[#5855eb]',
      responsibilities: [
        'Technical support provision',
        'Digital platform management',
        'Technology training programs',
        'IT infrastructure support',
        'Digital literacy promotion'
      ],
      members: [
        { name: 'Blessina Korowi', email: '210744@student.dwu.ac.pg' },
        { name: 'Mason Kolias', email: '230198@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'Interest Group',
      description: 'Coordinates and supports student clubs and societies, encouraging participation in extracurricular activities.',
      icon: '🎯',
      color: 'from-[#f59e0b] to-[#d97706]',
      responsibilities: [
        'Club and society coordination',
        'Extracurricular activity support',
        'Student group facilitation',
        'Activity promotion and engagement',
        'Community building initiatives'
      ],
      members: [
        { name: 'Walter Karake', email: '11021@student.dwu.ac.pg' },
        { name: 'Gregan Wapiwalo', email: '230109@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'International Student Representative',
      description: 'Advocates for the needs and interests of international students, helping them integrate into campus life.',
      icon: '🌍',
      color: 'from-[#10b981] to-[#059669]',
      responsibilities: [
        'International student advocacy',
        'Cultural integration support',
        'Needs assessment and representation',
        'Cross-cultural communication',
        'Global community building'
      ],
      members: [
        { name: 'Devontay Paraka', email: '220193@student.dwu.ac.pg' },
        { name: 'Tania Turnamur', email: '230037@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'Mess',
      description: 'Represents students&apos; concerns regarding dining services, food quality, and meal arrangements on campus.',
      icon: '🍽️',
      color: 'from-[#f97316] to-[#ea580c]',
      responsibilities: [
        'Dining service representation',
        'Food quality advocacy',
        'Meal arrangement coordination',
        'Student feedback collection',
        'Catering service liaison'
      ],
      members: [
        { name: 'Nichole Kama', email: '210476@student.dwu.ac.pg' },
        { name: 'Patrick Bernny', email: '230271@student.dwu.ac.pg' },
        { name: 'Titus Hopai', email: '220256@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'Ombudsman Commission',
      description: 'Acts as a student watchdog, addressing complaints and grievances to ensure accountability and fairness in SRC and university dealings.',
      icon: '⚖️',
      color: 'from-[#8b5cf6] to-[#7c3aed]',
      responsibilities: [
        'Complaint investigation',
        'Grievance resolution support',
        'Accountability monitoring',
        'Fairness advocacy',
        'Student rights protection'
      ],
      members: [
        { name: 'Raphaella Gegeyo', email: '220255@student.dwu.ac.pg' },
        { name: 'Raven Ondopa', email: '200434@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'Media',
      description: 'Handles publicity, announcements, and documentation of SRC events through posters, newsletters, and social media.',
      icon: '📢',
      color: 'from-[#06b6d4] to-[#0891b2]',
      responsibilities: [
        'Publicity and announcements',
        'Event documentation',
        'Social media management',
        'Newsletter publication',
        'Communication strategy'
      ],
      members: [
        { name: 'Ken Jacob', email: '230006@student.dwu.ac.pg' },
        { name: 'Nina Tibong', email: '230394@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'Pastoral Care',
      description: 'Supports students\' spiritual well-being and personal development through faith-based programs and counseling.',
      icon: '🙏',
      color: 'from-[#84cc16] to-[#65a30d]',
      responsibilities: [
        'Spiritual well-being support',
        'Faith-based program coordination',
        'Personal development counseling',
        'Pastoral guidance provision',
        'Spiritual community building'
      ],
      members: [
        { name: 'Michaelyn Kakai', email: '230134@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'Sports',
      description: 'Promotes fitness, organizes sporting events, and encourages participation in recreational and competitive sports.',
      icon: '⚽',
      color: 'from-[#ef4444] to-[#dc2626]',
      responsibilities: [
        'Sporting event organization',
        'Fitness promotion programs',
        'Recreational activity coordination',
        'Competitive sports support',
        'Athletic community building'
      ],
      members: [
        { name: 'Jerol Bero', email: '230189@student.dwu.ac.pg' },
        { name: 'Damian Kingi', email: '230509@student.dwu.ac.pg' },
        { name: 'Della Pere', email: '230033@student.dwu.ac.pg' }
      ]
    },
    {
      name: 'Public Relations',
      description: 'Builds the image of the SRC by managing communication with students, staff, and external stakeholders.',
      icon: '🤝',
      color: 'from-[#3b82f6] to-[#2563eb]',
      responsibilities: [
        'SRC image building',
        'Stakeholder communication',
        'Public relations strategy',
        'Brand management',
        'External relationship building'
      ],
      members: [
        { name: 'Joycelyne Hauta', email: '220035@student.dwu.ac.pg' },
        { name: 'Wedfine Dai', email: '230002@student.dwu.ac.pg' },
        { name: 'Robin Joshua', email: '220389@student.dwu.ac.pg' },
        { name: 'Johnbosco Wulkas', email: '220362@student.dwu.ac.pg' }
      ]
    }
  ];

  const handleContactClick = (committee: Committee) => {
    setSelectedCommittee(committee);
    setShowContactModal(true);
  };

  const closeContactModal = () => {
    setShowContactModal(false);
    setSelectedCommittee(null);
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#359d49] to-[#2a6b39] py-16 px-6 md:px-16">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            SRC Committees
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Discover our specialized committees working tirelessly to serve and represent 
            the diverse needs of the DWU student community.
          </p>
        </div>
      </section>

      {/* Committees Grid */}
      <section className="py-16 px-6 md:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {committees.map((committee, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
                {/* Committee Header */}
                <div className={`bg-gradient-to-br ${committee.color} p-6 text-center transform group-hover:scale-105 transition-transform duration-300`}>
                  <div className="text-4xl mb-3">{committee.icon}</div>
                  <h3 className="text-xl font-bold text-white">{committee.name}</h3>
                </div>
                
                {/* Committee Content */}
                <div className="p-6">
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {committee.description}
                  </p>
                  
                  <h4 className="text-lg font-semibold text-[#359d49] mb-3">
                    Key Responsibilities:
                  </h4>
                  <ul className="space-y-2 mb-6">
                    {committee.responsibilities.map((responsibility, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-[#359d49] font-bold mt-1">•</span>
                        <span>{responsibility}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Contact Button */}
                  <button
                    onClick={() => handleContactClick(committee)}
                    className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    Contact Committee Members
                  </button>
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
            Get Involved with a Committee
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Interested in joining one of our committees? Each committee welcomes passionate 
            students who want to make a difference in their area of expertise. We&apos;re always 
            looking for dedicated members to help serve the student community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="bg-[#359d49] hover:bg-[#2a6b39] text-white font-semibold px-8 py-3 rounded-full transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              Contact Us
            </Link>
            <a href="mailto:src@student.dwu.ac.pg" className="border-2 border-[#359d49] text-[#359d49] hover:bg-[#359d49] hover:text-white font-semibold px-8 py-3 rounded-full transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              Email Directly
            </a>
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="py-16 px-6 md:px-16 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#359d49] mb-6">
            How Committees Work
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="text-center">
              <div className="bg-[#359d49]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-[#359d49] mb-2">Student-Led</h3>
              <p className="text-gray-600 text-sm">Each committee is led by student volunteers who are passionate about their area of focus.</p>
            </div>
            <div className="text-center">
              <div className="bg-[#359d49]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-lg font-semibold text-[#359d49] mb-2">Collaborative</h3>
              <p className="text-gray-600 text-sm">Committees work together with faculty, staff, and administration to implement positive changes.</p>
            </div>
            <div className="text-center">
              <div className="bg-[#359d49]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-[#359d49] mb-2">Impact-Driven</h3>
              <p className="text-gray-600 text-sm">Every committee focuses on creating tangible improvements for the student experience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Modal */}
      {showContactModal && selectedCommittee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className={`bg-gradient-to-br ${selectedCommittee.color} p-6 text-center rounded-t-xl`}>
              <div className="text-4xl mb-3">{selectedCommittee.icon}</div>
              <h3 className="text-xl font-bold text-white">{selectedCommittee.name} Committee</h3>
              <p className="text-white/90 text-sm mt-2">Contact Committee Members</p>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                {selectedCommittee.members.map((member, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <h4 className="font-semibold text-gray-900 mb-2">{member.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm">Email:</span>
                      <a 
                        href={`mailto:${member.email}`}
                        className="text-[#359d49] hover:text-[#2a6b39] text-sm font-medium hover:underline break-all"
                      >
                        {member.email}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={closeContactModal}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
