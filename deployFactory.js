import hre from "hardhat";
import { ethers } from "ethers";
import "dotenv/config";

async function main() {
  const rpcUrl = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
  const privateKey = process.env.PRIVATE_KEY;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("🚀 Deploying EscrowFactory...");

  const artifact = await hre.artifacts.readArtifact("contracts/EscrowFactory.sol:EscrowFactory");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  const contract = await factory.deploy();
  await contract.waitForDeployment();
  
  console.log("✅ Factory deployed to:", await contract.getAddress());
}

main().catch(console.error);