import HeroSection from '@/components/home/HeroSection';
import IntroSection from '@/components/home/IntroSection';
import StatsSection from '@/components/home/StatsSection';
import QuickLinks from '@/components/home/QuickLinks';
import RecentSection from '@/components/home/RecentSection';
import { InkDivider } from '@/components/ui/InkDecoration';

export default function Home() {
  return (
    <>
      <HeroSection />
      <InkDivider />
      <IntroSection />
      <InkDivider />
      <StatsSection />
      <InkDivider />
      <QuickLinks />
      <InkDivider />
      <RecentSection />
    </>
  );
}
