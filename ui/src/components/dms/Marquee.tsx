import { useChainEvents } from "@/lib/web3/events";

const fallback = [
  "Lock USDC or EURC",
  "Name your heirs",
  "Check in to stay alive",
  "Go silent → auto release",
  "Settled on Arc",
  "USDC pays the gas",
  "0.48s finality",
];

export function Marquee() {
  const { activity } = useChainEvents();
  const items =
    activity.length > 0 ? activity.slice(0, 12).map((a) => a.text) : fallback;
  const row = [...items, ...items];

  return (
    <div className="border-y border-border bg-card/30 overflow-hidden">
      <div className="relative">
        <div className="flex animate-marquee whitespace-nowrap py-3.5 will-change-transform">
          {row.map((t, i) => (
            <div key={i} className="flex items-center gap-3 px-6 text-xs text-muted-foreground font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span>{t}</span>
              <span className="text-border">/</span>
            </div>
          ))}
        </div>
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
