import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChainEvents } from "@/lib/web3/events";

export function ValueChart() {
  const { series } = useChainEvents();
  const data = series.length > 0 ? series : [{ t: "#0", v: 0 }];
  const latest = data[data.length - 1].v;
  const first = data[0].v || 1;
  const delta = ((latest - first) / first) * 100;

  return (
    <div className="hairline rounded-2xl bg-card p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total value locked</div>
          <div className="font-serif text-3xl font-medium mt-1 tabular-nums">
            ${latest.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
        {series.length > 1 && (
          <div className={`text-sm font-medium ${delta >= 0 ? "text-success" : "text-rust"}`}>
            {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%
          </div>
        )}
      </div>
      <div className="h-48">
        {series.length === 0 ? (
          <div className="h-full grid place-items-center text-sm text-muted-foreground">
            No value locked yet. Create a switch to start the chart.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" hide />
              <YAxis hide domain={[0, "dataMax + 100"]} />
              <Tooltip
                cursor={{ stroke: "var(--border)" }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--muted-foreground)" }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "TVL"]}
              />
              <Area type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
