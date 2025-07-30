import { PageLayout } from '@/app/components/layout/page-layout';
import NewsDisplay from '@/app/components/news/news-display';
import FeaturedNews from '@/app/components/news/featured-news';

export default function NewsPage() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">DWU SRC News & Announcements</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Stay updated with the latest news, announcements, and important information from the Student Representative Council.
            </p>
          </div>

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
    </PageLayout>
  );
} 