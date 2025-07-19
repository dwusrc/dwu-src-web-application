import { FeatureCard } from '../cards/feature-card';

interface FeaturesSectionProps {
  className?: string;
}

const features = [
  {
    title: "News & Announcements",
    description: "Stay updated with the latest SRC news, events, and official updates.",
    icon: "📰"
  },
  {
    title: "Student Accounts",
    description: "Create your account to submit complaints, proposals, and ideas securely.",
    icon: "👤"
  },
  {
    title: "Complaint Management",
    description: "File complaints and track their resolution status with transparency.",
    icon: "📣"
  },
  {
    title: "Student Chat",
    description: "Chat directly with SRC members for support and guidance.",
    icon: "💬"
  },
  {
    title: "Discussion Forums",
    description: "Engage in open discussions and reply to public topics.",
    icon: "💡"
  },
  {
    title: "Reports & Analytics",
    description: "Access monthly reports and platform statistics (admin only).",
    icon: "📊"
  }
];

export function FeaturesSection({ className }: FeaturesSectionProps) {
  return (
    <section className={`px-6 md:px-16 py-16 bg-white ${className || ''}`}>
      <h2 className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center">Key Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
          />
        ))}
      </div>
    </section>
  );
} 