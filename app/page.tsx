import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 py-4 bg-primary text-white shadow-md">
        <div className="flex items-center gap-3">
          <Image
            src="/images/dwu logo.png"
            alt="Divine Word University Logo"
            width={48}
            height={48}
            className="rounded bg-white p-1"
            priority
          />
          <span className="text-2xl font-bold tracking-tight">DWU SRC</span>
        </div>
        <nav className="hidden md:flex gap-6 text-base font-medium">
          <a href="#features" className="hover:underline underline-offset-4">Features</a>
          <a href="#about" className="hover:underline underline-offset-4">About</a>
          <a href="#contact" className="hover:underline underline-offset-4">Contact</a>
        </nav>
        <a
          href="#login"
          className="bg-secondary-1 text-primary font-semibold px-5 py-2 rounded-full shadow hover:bg-secondary-2 hover:text-white transition-colors"
        >
          Login
        </a>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col-reverse md:flex-row items-center justify-between px-6 md:px-16 py-12 gap-10 bg-gradient-to-br from-primary/10 to-secondary-1/10">
        <div className="flex-1 flex flex-col items-start gap-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-2 leading-tight">
            Empowering Students. <br /> Connecting DWU.
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-xl">
            The official platform for Divine Word University’s Student Representative Council. Stay informed, raise your voice, and connect with your SRC.
          </p>
          <div className="flex gap-4 mt-2">
            <a
              href="#features"
              className="bg-primary text-white px-6 py-3 rounded-full font-semibold shadow hover:bg-secondary-2 transition-colors"
            >
              Explore Features
            </a>
            <a
              href="#about"
              className="bg-secondary-1 text-primary px-6 py-3 rounded-full font-semibold shadow hover:bg-secondary-2 hover:text-white transition-colors"
            >
              About SRC
            </a>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <Image
            src="/images/hero image.jpg"
            alt="Students at Divine Word University"
            width={480}
            height={360}
            className="rounded-xl shadow-lg object-cover w-full max-w-md h-auto"
            priority
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 md:px-16 py-16 bg-white">
        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            title="News & Announcements"
            description="Stay updated with the latest SRC news, events, and official updates."
            icon="📰"
          />
          <FeatureCard
            title="Student Accounts"
            description="Create your account to submit complaints, proposals, and ideas securely."
            icon="👤"
          />
          <FeatureCard
            title="Complaint Management"
            description="File complaints and track their resolution status with transparency."
            icon="📣"
          />
          <FeatureCard
            title="Student Chat"
            description="Chat directly with SRC members for support and guidance."
            icon="💬"
          />
          <FeatureCard
            title="Discussion Forums"
            description="Engage in open discussions and reply to public topics."
            icon="💡"
          />
          <FeatureCard
            title="Reports & Analytics"
            description="Access monthly reports and platform statistics (admin only)."
            icon="📊"
          />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="px-6 md:px-16 py-16 bg-secondary-1/20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">About DWU SRC</h2>
          <p className="text-lg text-gray-700 mb-4">
            The DWU Student Representative Council is dedicated to fostering communication, transparency, and student empowerment at Divine Word University, Madang. Our platform bridges the gap between students and leadership, ensuring every voice is heard.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 px-6 md:px-16 bg-primary text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image
            src="/images/dwu logo.png"
            alt="DWU Logo"
            width={32}
            height={32}
            className="bg-white rounded"
          />
          <span className="font-semibold">Divine Word University SRC</span>
        </div>
        <div className="text-sm">&copy; {new Date().getFullYear()} All rights reserved.</div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center bg-secondary-1/10 rounded-xl p-6 shadow hover:shadow-lg transition-shadow min-h-[220px]">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-primary mb-2 text-center">{title}</h3>
      <p className="text-gray-700 text-center">{description}</p>
    </div>
  );
}
