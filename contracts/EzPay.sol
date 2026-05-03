// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract EzPay {
    address public payer;
    address public payee;
    uint256 public amount;
    bool public isReleased;
    address public tokenAddress;

    constructor(address _payer, address _payee, uint256 _amount, address _token) {
        payer = _payer;
        payee = _payee;
        amount = _amount;
        tokenAddress = _token;
    }

    function release() external {
        require(msg.sender == payer, "Only payer can release");
        require(!isReleased, "Already released");

        isReleased = true;
        // Transfer the USDC from THIS contract to the PAYEE
        require(IERC20(tokenAddress).transfer(payee, amount), "Transfer failed");
    }
}