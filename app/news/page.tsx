import { PageLayout } from '@/app/components/layout/page-layout';
import NewsDisplay from '@/app/components/news/news-display';
import FeaturedNews from '@/app/components/news/featured-news';

export default function NewsPage() {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#359d49] to-[#2a6b39] py-16 px-6 md:px-16">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            DWU SRC News & Announcements
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Stay updated with the latest news, announcements, and important information from the Student Representative Council.
          </p>
        </div>
      </section>

      {/* News Content */}
      <section className="py-16 px-6 md:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-8">

          {/* Featured News Section */}
          <FeaturedNews limit={3} showViewAll={false} />

          {/* All News Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">All News</h2>
            </div>
            <NewsDisplay limit={20} showFilters={true} showPagination={true} />
          </div>
        </div>
      </div>
      </section>
    </PageLayout>
  );
} 