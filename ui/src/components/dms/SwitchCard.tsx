import { useEffect, useState } from "react";
import { fmtCountdown, fmtMoney, intervalLabel, type Switch } from "@/lib/types";
import { useSwitchActions } from "@/lib/web3/actions";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { Heart, Send, TrendingUp, MinusCircle, Users } from "lucide-react";

function statusColor(status: Switch["status"]) {
  if (status === "Active") return "bg-success/15 text-success border-success/30";
  if (status === "Tripped") return "bg-rust/15 text-rust border-rust/30";
  return "bg-muted text-muted-foreground border-border";
}

/** Shorten a full 0x address; leave already-short / non-address labels as-is. */
function short(a: string) {
  if (a.startsWith("0x") && a.length > 14) return `${a.slice(0, 6)}…${a.slice(-4)}`;
  return a;
}

export function SwitchCard({ s }: { s: Switch }) {
  const deadline = s.lastCheckIn + s.checkInInterval;
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);
  const left = deadline - now;
  const pct = Math.min(100, Math.max(0, 100 * (1 - left / s.checkInInterval)));
  const ratio = left / s.checkInInterval;
  const timerColor = ratio > 0.5 ? "text-success" : ratio > 0.2 ? "text-gold" : "text-rust";
  const barColor = ratio > 0.5 ? "bg-success" : ratio > 0.2 ? "bg-gold" : "bg-rust";
  const [tab, setTab] = useState<"add" | "withdraw" | "edit">("add");
  const { checkIn, release, deposit, withdraw, isPending } = useSwitchActions();
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function run(
    fn: () => Promise<unknown>,
    msgs: { loading: string; success: string }
  ) {
    setMsg(null);
    const t = toast.loading(msgs.loading);
    try {
      await fn();
      toast.success(msgs.success, { id: t });
    } catch (e: any) {
      const reason = e?.shortMessage || e?.message || "Transaction failed.";
      toast.error("Transaction failed", { id: t, description: reason });
    }
  }

  return (
    <article className="hairline lift lift-hover rounded-2xl bg-card p-6 shadow-[var(--shadow-soft)]">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Switch</div>
          <div className="font-serif text-2xl font-medium">#{s.id}</div>
        </div>
        <span className={`hairline rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(s.status)}`}>
          {s.status}
        </span>
      </header>

      <div className="mt-5">
        <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">
          {s.status === "Tripped" ? "Past deadline" : "Time until silence"}
        </div>
        <div className={`font-serif text-4xl font-medium tabular-nums ${s.status === "Tripped" ? "text-rust" : timerColor}`}>
          {s.status === "Tripped" ? "Released" : fmtCountdown(left)}
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full transition-all ${s.status === "Tripped" ? "bg-rust" : barColor}`} style={{ width: `${s.status === "Tripped" ? 100 : pct}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>Last check-in {new Date(s.lastCheckIn * 1000).toLocaleDateString()}</span>
          <span>Every {intervalLabel(s.checkInInterval)}</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/60 p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Locked</div>
          <div className="mt-1 font-serif text-lg font-medium">{fmtMoney(s.balance, s.currency)} <span className="text-xs text-muted-foreground font-sans">{s.currency}</span></div>
        </div>
        <div className="rounded-lg bg-muted/60 p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Owner</div>
          <div className="mt-1 font-mono text-sm">{short(s.owner)}</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">
          <Users className="h-3 w-3" /> Beneficiaries
        </div>
        <ul className="space-y-2">
          {s.beneficiaries.map((b) => (
            <li key={b.account} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono truncate">{short(b.account)}{b.label && <span className="ml-2 text-muted-foreground font-sans text-xs">· {b.label}</span>}</span>
                  <span className="font-medium tabular-nums">{(b.shares / 100).toFixed(0)}%</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${b.shares / 100}%` }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {s.status === "Active" ? (
          <button
            disabled={!isConnected || isPending}
            onClick={() =>
              run(() => checkIn(s.id), {
                loading: "Confirming check-in…",
                success: "Checked in. You're alive — countdown reset.",
              })
            }
            className="lift lift-hover inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Heart className="h-3.5 w-3.5" /> {isPending ? "Confirming…" : "I'm alive"}
          </button>
        ) : s.status === "Tripped" ? (
          <button
            disabled={!isConnected || isPending}
            onClick={() =>
              run(() => release(s.id), {
                loading: "Releasing to beneficiaries…",
                success: "Released. Funds sent to the heirs.",
              })
            }
            className="lift lift-hover inline-flex items-center gap-1.5 rounded-full bg-rust px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> {isPending ? "Releasing…" : "Release to heirs"}
          </button>
        ) : null}
      </div>

      <details className="mt-4 group">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
          Manage panel
        </summary>
        <div className="mt-3 hairline rounded-xl bg-background p-4">
          <div className="flex gap-1 text-xs">
            {([
              ["add", "Add funds", TrendingUp],
              ["withdraw", "Withdraw", MinusCircle],
              ["edit", "Edit heirs", Users],
            ] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md ${tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="h-3 w-3" /> {label}
              </button>
            ))}
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            {tab === "edit" ? (
              <div>Update beneficiary list and shares (re-signs onchain). Use the dapp form to set new heirs.</div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={`Amount in ${s.currency}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="hairline flex-1 rounded-md bg-card px-3 py-2 text-sm text-foreground outline-none"
                />
                <button
                  disabled={!isConnected || isPending || !amount}
                  onClick={() =>
                    run(
                      () =>
                        tab === "add"
                          ? deposit(s.id, amount, s.currency)
                          : withdraw(s.id, amount, s.currency),
                      tab === "add"
                        ? {
                            loading: `Depositing ${amount} ${s.currency}…`,
                            success: `Deposited ${amount} ${s.currency}.`,
                          }
                        : {
                            loading: `Withdrawing ${amount} ${s.currency}…`,
                            success: `Withdrew ${amount} ${s.currency}.`,
                          }
                    ).then(() => setAmount(""))
                  }
                  className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {isPending ? "…" : tab === "add" ? "Deposit" : "Withdraw"}
                </button>
              </div>
            )}
          </div>
          {msg && <div className="mt-2 text-xs text-rust">{msg}</div>}
        </div>
      </details>
    </article>
  );
}
