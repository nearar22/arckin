import { useState } from "react";
import { useAccount } from "wagmi";
import { CreateSwitchForm } from "./CreateSwitchForm";
import { SwitchCard } from "./SwitchCard";
import { HeirCard } from "./HeirCard";
import { ValueChart } from "./ValueChart";
import { ActivityFeed } from "./ActivityFeed";
import { Reveal } from "./Reveal";
import { useMySwitches, useHeirSwitches } from "@/lib/web3/hooks";
import { Bot } from "lucide-react";

export function AppSection() {
  const [tab, setTab] = useState<"owner" | "heir">("owner");
  const { isConnected } = useAccount();
  const { switches: ownerList } = useMySwitches();
  const { switches: heirList } = useHeirSwitches();
  return (
    <section id="app" className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-20 md:py-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-primary">The vault</div>
            <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight mt-2">Your switches</h2>
          </div>
          <div className="hairline inline-flex rounded-full bg-card p-1">
            <button
              onClick={() => setTab("owner")}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${tab === "owner" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              My switches
            </button>
            <button
              onClick={() => setTab("heir")}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${tab === "heir" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              I'm a heir
            </button>
          </div>
        </div>

        {tab === "owner" ? (
          <div className="space-y-8 animate-fade-up">
            <div className="hairline rounded-2xl bg-primary-soft/60 p-5 flex items-start gap-4">
              <div className="h-10 w-10 grid place-items-center rounded-full bg-primary text-primary-foreground shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="text-sm">
                <div className="font-medium">Release is automated.</div>
                <div className="text-muted-foreground mt-1">
                  A keeper bot (Chainlink Automation in production) calls <code className="font-mono text-xs">release()</code> the second your switch trips. You don't need to click anything. Your heirs are paid out automatically.
                </div>
              </div>
            </div>

            <CreateSwitchForm />

            <div>
              <h3 className="font-serif text-2xl font-medium mb-4">Active vaults</h3>
              {ownerList.length === 0 ? (
                <div className="hairline rounded-2xl bg-card p-10 text-center text-muted-foreground">
                  {isConnected
                    ? "No switches yet. Create one above to lock funds and name your heirs."
                    : "Connect your wallet to see the switches you own."}
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {ownerList.map((s, i) => (
                    <Reveal key={s.id} delay={i * 100}>
                      <SwitchCard s={s} />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <Reveal><ValueChart /></Reveal>
              <Reveal delay={120}><ActivityFeed /></Reveal>
            </div>
          </div>
        ) : (
          <div className="animate-fade-up">
            <p className="text-muted-foreground max-w-2xl mb-8">
              Switches where your connected address is listed as a beneficiary. When a switch goes silent past its check-in window, you can claim your share onchain.
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              {heirList.length === 0 ? (
                <div className="hairline rounded-2xl bg-card p-10 text-center text-muted-foreground md:col-span-2">
                  {isConnected
                    ? "You're not named as a beneficiary on any switch yet."
                    : "Connect your wallet to see inheritances left to you."}
                </div>
              ) : (
                heirList.map((s) => <HeirCard key={s.id} s={s} />)
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
