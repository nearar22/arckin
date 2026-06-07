import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function TestnetBanner() {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div className="border-b border-border bg-[color-mix(in_oklab,var(--gold)_18%,var(--background))]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-2 text-xs">
        <div className="flex items-center gap-2 text-foreground/90">
          <AlertTriangle className="h-3.5 w-3.5 text-rust" />
          <span><strong className="font-semibold">Arc Testnet</strong> · demo only, no real funds. Get test USDC from the faucet.</span>
        </div>
        <button onClick={() => setShow(false)} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
