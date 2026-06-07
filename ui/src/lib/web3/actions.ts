import { parseUnits } from "viem";
import { useWriteContract, usePublicClient } from "wagmi";
import { deadMansSwitchAbi } from "./abi";
import { DEAD_MANS_SWITCH_ADDRESS, TOKENS, erc20Abi, type Currency } from "./chain";

export type Beneficiary = { account: `0x${string}`; sharesPct: number };

/**
 * Write actions against the DeadMansSwitch contract.
 * Each call sends the transaction AND waits for it to be mined, so callers
 * can show a success toast only once the operation is actually confirmed.
 */
export function useSwitchActions() {
  const { writeContractAsync, isPending } = useWriteContract();
  const publicClient = usePublicClient();

  async function confirm(hash: `0x${string}`) {
    if (publicClient) {
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      // waitForTransactionReceipt resolves even when the tx reverted on-chain,
      // so we must check the status and surface a failure ourselves.
      if (receipt.status === "reverted") {
        throw new Error("Transaction reverted on-chain.");
      }
    }
    return hash;
  }

  async function checkIn(id: number) {
    const hash = await writeContractAsync({
      address: DEAD_MANS_SWITCH_ADDRESS,
      abi: deadMansSwitchAbi,
      functionName: "checkIn",
      args: [BigInt(id)],
    });
    return confirm(hash);
  }

  async function release(id: number) {
    const hash = await writeContractAsync({
      address: DEAD_MANS_SWITCH_ADDRESS,
      abi: deadMansSwitchAbi,
      functionName: "release",
      args: [BigInt(id)],
    });
    return confirm(hash);
  }

  async function withdraw(id: number, amount: string, currency: Currency) {
    const units = parseUnits(amount, TOKENS[currency].decimals);
    const hash = await writeContractAsync({
      address: DEAD_MANS_SWITCH_ADDRESS,
      abi: deadMansSwitchAbi,
      functionName: "withdraw",
      args: [BigInt(id), units],
    });
    return confirm(hash);
  }

  async function deposit(id: number, amount: string, currency: Currency) {
    const token = TOKENS[currency];
    const units = parseUnits(amount, token.decimals);
    const approveHash = await writeContractAsync({
      address: token.address,
      abi: erc20Abi,
      functionName: "approve",
      args: [DEAD_MANS_SWITCH_ADDRESS, units],
    });
    await confirm(approveHash);
    const hash = await writeContractAsync({
      address: DEAD_MANS_SWITCH_ADDRESS,
      abi: deadMansSwitchAbi,
      functionName: "deposit",
      args: [BigInt(id), units],
    });
    return confirm(hash);
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
    const approveHash = await writeContractAsync({
      address: token.address,
      abi: erc20Abi,
      functionName: "approve",
      args: [DEAD_MANS_SWITCH_ADDRESS, units],
    });
    await confirm(approveHash);
    const hash = await writeContractAsync({
      address: DEAD_MANS_SWITCH_ADDRESS,
      abi: deadMansSwitchAbi,
      functionName: "createSwitch",
      args: [token.address, units, BigInt(intervalSeconds), bens],
    });
    return confirm(hash);
  }

  return { checkIn, release, withdraw, deposit, createSwitch, isPending };
}
