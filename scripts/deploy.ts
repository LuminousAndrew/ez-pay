// No top-level 'hre' import to avoid the empty object bug
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    // In 2026, Hardhat injects the 'hre' into the global scope
    // We grab it directly from there to bypass import issues
    const env = (global as any).hre || (await import("hardhat")).default || (await import("hardhat"));

    console.log("-----------------------------------------");
    console.log("🚀 Initializing Deployment...");

    if (!env || typeof env.run !== 'function') {
        console.log("⚠️  HRE not found in global. Trying 'require' fallback...");
        // If the ESM import is failing, we use the internal engine reference
        const { run, ethers } = (global as any);
        if (!run) throw new Error("Hardhat Runtime Environment not detected. Are you running with 'npx hardhat run'?");
    }

    try {
        console.log("📦 Compiling and Deploying...");
        
        // Use the injected ethers directly
        const factory = await (env.ethers as any).deployContract("EzPayFactory");

        console.log("⏳ Waiting for confirmation...");
        await factory.waitForDeployment();

        const address = await factory.getAddress();

        console.log("-----------------------------------------");
        console.log(`✅ SUCCESS: EzPayFactory live at: ${address}`);
        console.log("-----------------------------------------");
    } catch (err) {
        throw err;
    }
}

main().catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exitCode = 1;
});