import Hero from '../sections/Hero';
import StatsStrip from '../sections/StatsStrip';
import EndingSoon from '../sections/EndingSoon';
import { BusinessTeaser, MiniExplainer, TrustStrip } from '../sections/HomeInfo';
import usePageMeta from '../hooks/usePageMeta';
import { useRules } from '../hooks/useMeta';
import useComingSoon from '../hooks/useComingSoon';
import { ComingSoonHome } from '../sections/ComingSoon';

// The landing page: short on purpose (about two phone screens). Details live on /how-it-works and /sell-with-us.
export default function Home() {
  if (useComingSoon()) return <ComingSoonHome />;
  return <LiveHome />;
}

function LiveHome() {
  const r = useRules();
  usePageMeta(null, `Good food from Lagos kitchens, bakeries and shops, at least ${r.minDiscount}% off. Pay online and collect with a 6-digit code.`);
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
