import { Check, X } from "lucide-react";
import { Reveal } from "./Reveal";

const rows = [
  ["Gas paid in", "Volatile native token", "USDC (stable)"],
  ["Finality", "12s – 2 min", "~0.48s"],
  ["Cost of a check-in", "$0.50 – $5", "Pennies"],
  ["Native stablecoins", "USDC bridged", "USDC + EURC native"],
  ["Inheritance value", "Drifts with token price", "Stable, denominated in $/€"],
];

export function WhyArc() {
  return (
    <section id="why-arc" className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-20 md:py-28">
        <Reveal>
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.18em] text-primary">Why Arc</div>
            <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight mt-2">
              Built on Circle's USDC-native chain.
            </h2>
            <p className="text-muted-foreground mt-4">
              Inheritance is a long game. You need a chain where the unit of account doesn't swing, gas is predictable, and the funds settle before you can blink.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-10 hairline rounded-2xl bg-card overflow-hidden shadow-[var(--shadow-soft)]">
            <div className="grid grid-cols-3 bg-muted/50 border-b border-border">
              <div className="px-5 py-4 text-xs uppercase tracking-[0.12em] text-muted-foreground">Property</div>
              <div className="px-5 py-4 text-xs uppercase tracking-[0.12em] text-muted-foreground">Typical L1</div>
              <div className="px-5 py-4 text-xs uppercase tracking-[0.12em] text-primary font-medium">Arc</div>
            </div>
            {rows.map(([k, a, b], i) => (
              <div key={k} className={`grid grid-cols-3 items-center text-sm ${i < rows.length - 1 ? "border-b border-border" : ""}`}>
                <div className="px-5 py-4 font-medium">{k}</div>
                <div className="px-5 py-4 text-muted-foreground flex items-center gap-2"><X className="h-3.5 w-3.5 text-rust" /> {a}</div>
                <div className="px-5 py-4 flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> {b}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
