import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("EzPayModule", (m) => {
  const ezPay = m.contract("EzPay"); // Ensure this matches your contract name
  return { ezPay };
});