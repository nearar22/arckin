import { useMemo, useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import type { Currency } from "@/lib/types";
import { isAddress, formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { useSwitchActions } from "@/lib/web3/actions";
import { TOKENS } from "@/lib/web3/chain";
import { toast } from "sonner";

interface Row { account: string; shares: string }

const balanceAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const intervals = [
  { label: "1 minute", value: 60 },
  { label: "1 hour", value: 3600 },
  { label: "1 day", value: 86400 },
  { label: "1 week", value: 604800 },
  { label: "30 days", value: 2592000 },
  { label: "1 year", value: 31536000 },
];

export function CreateSwitchForm() {
  const [amount, setAmount] = useState("1000");
  const [currency, setCurrency] = useState<Currency>("USDC");
  const [interval, setInterval] = useState(2592000);
  const [rows, setRows] = useState<Row[]>([
    { account: "", shares: "60" },
    { account: "", shares: "40" },
  ]);

  const total = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.shares) || 0), 0),
    [rows],
  );
  const valid = total === 100;

  const { address, isConnected } = useAccount();
  const { createSwitch, isPending } = useSwitchActions();
  const [msg, setMsg] = useState<string | null>(null);

  // Live balance of the selected token for the connected wallet.
  const { data: balanceRaw } = useReadContract({
    address: TOKENS[currency].address,
    abi: balanceAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const balance = balanceRaw !== undefined
    ? Number(formatUnits(balanceRaw as bigint, TOKENS[currency].decimals))
    : undefined;
  const insufficient =
    balance !== undefined && Number(amount) > balance;

  async function handleCreate() {
    setMsg(null);
    if (!isConnected) {
      toast.error("Connect your wallet first.");
      return;
    }
    if (!valid) {
      toast.error("Shares must total 100%.");
      return;
    }
    if (insufficient) {
      toast.error("Not enough balance", {
        description: `You have ${balance?.toLocaleString()} ${currency}, but tried to lock ${amount}.`,
      });
      return;
    }
    for (const r of rows) {
      if (!isAddress(r.account)) {
        toast.error("Invalid beneficiary address", { description: r.account || "(empty)" });
        return;
      }
    }
    const t = toast.loading("Confirm the two transactions in your wallet…");
    try {
      await createSwitch(
        currency,
        amount,
        interval,
        rows.map((r) => ({ account: r.account as `0x${string}`, sharesPct: Number(r.shares) }))
      );
      toast.success("Switch created!", {
        id: t,
        description: `${amount} ${currency} locked. It will appear in your vaults shortly.`,
      });
      setMsg(null);
    } catch (e: any) {
      const reason = e?.shortMessage || e?.message || "Transaction failed.";
      toast.error("Could not create switch", { id: t, description: reason });
      setMsg(null);
    }
  }

  return (
    <div className="hairline rounded-2xl bg-card p-6 md:p-8 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl font-medium">Create a new switch</h3>
        <span className="text-xs text-muted-foreground">Step 1 of 1</span>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label className="block text-xs uppercase tracking-[0.12em] text-muted-foreground mb-2">Amount to lock</label>
          <div className="flex hairline rounded-lg overflow-hidden bg-background">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent px-4 py-3 text-lg font-medium outline-none"
              inputMode="decimal"
            />
            <div className="flex items-center pr-2 gap-1">
              {(["USDC", "EURC"] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`text-xs px-3 py-1.5 rounded-md ${currency === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {c === "USDC" ? "🇺🇸 USDC" : "🇪🇺 EURC"}
                </button>
              ))}
            </div>
          </div>
          {balance !== undefined && (
            <div className={`mt-1.5 text-xs ${insufficient ? "text-rust" : "text-muted-foreground"}`}>
              Balance: {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
              {insufficient && " · not enough to lock this amount"}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.12em] text-muted-foreground mb-2">Check-in interval</label>
          <select
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            className="hairline w-full rounded-lg bg-background px-4 py-3 text-base outline-none"
          >
            {intervals.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-7">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Beneficiaries</label>
          <button
            onClick={() => setRows([...rows, { account: "", shares: "0" }])}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Add heir
          </button>
        </div>
        <div className="space-y-2">
          {rows.map((r, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_90px_36px] gap-2">
              <input
                placeholder="0x address"
                value={r.account}
                onChange={(e) => {
                  const c = [...rows]; c[idx].account = e.target.value; setRows(c);
                }}
                className="hairline rounded-lg bg-background px-3 py-2.5 text-sm font-mono outline-none"
              />
              <div className="hairline flex items-center rounded-lg bg-background px-3">
                <input
                  value={r.shares}
                  onChange={(e) => {
                    const c = [...rows]; c[idx].shares = e.target.value; setRows(c);
                  }}
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                  inputMode="decimal"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              <button
                onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                className="hairline rounded-lg text-muted-foreground hover:text-destructive grid place-items-center"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Shares total</span>
            <span className={valid ? "text-success font-medium" : "text-rust font-medium"}>
              {total}% / 100%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all ${valid ? "bg-success" : "bg-rust"}`}
              style={{ width: `${Math.min(100, total)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <button
          disabled={!valid || !isConnected || isPending || insufficient}
          onClick={handleCreate}
          className="lift lift-hover inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="h-4 w-4" />
          {isPending ? "Confirming…" : insufficient ? "Insufficient balance" : "Approve & create switch"}
        </button>
        {!isConnected && (
          <span className="text-xs text-muted-foreground">Connect your wallet to create.</span>
        )}
      </div>
      {msg && <div className="mt-3 text-sm text-muted-foreground">{msg}</div>}
    </div>
  );
}
