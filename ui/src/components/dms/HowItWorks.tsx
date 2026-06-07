import { Lock, Heart, Send } from "lucide-react";
import { Reveal } from "./Reveal";

const steps = [
  { n: "01", icon: Lock, title: "Lock & name heirs", body: "Deposit USDC or EURC into your switch and list beneficiaries with payout shares in basis points." },
  { n: "02", icon: Heart, title: "Check in to stay alive", body: "Press 'I'm alive' inside your check-in window. One click resets the countdown. No signature gymnastics." },
  { n: "03", icon: Send, title: "Silence triggers release", body: "If you go past the deadline, a keeper bot calls release() and your stablecoins flow to your heirs onchain." },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-card/40 border-y border-border">
      <div className="mx-auto max-w-7xl px-5 py-20 md:py-28">
        <Reveal>
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.18em] text-primary">How it works</div>
            <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight mt-2">
              Three steps. Zero middlemen.
            </h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.n} delay={i * 120}>
                <div className="hairline lift lift-hover rounded-2xl bg-card p-7 h-full">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs text-muted-foreground">{s.n}</div>
                    <div className="h-10 w-10 grid place-items-center rounded-full bg-primary-soft text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl font-medium mt-6">{s.title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{s.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
