import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function Hero() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const onScroll = () => setY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="paper-grain absolute inset-0 opacity-60 pointer-events-none" />

      {/* Decorative animated orbit (parallax) */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-180px] top-10 hidden lg:block"
        style={{ transform: `translateY(${y * 0.18}px)` }}
      >
        <div className="relative h-[560px] w-[560px]">
          <div className="absolute inset-0 rounded-full border border-border opacity-70" />
          <div className="absolute inset-12 rounded-full border border-border opacity-50" />
          <div className="absolute inset-24 rounded-full border border-border opacity-30" />
          <div className="absolute inset-40 rounded-full bg-primary-soft opacity-60 blur-2xl" />
          {/* orbiting dot */}
          <div
            className="absolute inset-0 origin-center"
            style={{ animation: "orbit 28s linear infinite" }}
          >
            <div className="absolute left-1/2 -top-1.5 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_24px_var(--primary)]" />
          </div>
          <div
            className="absolute inset-12 origin-center"
            style={{ animation: "orbit 18s linear infinite reverse" }}
          >
            <div className="absolute left-1/2 -top-1 h-2 w-2 -translate-x-1/2 rounded-full bg-gold" />
          </div>
          {/* center seal */}
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-card hairline grid place-items-center shadow-[var(--shadow-lift)]">
                <div className="font-serif text-5xl text-primary">◐</div>
              </div>
              <div className="absolute inset-0 rounded-full ring-1 ring-primary/20 animate-ping" style={{ animationDuration: "3.2s" }} />
            </div>
          </div>
        </div>
      </div>

      <div
        className="mx-auto max-w-7xl px-5 pt-20 pb-24 md:pt-28 md:pb-36 relative"
        style={{ transform: `translateY(${y * -0.04}px)` }}
      >
        <div className="max-w-3xl animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full hairline bg-card px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Open source · Open release · Non-custodial</span>
          </div>
          <h1 className="mt-6 font-serif text-5xl md:text-7xl font-medium leading-[1.02] tracking-tight text-ink">
            Your USDC, in safe hands.
            <br />
            <span className="italic text-primary">Even if you go silent.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            A digital will that executes itself. Lock stablecoins, name your heirs, and check in
            to prove you're alive. If you stop, your funds are released onchain, automatically.
            No lawyers. No courts. No middlemen.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#app"
              className="lift lift-hover group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground"
            >
              Open the app
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how"
              className="hairline lift lift-hover inline-flex items-center gap-2 rounded-full bg-card px-6 py-3.5 text-sm font-medium"
            >
              How it works
            </a>
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Sub-second finality
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Pay gas in USDC
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Verifiable on-chain
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        <span>Scroll</span>
        <div className="h-8 w-px bg-border relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-3 bg-primary" style={{ animation: "scrollHint 1.8s ease-in-out infinite" }} />
        </div>
      </div>
    </section>
  );
}
