import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/dms/Nav";
import { TestnetBanner } from "@/components/dms/TestnetBanner";
import { Hero } from "@/components/dms/Hero";
import { Stats } from "@/components/dms/Stats";
import { AppSection } from "@/components/dms/AppSection";
import { HowItWorks } from "@/components/dms/HowItWorks";
import { WhyArc } from "@/components/dms/WhyArc";
import { Features } from "@/components/dms/Features";
import { FAQ } from "@/components/dms/FAQ";
import { Footer } from "@/components/dms/Footer";
import { ScrollProgress } from "@/components/dms/ScrollProgress";
import { Marquee } from "@/components/dms/Marquee";
import { Reveal } from "@/components/dms/Reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ArcKin · Onchain inheritance on Arc" },
      { name: "description", content: "Lock USDC or EURC, name your heirs, check in to stay alive. If you go silent, your stablecoins are released onchain automatically." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScrollProgress />
      <TestnetBanner />
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Marquee />
        <AppSection />
        <Reveal y={24}><HowItWorks /></Reveal>
        <Reveal y={24}><WhyArc /></Reveal>
        <Reveal y={24}><Features /></Reveal>
        <Reveal y={24}><FAQ /></Reveal>
      </main>
      <Footer />
    </div>
  );
}
