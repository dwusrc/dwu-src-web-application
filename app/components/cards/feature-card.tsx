interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  className?: string;
}

export function FeatureCard({ title, description, icon, className }: FeatureCardProps) {
  return (
    <div className={`flex flex-col items-center bg-secondary-1/10 rounded-xl p-6 shadow hover:shadow-lg transition-shadow min-h-[220px] ${className || ''}`}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-primary mb-2 text-center">{title}</h3>
      <p className="text-gray-700 text-center">{description}</p>
    </div>
  );
} 