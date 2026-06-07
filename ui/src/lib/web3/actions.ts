import { parseUnits } from "viem";
import { useWriteContract } from "wagmi";
import { deadMansSwitchAbi } from "./abi";
import { DEAD_MANS_SWITCH_ADDRESS, TOKENS, erc20Abi, type Currency } from "./chain";

export type Beneficiary = { account: `0x${string}`; sharesPct: number };

/** Write actions against the DeadMansSwitch contract. */
export function useSwitchActions() {
  const { writeContractAsync, isPending } = useWriteContract();

  async function checkIn(id: number) {
    return writeContractAsync({
      address: DEAD_MANS_SWITCH_ADDRESS,
      abi: deadMansSwitchAbi,
      functionName: "checkIn",
      args: [BigInt(id)],
    });
  }

  async function release(id: number) {
    return writeContractAsync({
      address: DEAD_MANS_SWITCH_ADDRESS,
      abi: deadMansSwitchAbi,
      functionName: "release",
      args: [BigInt(id)],
    });
  }

  async function withdraw(id: number, amount: string, currency: Currency) {
    const units = parseUnits(amount, TOKENS[currency].decimals);
    return writeContractAsync({
      address: DEAD_MANS_SWITCH_ADDRESS,
      abi: deadMansSwitchAbi,
      functionName: "withdraw",
      args: [BigInt(id), units],
    });
  }

  async function deposit(id: number, amount: string, currency: Currency) {
    const token = TOKENS[currency];
    const units = parseUnits(amount, token.decimals);
    await writeContractAsync({
      address: token.address,
      abi: erc20Abi,
      functionName: "approve",
      args: [DEAD_MANS_SWITCH_ADDRESS, units],
    });
    return writeContractAsync({
      address: DEAD_MANS_SWITCH_ADDRESS,
      abi: deadMansSwitchAbi,
      functionName: "deposit",
      args: [BigInt(id), units],
    });
  }

  async function createSwitch(
    currency: Currency,
    amount: string,
    intervalSeconds: number,
    beneficiaries: Beneficiary[]
  ) {
    const token = TOKENS[currency];
    const units = parseUnits(amount, token.decimals);
    const bens = beneficiaries.map((b) => ({
      account: b.account,
      shares: BigInt(Math.round(b.sharesPct * 100)), // % -> basis points
    }));
    await writeContractAsync({
      address: token.address,
      abi: erc20Abi,
      functionName: "approve",
      args: [DEAD_MANS_SWITCH_ADDRESS, units],
    });
    return writeContractAsync({
      address: DEAD_MANS_SWITCH_ADDRESS,
      abi: deadMansSwitchAbi,
      functionName: "createSwitch",
      args: [token.address, units, BigInt(intervalSeconds), bens],
    });
  }

  return { checkIn, release, withdraw, deposit, createSwitch, isPending };
}
