import { useMemo } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { deadMansSwitchAbi } from "./abi";
import { DEAD_MANS_SWITCH_ADDRESS, currencyByAddress } from "./chain";
import type { Switch, Status, Beneficiary } from "@/lib/types";

type RawSwitch = readonly [string, string, bigint, bigint, bigint, boolean];
type RawBens = readonly { account: string; shares: bigint }[];

function toStatus(released: boolean, lastCheckIn: bigint, interval: bigint): Status {
  if (released) return "Released";
  const now = Math.floor(Date.now() / 1000);
  const deadline = Number(lastCheckIn + interval);
  return now > deadline ? "Tripped" : "Active";
}

/** Reads every switch on-chain and maps it to the UI `Switch` shape. */
export function useSwitches() {
  const { data: count } = useReadContract({
    address: DEAD_MANS_SWITCH_ADDRESS,
    abi: deadMansSwitchAbi,
    functionName: "switchCount",
  });
  const total = count ? Number(count as bigint) : 0;

  const contracts = useMemo(() => {
    const arr: any[] = [];
    for (let i = 0; i < total; i++) {
      arr.push({
        address: DEAD_MANS_SWITCH_ADDRESS,
        abi: deadMansSwitchAbi,
        functionName: "getSwitch",
        args: [BigInt(i)],
      });
      arr.push({
        address: DEAD_MANS_SWITCH_ADDRESS,
        abi: deadMansSwitchAbi,
        functionName: "getBeneficiaries",
        args: [BigInt(i)],
      });
    }
    return arr;
  }, [total]);

  const { data: results, isLoading } = useReadContracts({
    contracts,
    query: { enabled: total > 0, refetchInterval: 8000 },
  });

  const switches: Switch[] = useMemo(() => {
    if (!results) return [];
    const out: Switch[] = [];
    for (let i = 0; i < total; i++) {
      const sw = results[i * 2];
      const bens = results[i * 2 + 1];
      if (sw?.status !== "success" || bens?.status !== "success") continue;
      const [owner, token, balance, checkInInterval, lastCheckIn, released] =
        sw.result as RawSwitch;
      const currency = currencyByAddress(token);
      const beneficiaries: Beneficiary[] = (bens.result as RawBens).map((b) => ({
        account: b.account,
        shares: Number(b.shares),
      }));
      out.push({
        id: i,
        owner,
        currency,
        balance: Number(balance) / 1e6,
        checkInInterval: Number(checkInInterval),
        lastCheckIn: Number(lastCheckIn),
        status: toStatus(released, lastCheckIn, checkInInterval),
        beneficiaries,
      });
    }
    return out.reverse();
  }, [results, total]);

  return { switches, total, isLoading };
}

/** Switches owned by the connected wallet. */
export function useMySwitches() {
  const { address } = useAccount();
  const { switches, isLoading } = useSwitches();
  const mine = useMemo(
    () =>
      address
        ? switches.filter((s) => s.owner.toLowerCase() === address.toLowerCase())
        : [],
    [switches, address]
  );
  return { switches: mine, isLoading };
}

/** Switches where the connected wallet is a beneficiary. */
export function useHeirSwitches() {
  const { address } = useAccount();
  const { switches, isLoading } = useSwitches();
  const heir = useMemo(
    () =>
      address
        ? switches.filter((s) =>
            s.beneficiaries.some(
              (b) => b.account.toLowerCase() === address.toLowerCase()
            )
          )
        : [],
    [switches, address]
  );
  return { switches: heir, isLoading };
}
