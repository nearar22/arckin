import { Logo } from "./Logo";

const CONTRACT = "0xFbb08c350aEc695fC55f1d4C0D945A4147a1915e";
const EXPLORER = "https://testnet.arcscan.app";

const cols = [
  {
    title: "Arc",
    links: [
      ["Arc website", "https://arc.network"],
      ["Explorer", EXPLORER],
      ["Faucet", "https://faucet.circle.com"],
    ],
  },
  {
    title: "Contract",
    links: [
      ["DeadMansSwitch", `${EXPLORER}/address/${CONTRACT}`],
      ["USDC token", `${EXPLORER}/address/0x3600000000000000000000000000000000000000`],
      ["EURC token", `${EXPLORER}/address/0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a`],
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-card/40 border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-16">
        <div className="grid gap-10 md:grid-cols-[1.6fr_repeat(2,_1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"><Logo size={22} /></div>
              <div className="font-serif text-lg font-semibold">ArcKin</div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 max-w-xs">
              An onchain inheritance vault for stablecoins. Built on Arc · Circle's USDC-native Layer-1.
            </p>
            <a
              href={`${EXPLORER}/address/${CONTRACT}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 hairline rounded-lg bg-background px-3 py-2 font-mono text-[11px] text-muted-foreground hover:text-foreground inline-block break-all transition-colors"
            >
              {CONTRACT.slice(0, 10)}…{CONTRACT.slice(-8)}
            </a>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-xs uppercase tracking-[0.15em] text-foreground font-medium">{c.title}</div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <div>© 2026 ArcKin · Open source · MIT</div>
          <div>Made for the Arc ecosystem · Not financial advice</div>
        </div>
      </div>
    </footer>
  );
}
