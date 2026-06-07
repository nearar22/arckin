import { defineChain } from "viem";

/** Arc Testnet — Circle's USDC-native L1. */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  blockExplorers: {
    default: { name: "Arcscan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

export const DEAD_MANS_SWITCH_ADDRESS =
  "0xFbb08c350aEc695fC55f1d4C0D945A4147a1915e" as const;

export const USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000" as const;
export const EURC_ADDRESS =
  "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a" as const;

export type Currency = "USDC" | "EURC";

export const TOKENS: Record<
  Currency,
  { symbol: Currency; address: `0x${string}`; decimals: number; flag: string }
> = {
  USDC: { symbol: "USDC", address: USDC_ADDRESS, decimals: 6, flag: "🇺🇸" },
  EURC: { symbol: "EURC", address: EURC_ADDRESS, decimals: 6, flag: "🇪🇺" },
};

export function currencyByAddress(addr: string): Currency {
  return addr.toLowerCase() === EURC_ADDRESS.toLowerCase() ? "EURC" : "USDC";
}

/** Minimal ERC-20 ABI for balance / allowance / approve. */
export const erc20Abi = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
