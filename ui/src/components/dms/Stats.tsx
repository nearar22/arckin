import { useReveal, useCountUp } from "./Reveal";
import { useSwitches } from "@/lib/web3/hooks";

function Stat({
  label,
  value,
  i,
  shown,
  prefix = "",
  suffix = "",
  decimals,
}: {
  label: string;
  value: number;
  i: number;
  shown: boolean;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const v = useCountUp(value, 1500 + i * 100, shown);
  const formatted =
    decimals !== undefined ? v.toFixed(decimals) : Math.round(v).toLocaleString();
  return (
    <div
      className={`py-10 md:py-12 px-2 md:px-6 ${i > 0 ? "md:border-l border-border" : ""} ${i % 2 === 1 ? "border-l md:border-l border-border" : ""} ${i >= 2 ? "border-t md:border-t-0 border-border" : ""}`}
    >
      <div className="font-serif text-3xl md:text-5xl font-medium tracking-tight text-ink tabular-nums">
        {prefix}
        {formatted}
        {suffix}
      </div>
      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
    </div>
  );
}

export function Stats() {
  const { ref, shown } = useReveal<HTMLDivElement>();
  const { switches, total } = useSwitches();

  const active = switches.filter((s) => s.status === "Active").length;
  const locked = switches.reduce((sum, s) => sum + s.balance, 0);

  const stats = [
    { label: "Switches created", value: total },
    { label: "Currently active", value: active },
    { label: "Stablecoins protected", value: locked, prefix: "$", decimals: 2 },
    { label: "Arc finality", value: 0.48, suffix: "s", decimals: 2 },
  ];

  return (
    <section className="border-y border-border bg-card/40">
      <div ref={ref} className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4 px-5">
        {stats.map((s, i) => (
          <Stat key={s.label} {...s} i={i} shown={shown} />
        ))}
      </div>
    </section>
  );
}
