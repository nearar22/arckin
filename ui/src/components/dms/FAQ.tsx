import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "What happens if I forget to check in?",
    a: "Your switch trips when the current time passes lastCheckIn + checkInInterval. A keeper bot then calls release() and your stablecoins are distributed to your beneficiaries according to their shares. You can set generous intervals (up to 1 year) to reduce this risk.",
  },
  {
    q: "Is open release safe? Can anyone steal funds?",
    a: "release() is permissionless but it does not let anyone take your money. It only pays the addresses you set as beneficiaries, in the shares you defined. Open release is what makes the system trustless: no privileged operator can withhold the payout.",
  },
  {
    q: "Do I have to run automation myself?",
    a: "No. In production a Chainlink Automation job watches for tripped switches and calls release() automatically. For the demo we run a simple keeper bot, but you can always call release() yourself or have your heirs do it.",
  },
  {
    q: "Can I withdraw my funds anytime?",
    a: "Yes. As long as the switch is still active, you can withdraw partial or full balance, add more funds, or update your beneficiary list. Once a switch is tripped or released, withdrawals are disabled.",
  },
  {
    q: "Why stablecoins instead of ETH or other tokens?",
    a: "Inheritance has to retain its purchasing power over years. USDC and EURC are dollar- and euro-pegged stablecoins issued by Circle. Combined with Arc's USDC-native gas, this means the value you lock today is roughly the value your heirs receive tomorrow.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-background">
      <div className="mx-auto max-w-3xl px-5 py-20 md:py-28">
        <div className="text-xs uppercase tracking-[0.18em] text-primary text-center">FAQ</div>
        <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight mt-2 text-center">
          Common questions.
        </h2>
        <div className="mt-12 hairline rounded-2xl bg-card divide-y divide-border overflow-hidden shadow-[var(--shadow-soft)]">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-muted/40 transition-colors"
                >
                  <span className="font-serif text-lg font-medium">{f.q}</span>
                  {isOpen ? <Minus className="h-4 w-4 text-muted-foreground shrink-0" /> : <Plus className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-muted-foreground leading-relaxed text-sm animate-fade-up">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
