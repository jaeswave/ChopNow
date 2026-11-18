import Hero from '../sections/Hero';
import StatsStrip from '../sections/StatsStrip';
import EndingSoon from '../sections/EndingSoon';
import { BusinessTeaser, MiniExplainer, TrustStrip } from '../sections/HomeInfo';

// The landing page: short on purpose (about two phone screens). Details live on /how-it-works and /sell-with-us.
export default function Home() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <EndingSoon />
      <MiniExplainer />
      <TrustStrip />
      <BusinessTeaser />
    </>
  );
}
