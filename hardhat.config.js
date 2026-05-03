import "dotenv/config";

export default {
  solidity: "0.8.24",
  networks: {
    "base-sepolia": {
      type: "http", 
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};