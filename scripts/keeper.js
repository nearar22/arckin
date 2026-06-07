/**
 * Dead Man's Switch — Keeper
 *
 * A small automation worker that watches every switch on-chain and, the moment
 * one passes its check-in deadline, calls `release()` so the locked USDC flows
 * to the beneficiaries automatically — with no human clicking anything.
 *
 * In production this role is filled by a decentralized keeper network such as
 * Chainlink Automation or Gelato. This script does the same job locally so you
 * can see the behavior end-to-end on Arc Testnet.
 *
 * Run:  npm run keeper
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const POLL_MS = Number(process.env.KEEPER_POLL_MS || 15000); // check every 15s

function loadDeployment() {
  const p = path.join(__dirname, "..", "deployments", "arcTestnet.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function ts() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

async function main() {
  const { ethers } = hre;

  const deployment = loadDeployment();
  const address = deployment.contracts.DeadMansSwitch;

  const [keeper] = await ethers.getSigners();
  if (!keeper) {
    throw new Error("No keeper account. Set PRIVATE_KEY in .env.");
  }

  const dms = await ethers.getContractAt("DeadMansSwitch", address, keeper);

  const bal = await ethers.provider.getBalance(keeper.address);
  console.log("──────────────────────────────────────────────");
  console.log("  Dead Man's Switch — Keeper");
  console.log("──────────────────────────────────────────────");
  console.log("  Contract:", address);
  console.log("  Keeper:  ", keeper.address);
  console.log("  Gas:     ", ethers.formatEther(bal), "USDC");
  console.log("  Polling: ", `every ${POLL_MS / 1000}s`);
  console.log("──────────────────────────────────────────────\n");

  // Avoid sending release() twice while a tx is still pending.
  const inFlight = new Set();

  async function tick() {
    try {
      const count = Number(await dms.switchCount());
      if (count === 0) {
        console.log(`[${ts()}] no switches yet`);
        return;
      }

      for (let id = 0; id < count; id++) {
        if (inFlight.has(id)) continue;

        const s = await dms.getSwitch(id);
        // getSwitch returns: owner, token, balance, checkInInterval, lastCheckIn, released
        const balance = s[2];
        const released = s[5];
        if (released || balance === 0n) continue;

        const tripped = await dms.isTripped(id);
        if (!tripped) {
          const left = await dms.timeLeft(id);
          console.log(`[${ts()}] switch #${id} active — ${left}s until release`);
          continue;
        }

        // Tripped and still funded → release it automatically.
        console.log(`[${ts()}] switch #${id} TRIPPED → releasing…`);
        inFlight.add(id);
        try {
          const tx = await dms.release(id);
          console.log(`[${ts()}] switch #${id} release tx: ${tx.hash}`);
          const receipt = await tx.wait();
          console.log(
            `[${ts()}] ✅ switch #${id} released in block ${receipt.blockNumber} — funds sent to beneficiaries`
          );
        } catch (err) {
          // If someone else released it first, just move on.
          const msg = err.shortMessage || err.message || String(err);
          console.log(`[${ts()}] switch #${id} release skipped: ${msg}`);
        } finally {
          inFlight.delete(id);
        }
      }
    } catch (err) {
      console.error(`[${ts()}] poll error:`, err.shortMessage || err.message || err);
    }
  }

  await tick();
  setInterval(tick, POLL_MS);
}

main().catch((e) => {
  console.error("Keeper failed:", e.message || e);
  process.exitCode = 1;
});
