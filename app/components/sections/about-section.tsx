interface AboutSectionProps {
  className?: string;
}

export function AboutSection({ className }: AboutSectionProps) {
  return (
    <section className={`px-6 md:px-16 py-16 bg-secondary-1/20 ${className || ''}`}>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">About DWU SRC</h2>
        <p className="text-lg text-gray-700 mb-4">
          The DWU Student Representative Council is dedicated to fostering communication, transparency, and student empowerment at Divine Word University, Madang. Our platform bridges the gap between students and leadership, ensuring every voice is heard.
        </p>
      </div>
    </section>
  );
} 