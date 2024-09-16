// SPDX-License-Identifier: MIT

pragma solidity ^0.8.21;

contract InheritanceContract {
    address public owner;
    address public heir;
    uint256 public lastWithdrawalTimestamp;

    constructor() {
        owner = msg.sender;
        lastWithdrawalTimestamp = block.timestamp;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    function withdraw(uint256 amount) public onlyOwner {
        require(amount <= address(this).balance, "Insufficient funds");
        payable(msg.sender).transfer(amount);
        lastWithdrawalTimestamp = block.timestamp;
    }

    function designateHeir(address newHeir) public onlyOwner {
        heir = newHeir;
    }

    function claimInheritance() public {
        require(block.timestamp - lastWithdrawalTimestamp >= 30 days, "One month has not passed since the last withdrawal");
        require(msg.sender == heir, "Only the heir can claim inheritance");
        owner = heir;
        heir = address(0);
    }

    // Add this receive function to accept ETH transfers
    receive() external payable {}
    
}