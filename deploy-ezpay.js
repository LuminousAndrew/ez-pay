import hre from "hardhat";
import { IgnitionDeployer } from "@nomicfoundation/hardhat-ignition/dist/src/deployer.js";
import EzPayModule from "./ignition/modules/EzPay.js";

async function main() {
  console.log("🚀 Initializing Deep-Path Ignition Deployer...");

  // Manually setting up the deployer since the plugin won't auto-load
  const deployer = new IgnitionDeployer({
    hre,
    config: {},
    provider: hre.network.provider,
  });

  try {
    const result = await deployer.deploy(EzPayModule, {
      networkName: hre.network.name,
    });

    console.log("✅ Deployment Successful!");
    console.log(result);
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main();