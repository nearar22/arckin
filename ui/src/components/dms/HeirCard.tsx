import { fmtMoney, type Switch } from "@/lib/types";
import { Gift } from "lucide-react";
import { useAccount } from "wagmi";
import { useSwitchActions } from "@/lib/web3/actions";
import { toast } from "sonner";

function short(a: string) {
  if (a.startsWith("0x") && a.length > 14) return `${a.slice(0, 6)}…${a.slice(-4)}`;
  return a;
}

export function HeirCard({ s }: { s: Switch }) {
  const { address } = useAccount();
  const mine =
    s.beneficiaries.find(
      (b) => address && b.account.toLowerCase() === address.toLowerCase()
    ) ?? s.beneficiaries[0];
  const share = mine.shares / 10000;
  const willReceive = s.balance * share;
  const tripped = s.status === "Tripped";
  const { release, isPending } = useSwitchActions();
  const { isConnected } = useAccount();

  async function claim() {
    const t = toast.loading("Claiming inheritance…");
    try {
      await release(s.id);
      toast.success("Inheritance claimed.", {
        id: t,
        description: "Funds have been distributed to the beneficiaries.",
      });
    } catch (e: any) {
      const reason = e?.shortMessage || e?.message || "Claim failed.";
      toast.error("Could not claim", { id: t, description: reason });
    }
  }
  return (
    <article className="hairline lift lift-hover rounded-2xl bg-card p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">From owner</div>
          <div className="font-mono text-sm mt-1">{short(s.owner)}</div>
        </div>
        <span className={`hairline rounded-full px-2.5 py-1 text-xs ${tripped ? "bg-rust/15 text-rust border-rust/30" : "bg-success/15 text-success border-success/30"}`}>
          {tripped ? "Claimable" : "Active"}
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">You'd receive</div>
          <div className="font-serif text-4xl font-medium mt-1 tabular-nums">{fmtMoney(willReceive, s.currency)}</div>
          <div className="text-xs text-muted-foreground mt-1">{(share * 100).toFixed(0)}% of {fmtMoney(s.balance, s.currency)} {s.currency}</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs text-muted-foreground">
          {tripped ? "Switch silenced. Release is now available." : "Awaiting silence past the check-in deadline."}
        </div>
      </div>

      <button
        disabled={!tripped || !isConnected || isPending}
        onClick={claim}
        className="mt-5 lift lift-hover w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Gift className="h-4 w-4" /> {isPending ? "Claiming…" : "Claim inheritance"}
      </button>
    </article>
  );
}
