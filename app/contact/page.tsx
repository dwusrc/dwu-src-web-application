import { PageLayout } from '../components';

export default function ContactPage() {
  const contactMethods = [
    {
      title: 'Email Us',
      icon: '📧',
      primary: 'src@student.dwu.ac.pg',
      secondary: 'General inquiries and support',
      color: 'from-[#359d49] to-[#2a6b39]'
    },
    {
      title: 'Visit Our Office',
      icon: '🏢',
      primary: 'Student Center, Room 201',
      secondary: 'Open Monday-Friday, 8:00 AM - 5:00 PM',
      color: 'from-[#ddc753] to-[#359d49]'
    },
    {
      title: 'Phone',
      icon: '📞',
      primary: '+675 123 4567',
      secondary: 'Available during office hours',
      color: 'from-[#2a6b39] to-[#359d49]'
    }
  ];

  const departments = [
    {
      name: 'President',
      email: 'president@student.dwu.ac.pg',
      description: 'General leadership and strategic matters'
    },
    {
      name: 'Academic Affairs',
      email: 'academic@student.dwu.ac.pg',
      description: 'Academic concerns and curriculum feedback'
    },
    {
      name: 'Student Welfare',
      email: 'welfare@student.dwu.ac.pg',
      description: 'Student well-being and campus life issues'
    },
    {
      name: 'Finance & Budget',
      email: 'finance@student.dwu.ac.pg',
      description: 'Financial matters and budget inquiries'
    },
    {
      name: 'Events & Activities',
      email: 'events@student.dwu.ac.pg',
      description: 'Event planning and activity coordination'
    },
    {
      name: 'Communications',
      email: 'communications@student.dwu.ac.pg',
      description: 'Media inquiries and information requests'
    }
  ];

  const faqItems = [
    {
      question: 'How can I join the SRC?',
      answer: 'You can get involved by attending our general assemblies, volunteering for events, or applying for departmental positions when they become available. Elections for major positions are held annually.'
    },
    {
      question: 'How do I submit a complaint or suggestion?',
      answer: 'You can submit complaints through our online system, email us directly, or visit our office during office hours. All submissions are treated confidentially and addressed promptly.'
    },
    {
      question: 'When are SRC meetings held?',
      answer: 'General assemblies are held monthly, usually on the third Thursday of each month. Department meetings vary by schedule. Check our events page or social media for specific dates.'
    },
    {
      question: 'How can I propose an event or initiative?',
      answer: 'Event proposals can be submitted through our contact form, email, or by speaking with the Events & Activities department. We welcome creative ideas that benefit the student community.'
    },
    {
      question: 'What services does the SRC provide?',
      answer: 'We provide academic advocacy, student welfare support, event coordination, financial transparency, communication services, and serve as a liaison between students and university administration.'
    }
  ];

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#359d49] to-[#2a6b39] py-16 px-6 md:px-16">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Have questions, suggestions, or want to get involved? We&apos;re here to listen and help. 
            Reach out to us through any of the methods below.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 px-6 md:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#359d49] text-center mb-12">
            Get in Touch
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <div key={index} className="text-center">
                <div className={`w-20 h-20 bg-gradient-to-br ${method.color} rounded-full flex items-center justify-center text-3xl mx-auto mb-6`}>
                  {method.icon}
                </div>
                <h3 className="text-xl font-bold text-[#359d49] mb-3">{method.title}</h3>
                <p className="text-lg font-semibold text-gray-800 mb-2">{method.primary}</p>
                <p className="text-gray-600">{method.secondary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Department Contacts */}
      <section className="py-16 px-6 md:px-16 bg-[#359d49]/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#359d49] text-center mb-12">
            Department Contacts
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-bold text-[#359d49] mb-2">{dept.name}</h3>
                <a 
                  href={`mailto:${dept.email}`}
                  className="text-[#2a6b39] hover:text-[#359d49] font-semibold text-sm mb-3 block transition-colors"
                >
                  {dept.email}
                </a>
                <p className="text-gray-600 text-sm">{dept.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-6 md:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#359d49] text-center mb-12">
            Send Us a Message
          </h2>
          <form className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49] transition-colors"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49] transition-colors"
                  placeholder="your.email@student.dwu.ac.pg"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="department" className="block text-sm font-semibold text-gray-700 mb-2">
                Department/Topic
              </label>
              <select
                id="department"
                name="department"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49] transition-colors"
              >
                <option value="">Select a department or topic</option>
                <option value="general">General Inquiry</option>
                <option value="academic">Academic Affairs</option>
                <option value="welfare">Student Welfare</option>
                <option value="finance">Finance & Budget</option>
                <option value="events">Events & Activities</option>
                <option value="communications">Communications</option>
                <option value="complaint">File a Complaint</option>
                <option value="suggestion">Suggestion</option>
                <option value="join">Join SRC</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49] transition-colors"
                placeholder="Brief subject of your message"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49] transition-colors resize-vertical"
                placeholder="Please provide details about your inquiry, suggestion, or concern..."
              ></textarea>
            </div>
            
            <div className="text-center">
              <button
                type="submit"
                className="bg-[#359d49] hover:bg-[#2a6b39] text-white font-semibold px-8 py-3 rounded-full transition-colors duration-300 shadow-lg hover:shadow-xl"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 md:px-16 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#359d49] text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-[#359d49] mb-3">{item.question}</h3>
                <p className="text-gray-600 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Office Hours */}
      <section className="py-16 px-6 md:px-16 bg-[#359d49]/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#359d49] mb-6">
            Office Hours & Location
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-4xl mb-4">🕒</div>
              <h3 className="text-xl font-bold text-[#359d49] mb-3">Office Hours</h3>
              <div className="text-gray-600">
                <p className="mb-2"><strong>Monday - Friday:</strong> 8:00 AM - 5:00 PM</p>
                <p className="mb-2"><strong>Saturday:</strong> 9:00 AM - 1:00 PM</p>
                <p><strong>Sunday:</strong> Closed</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-bold text-[#359d49] mb-3">Our Location</h3>
              <div className="text-gray-600">
                <p className="mb-2"><strong>Address:</strong></p>
                <p className="mb-2">Student Representative Council Office</p>
                <p className="mb-2">Student Center, Room 201</p>
                <p>Divine Word University Campus</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
