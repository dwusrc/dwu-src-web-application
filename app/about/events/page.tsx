import { PageLayout } from '../../components';
import Link from 'next/link';

export default function EventsPage() {
  const upcomingEvents = [
    {
      title: 'SRC General Assembly',
      date: '2024-02-15',
      time: '2:00 PM - 4:00 PM',
      location: 'Main Auditorium',
      description: 'Monthly general assembly where all students can participate in discussions about campus issues and upcoming initiatives.',
      category: 'Meeting',
      status: 'upcoming'
    },
    {
      title: 'Cultural Diversity Festival',
      date: '2024-02-28',
      time: '10:00 AM - 6:00 PM',
      location: 'Campus Grounds',
      description: 'Celebrating the rich cultural diversity of our student body with food, music, dance, and traditional displays.',
      category: 'Cultural',
      status: 'upcoming'
    },
    {
      title: 'Student Leadership Workshop',
      date: '2024-03-10',
      time: '9:00 AM - 12:00 PM',
      location: 'Conference Room A',
      description: 'Professional development workshop focusing on leadership skills, public speaking, and student advocacy.',
      category: 'Workshop',
      status: 'upcoming'
    }
  ];

  const pastEvents = [
    {
      title: 'Orientation Week 2024',
      date: '2024-01-15',
      time: 'All Week',
      location: 'Various Locations',
      description: 'Welcome week for new students featuring campus tours, department introductions, and social activities.',
      category: 'Orientation',
      status: 'completed'
    },
    {
      title: 'Environmental Awareness Campaign',
      date: '2024-01-20',
      time: '8:00 AM - 5:00 PM',
      location: 'Campus Wide',
      description: 'Campus-wide initiative promoting environmental consciousness and sustainable practices.',
      category: 'Campaign',
      status: 'completed'
    },
    {
      title: 'Inter-Department Sports Tournament',
      date: '2024-01-25',
      time: '8:00 AM - 6:00 PM',
      location: 'Sports Complex',
      description: 'Annual sports tournament bringing together students from all academic departments.',
      category: 'Sports',
      status: 'completed'
    }
  ];

  const eventCategories = [
    {
      name: 'Academic',
      icon: '📚',
      color: 'bg-[#359d49]',
      description: 'Workshops, seminars, and academic support events'
    },
    {
      name: 'Cultural',
      icon: '🎭',
      color: 'bg-[#ddc753]',
      description: 'Cultural celebrations and diversity events'
    },
    {
      name: 'Sports',
      icon: '⚽',
      color: 'bg-[#2a6b39]',
      description: 'Sports tournaments and recreational activities'
    },
    {
      name: 'Social',
      icon: '🤝',
      color: 'bg-[#359d49]',
      description: 'Social gatherings and community building events'
    },
    {
      name: 'Professional',
      icon: '💼',
      color: 'bg-[#ddc753]',
      description: 'Career development and networking events'
    },
    {
      name: 'Advocacy',
      icon: '📢',
      color: 'bg-[#2a6b39]',
      description: 'Awareness campaigns and advocacy initiatives'
    }
  ];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Meeting': 'bg-[#359d49]',
      'Cultural': 'bg-[#ddc753]',
      'Workshop': 'bg-[#2a6b39]',
      'Orientation': 'bg-[#359d49]',
      'Campaign': 'bg-[#ddc753]',
      'Sports': 'bg-[#2a6b39]'
    };
    return colors[category] || 'bg-gray-500';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#359d49] to-[#2a6b39] py-16 px-6 md:px-16">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Events & Activities
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Stay connected with campus life through our diverse range of events, workshops, 
            and activities designed to enrich your university experience.
          </p>
        </div>
      </section>

      {/* Event Categories */}
      <section className="py-16 px-6 md:px-16 bg-[#359d49]/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#359d49] text-center mb-12">
            Event Categories
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventCategories.map((category, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center text-2xl mx-auto mb-4`}>
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold text-[#359d49] mb-2">{category.name}</h3>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16 px-6 md:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#359d49] mb-12">
            Upcoming Events
          </h2>
          <div className="space-y-6">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="bg-white border-l-4 border-[#359d49] rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                    <h3 className="text-xl font-bold text-[#359d49]">{event.title}</h3>
                  </div>
                  <div className="text-sm text-gray-500">
                    <div className="flex items-center gap-2 mb-1">
                      <span>📅</span>
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span>🕒</span>
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">{event.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Past Events */}
      <section className="py-16 px-6 md:px-16 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#359d49] mb-12">
            Recent Events
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.map((event, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                    <span className="text-xs text-gray-500">Completed</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#359d49] mb-2">{event.title}</h3>
                  <div className="text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span>📅</span>
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Proposal CTA */}
      <section className="py-16 px-6 md:px-16 bg-[#359d49]/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#359d49] mb-6">
            Have an Event Idea?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            The SRC welcomes event proposals from students and student organizations. 
            Whether it&apos;s a cultural celebration, academic workshop, or community service project, 
            we&apos;re here to help bring your ideas to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="bg-[#359d49] hover:bg-[#2a6b39] text-white font-semibold px-8 py-3 rounded-full transition-colors duration-300 shadow-lg hover:shadow-xl">
              Submit Event Proposal
            </Link>
            <Link href="/news" className="border-2 border-[#359d49] text-[#359d49] hover:bg-[#359d49] hover:text-white font-semibold px-8 py-3 rounded-full transition-colors duration-300 shadow-lg hover:shadow-xl">
              Event Updates
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
