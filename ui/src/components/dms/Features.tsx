import { Zap, Coins, Bot, KeyRound, Euro, ShieldCheck } from "lucide-react";
import { Reveal } from "./Reveal";

const features = [
  { icon: Zap, title: "Sub-second settlement", body: "Releases finalize in ~0.48s on Arc. Heirs don't wait." },
  { icon: Coins, title: "USDC is gas", body: "Pay every check-in and release in stablecoins. No need to hold a volatile gas token." },
  { icon: Bot, title: "Hands-off release", body: "A keeper bot watches the deadline and triggers payout. You don't need to log back in." },
  { icon: KeyRound, title: "You stay in control", body: "Withdraw, deposit, or edit heirs at any time, until silence." },
  { icon: Euro, title: "USDC & EURC", body: "Lock in dollars or euros, with native Circle stablecoins on Arc." },
  { icon: ShieldCheck, title: "Fully verifiable", body: "Open-source contract. Every check-in, deposit, and release is on-chain and auditable." },
];

export function Features() {
  return (
    <section className="bg-card/40 border-y border-border">
      <div className="mx-auto max-w-7xl px-5 py-20 md:py-28">
        <Reveal>
          <div className="max-w-2xl mb-12">
            <div className="text-xs uppercase tracking-[0.18em] text-primary">Built for permanence</div>
            <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight mt-2">Designed like a vault.</h2>
          </div>
        </Reveal>
        <div className="grid gap-px bg-border md:grid-cols-3 hairline rounded-2xl overflow-hidden">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 3) * 100} y={10}>
                <div className="bg-card p-7 lift lift-hover h-full">
                  <div className="h-10 w-10 grid place-items-center rounded-full bg-primary-soft text-primary mb-5">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-serif text-xl font-medium">{f.title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{f.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
