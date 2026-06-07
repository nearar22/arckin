import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { deadMansSwitchAbi } from "./abi";
import { DEAD_MANS_SWITCH_ADDRESS, currencyByAddress } from "./chain";

export type ChainActivity = {
  key: string;
  kind: "Created" | "CheckedIn" | "Deposited" | "Withdrawn" | "Released" | "Paid";
  text: string;
  block: bigint;
  tx: string;
};

const fmt = (v: bigint) =>
  (Number(v) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 });
const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** Reads all contract events and derives activity + value-over-time + totals. */
export function useChainEvents(refreshMs = 12000) {
  const client = usePublicClient();
  const [activity, setActivity] = useState<ChainActivity[]>([]);
  const [series, setSeries] = useState<{ t: string; v: number }[]>([]);
  const [paidTotal, setPaidTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!client) return;
      try {
        const logs = await client.getContractEvents({
          address: DEAD_MANS_SWITCH_ADDRESS,
          abi: deadMansSwitchAbi,
          fromBlock: "earliest",
          toBlock: "latest",
        });

        const acts: ChainActivity[] = [];
        const pts: { t: string; v: number }[] = [];
        const tokenById: Record<string, string> = {};
        let running = 0;
        let paid = 0;

        for (const log of logs) {
          const name = (log as any).eventName as string;
          const args = (log as any).args ?? {};
          if (name === "SwitchCreated" && args.token != null) {
            tokenById[String(args.id)] = currencyByAddress(args.token);
          }
          const sym = tokenById[String(args.id)] ?? "USDC";
          const block = log.blockNumber ?? 0n;
          const tx = log.transactionHash ?? "";
          let text = "";
          let valueDelta = 0;

          switch (name) {
            case "SwitchCreated":
              text = `Switch #${args.id} created · ${fmt(args.amount)} ${sym}`;
              valueDelta = Number(args.amount) / 1e6;
              break;
            case "CheckedIn":
              text = `Switch #${args.id} checked in`;
              break;
            case "Deposited":
              text = `Deposit · ${fmt(args.amount)} ${sym}`;
              valueDelta = Number(args.amount) / 1e6;
              break;
            case "Withdrawn":
              text = `Withdraw · ${fmt(args.amount)} ${sym}`;
              valueDelta = -Number(args.amount) / 1e6;
              break;
            case "Released":
              text = `Released · switch #${args.id}`;
              valueDelta = -Number(args.totalAmount) / 1e6;
              break;
            case "Paid":
              text = `${shortAddr(args.beneficiary)} received ${fmt(args.amount)} ${sym}`;
              paid += Number(args.amount) / 1e6;
              break;
            default:
              continue;
          }

          if (valueDelta !== 0) {
            running = Math.max(0, running + valueDelta);
            pts.push({ t: `#${block}`, v: running });
          }
          acts.push({
            key: `${tx}-${(log as any).logIndex}`,
            kind: name as ChainActivity["kind"],
            text,
            block,
            tx,
          });
        }

        if (!cancelled) {
          setActivity(acts.reverse());
          setSeries(pts);
          setPaidTotal(paid);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [client, refreshMs]);

  return { activity, series, paidTotal, loading };
}
