import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const FACTORY_ADDRESS = "0xEb34167C7f6e5465afF5A2275CEab9fa35d640ef";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const FACTORY_ABI = [
  "function createEscrow(address _payee, uint256 _amount) external",
  "function getEscrows() external view returns (address[])"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const EZPAY_ABI = [
  "function payee() view returns (address)",
  "function amount() view returns (uint256)",
  "function isReleased() view returns (bool)",
  "function release() external"
];

function App() {
  const [account, setAccount] = useState("");
  const [payeeInput, setPayeeInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function connect() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    }
  }

  async function handleLaunch(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

      // USDC uses 6 decimals
      const amountRaw = ethers.parseUnits(amountInput, 6);

      // STEP 1: Approve the Factory to take your USDC
      console.log("Approving USDC...");
      const approveTx = await usdc.approve(FACTORY_ADDRESS, amountRaw);
      await approveTx.wait();

      // STEP 2: Create the Escrow
      console.log("Creating Escrow...");
      const createTx = await factory.createEscrow(payeeInput, amountRaw);
      await createTx.wait();

      alert("Escrow Created Successfully!");
      loadEscrows();
    } catch (err) {
      alert("Error: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function loadEscrows() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
    const addresses = await factory.getEscrows();
    
    const details = await Promise.all(addresses.map(async (addr) => {
      const contract = new ethers.Contract(addr, EZPAY_ABI, provider);
      const [payee, amt, rel] = await Promise.all([
        contract.payee(),
        contract.amount(),
        contract.isReleased()
      ]);
      return { address: addr, payee, amount: ethers.formatUnits(amt, 6), released: rel };
    }));
    setEscrows(details.reverse());
  }

  async function releaseFunds(address) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(address, EZPAY_ABI, signer);
      const tx = await contract.release();
      await tx.wait();
      loadEscrows();
    } catch (err) { alert(err.message); }
  }

  useEffect(() => { if (account) loadEscrows(); }, [account]);

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial', maxWidth: '800px', margin: 'auto' }}>
      <h1>Balson Enterprises: USDC EzPay</h1>
      {!account ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {account}</p>
          <form onSubmit={handleLaunch} style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px' }}>
            <h3>New USDC Escrow</h3>
            <input placeholder="Payee Address" value={payeeInput} onChange={e => setPayeeInput(e.target.value)} style={{ width: '90%', marginBottom: '10px' }} />
            <input placeholder="Amount in USDC" value={amountInput} onChange={e => setAmountInput(e.target.value)} style={{ width: '90%', marginBottom: '10px' }} />
            <button type="submit" disabled={loading}>
              {loading ? "Processing (Approve + Create)..." : "Launch Escrow"}
            </button>
          </form>

          <h2>History</h2>
          {escrows.map((escrow, i) => (
            <div key={i} style={{ border: '1px solid #ddd', margin: '10px 0', padding: '10px' }}>
              <p>To: {escrow.payee} | <b>{escrow.amount} USDC</b></p>
              <button onClick={() => releaseFunds(escrow.address)} disabled={escrow.released}>
                {escrow.released ? "✅ Released" : "Release Funds"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;