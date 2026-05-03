import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const FACTORY_ADDRESS = "0xEb34167C7f6e5465afF5A2275CEab9fa35d640ef";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const FACTORY_ABI = ["function createEscrow(address _payee, uint256 _amount) external", "function getEscrows() external view returns (address[])"];
const ERC20_ABI = ["function approve(address spender, uint256 amount) external returns (bool)"];
const EZPAY_ABI = ["function payee() view returns (address)", "function amount() view returns (uint256)", "function isReleased() view returns (bool)", "function release() external"];

function App() {
  const [account, setAccount] = useState("");
  const [payeeInput, setPayeeInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(false);

  // High-End Obsidian Theme
  const theme = {
    accent: '#2155FF',
    bg: '#080808',
    card: '#111111',
    border: '#222222',
    textSecondary: '#666666'
  };

  const loadEscrows = useCallback(async () => {
    if (!window.ethereum || !account) return;
    try {
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
    } catch (err) { console.error("Load fail:", err); }
  }, [account]);

  async function connect() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    }
  }

  // Automatic refresh after transaction
  async function handleLaunch(e) {
    e.preventDefault();
    if (!amountInput || !payeeInput) return;
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      const amountRaw = ethers.parseUnits(amountInput, 6);

      const approveTx = await usdc.approve(FACTORY_ADDRESS, amountRaw);
      await approveTx.wait();

      const createTx = await factory.createEscrow(payeeInput, amountRaw);
      await createTx.wait();

      setPayeeInput(""); setAmountInput("");
      await loadEscrows(); // Auto-refresh list
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  }

  async function releaseFunds(address) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(address, EZPAY_ABI, signer);
      const tx = await contract.release();
      await tx.wait();
      await loadEscrows(); // Auto-refresh status
    } catch (err) { alert(err.message); }
  }

  useEffect(() => { 
    if (account) loadEscrows(); 
  }, [account, loadEscrows]);

  return (
    <div style={{ backgroundColor: theme.bg, color: '#fff', minHeight: '100vh', padding: '40px 20px', fontFamily: '"Inter", sans-serif' }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
          .glass-card { background: ${theme.card}; border: 1px solid ${theme.border}; transition: border 0.3s ease; }
          .glass-card:hover { border-color: #333; }
          .action-btn { background: #fff; color: #000; border: none; transition: opacity 0.2s ease; cursor: pointer; font-weight: 700; }
          .action-btn:hover { opacity: 0.8; }
          .action-btn:disabled { background: #222; color: #555; cursor: not-allowed; }
        `}
      </style>

      <div style={{ maxWidth: '600px', margin: 'auto' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
          <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-1px' }}>EZPAY</div>
          {!account ? (
            <button onClick={connect} className="action-btn" style={{ padding: '8px 20px', borderRadius: '4px' }}>Connect</button>
          ) : (
            <div style={{ fontSize: '12px', color: theme.textSecondary, border: `1px solid ${theme.border}`, padding: '6px 12px', borderRadius: '4px' }}>
              {account.slice(0,6)}...{account.slice(-4)}
            </div>
          )}
        </nav>

        <section className="glass-card" style={{ padding: '40px', borderRadius: '12px', marginBottom: '50px' }}>
          <form onSubmit={handleLaunch}>
            <div style={{ marginBottom: '20px' }}>
              <input 
                placeholder="Payee Address" 
                value={payeeInput} 
                onChange={e => setPayeeInput(e.target.value)} 
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${theme.border}`, padding: '12px 0', color: '#fff', fontSize: '16px', outline: 'none' }} 
              />
            </div>
            <div style={{ marginBottom: '40px' }}>
              <input 
                type="number"
                placeholder="Amount (USDC)" 
                value={amountInput} 
                onChange={e => setAmountInput(e.target.value)} 
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${theme.border}`, padding: '12px 0', color: '#fff', fontSize: '32px', fontWeight: '700', outline: 'none' }} 
              />
            </div>
            <button className="action-btn" disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: '8px', fontSize: '16px' }}>
              {loading ? "Processing..." : "Create Escrow"}
            </button>
          </form>
        </section>

        <div style={{ display: 'grid', gap: '12px' }}>
          <h3 style={{ fontSize: '12px', color: theme.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Escrows</h3>
          {escrows.map((escrow, i) => (
            <div key={i} className="glass-card" style={{ padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{escrow.amount} <span style={{ color: theme.textSecondary, fontSize: '12px' }}>USDC</span></div>
                <div style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '4px' }}>To: {escrow.payee.slice(0,8)}...</div>
              </div>
              <button 
                onClick={() => releaseFunds(escrow.address)}
                disabled={escrow.released}
                className="action-btn"
                style={{ 
                  background: escrow.released ? 'transparent' : '#fff',
                  color: escrow.released ? '#444' : '#000',
                  border: escrow.released ? `1px solid ${theme.border}` : 'none',
                  padding: '10px 18px', borderRadius: '6px', fontSize: '12px'
                }}
              >
                {escrow.released ? "Completed" : "Release"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;