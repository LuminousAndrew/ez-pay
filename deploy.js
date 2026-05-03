import hre from "hardhat";
import { ethers } from "ethers";
import "dotenv/config";

async function main() {
  console.log("🚀 Initializing Deployment with Constructor Args...");

  const rpcUrl = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
  const privateKey = process.env.PRIVATE_KEY;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Deploying with account:", wallet.address);

  const artifact = await hre.artifacts.readArtifact("EzPay");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  // --- CONSTRUCTOR ARGUMENTS ---
  const payerAddress = wallet.address; 
  const payeeAddress = "0x8C9B1DC9B18289F45f8bdE98c05e31308489F81A"; // REPLACE THIS with a real address
  const depositAmount = ethers.parseEther("0.001"); // Sending 0.001 ETH to the escrow

  console.log(`⏳ Deploying EzPay (Payer: ${payerAddress}, Payee: ${payeeAddress})...`);

  // Pass args to deploy() + the { value } to trigger the 'payable' constructor
  const contract = await factory.deploy(payerAddress, payeeAddress, {
    value: depositAmount
  });
  
  console.log("Transaction Hash:", contract.deploymentTransaction().hash);
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("✅ EzPay deployed to:", address);
}

main().catch((error) => {
  console.error("❌ Deployment failed:");
  console.error(error);
  process.exit(1);
});