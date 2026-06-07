const hre = require("hardhat");

async function main() {
  const { ethers, network } = hre;

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "No deployer account found. Set PRIVATE_KEY in your .env file."
    );
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Network:    ", network.name, `(chainId ${network.config.chainId})`);
  console.log("Deployer:   ", deployer.address);
  console.log("Gas balance:", ethers.formatEther(balance), "(native USDC)");

  if (balance === 0n) {
    throw new Error(
      "Deployer has 0 balance. Get testnet USDC from https://faucet.circle.com/ (select Arc Testnet)."
    );
  }

  const DMS = await ethers.getContractFactory("DeadMansSwitch");
  console.log("\nDeploying DeadMansSwitch...");
  const dms = await DMS.deploy();
  await dms.waitForDeployment();

  const address = await dms.getAddress();
  console.log("\n✅ DeadMansSwitch deployed at:", address);
  console.log("   Explorer: https://testnet.arcscan.app/address/" + address);
}

main().catch((error) => {
  console.error("\n❌ Deployment failed:");
  console.error(error.message || error);
  process.exitCode = 1;
});
