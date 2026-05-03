// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./EzPay.sol";

// We need the interface here too to pull the USDC from your wallet
interface IERC20Factory {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract EscrowFactory {
    // Official Base Sepolia USDC Address
    address public constant USDC_ADDRESS = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address[] public allEscrows;

    function createEscrow(address _payee, uint256 _amount) external {
        // 1. Deploy the new EzPay contract with 4 arguments
        EzPay newEscrow = new EzPay(msg.sender, _payee, _amount, USDC_ADDRESS);
        
        // 2. Pull the USDC from YOUR wallet into the NEW Escrow contract
        // This requires you to call 'approve' in the frontend first!
        require(
            IERC20Factory(USDC_ADDRESS).transferFrom(msg.sender, address(newEscrow), _amount),
            "USDC Transfer Failed"
        );

        allEscrows.push(address(newEscrow));
    }

    function getEscrows() external view returns (address[] memory) {
        return allEscrows;
    }
}