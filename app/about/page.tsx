import { PageLayout } from '../components';
import { AboutHeroSection } from '../components/about/about-hero-section';
import { AboutMissionSection } from '../components/about/about-mission-section';
import { AboutQuickLinksSection } from '../components/about/about-quick-links-section';
import { AboutStatsSection } from '../components/about/about-stats-section';
import { AboutCTASection } from '../components/about/about-cta-section';

export default function AboutPage() {
  return (
    <PageLayout>
      <AboutHeroSection />
      <AboutMissionSection />
      <AboutQuickLinksSection />
      <AboutStatsSection />
      <AboutCTASection />
    </PageLayout>
  );
}
