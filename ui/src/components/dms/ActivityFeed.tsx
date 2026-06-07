import { Heart, FilePlus2, ArrowDownToLine, ArrowUpFromLine, Send, Wallet, ExternalLink } from "lucide-react";
import { useChainEvents, type ChainActivity } from "@/lib/web3/events";
import { arcTestnet } from "@/lib/web3/chain";

const meta: Record<ChainActivity["kind"], { icon: any; tint: string }> = {
  Created:   { icon: FilePlus2, tint: "text-primary bg-primary-soft" },
  CheckedIn: { icon: Heart, tint: "text-success bg-success/15" },
  Deposited: { icon: ArrowDownToLine, tint: "text-primary bg-primary-soft" },
  Withdrawn: { icon: ArrowUpFromLine, tint: "text-gold bg-gold/15" },
  Released:  { icon: Send, tint: "text-rust bg-rust/15" },
  Paid:      { icon: Wallet, tint: "text-success bg-success/15" },
};

export function ActivityFeed() {
  const { activity, loading } = useChainEvents();

  return (
    <div className="hairline rounded-2xl bg-card shadow-[var(--shadow-soft)]">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-serif text-xl font-medium">Live activity</h3>
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> From Arc
        </span>
      </div>
      {loading && activity.length === 0 ? (
        <div className="px-6 py-10 text-sm text-muted-foreground text-center">Loading on-chain events…</div>
      ) : activity.length === 0 ? (
        <div className="px-6 py-10 text-sm text-muted-foreground text-center">No activity yet. Create a switch to begin.</div>
      ) : (
        <ul className="divide-y divide-border">
          {activity.slice(0, 8).map((a) => {
            const m = meta[a.kind];
            const Icon = m.icon;
            return (
              <li key={a.key} className="flex items-start gap-3 px-6 py-3.5 hover:bg-muted/40 transition-colors">
                <div className={`h-8 w-8 grid place-items-center rounded-full ${m.tint} shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{a.text}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">block {a.block.toString()}</div>
                </div>
                <a
                  href={`${arcTestnet.blockExplorers.default.url}/tx/${a.tx}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="View on explorer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
