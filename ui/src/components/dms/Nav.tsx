import { ThemeToggle } from "./ThemeToggle";
import { Wallet } from "lucide-react";
import { Logo } from "./Logo";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { arcTestnet } from "@/lib/web3/chain";

function short(a?: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

export function Nav() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const wrongChain = isConnected && chainId !== arcTestnet.id;

  function onClick() {
    if (!isConnected) {
      const c = connectors[0];
      if (c) connect({ connector: c });
    } else if (wrongChain) {
      switchChain({ chainId: arcTestnet.id });
    } else {
      disconnect();
    }
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/75 border-b border-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <a href="#top" className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Logo size={22} />
          </div>
          <div className="leading-tight">
            <div className="font-serif text-lg font-semibold tracking-tight">ArcKin</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              on Arc · USDC native
            </div>
          </div>
        </a>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#why-arc" className="hover:text-foreground transition-colors">Why Arc</a>
          <a href="#app" className="hover:text-foreground transition-colors">App</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={onClick}
            className={`lift lift-hover inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
              wrongChain ? "bg-rust text-white" : "bg-primary text-primary-foreground"
            }`}
          >
            <Wallet className="h-4 w-4" />
            {isPending
              ? "Connecting…"
              : wrongChain
              ? "Switch to Arc"
              : isConnected
              ? short(address)
              : "Connect wallet"}
          </button>
        </div>
      </div>
    </header>
  );
}
