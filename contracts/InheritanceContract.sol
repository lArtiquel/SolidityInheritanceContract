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
        // The transfer function will handle the balance check
        payable(msg.sender).transfer(amount);
        lastWithdrawalTimestamp = block.timestamp; // Reset the timestamp on withdrawal
    }

    function designateHeir(address newHeir) public onlyOwner {
        heir = newHeir;
    }

    function claimInheritance() public {
        require(block.timestamp - lastWithdrawalTimestamp >= 30 days, "One month has not passed since the last withdrawal");
        require(msg.sender == heir, "Only the heir can claim inheritance");

        // Transfer ownership and reset the withdrawal timestamp
        owner = heir;
        heir = address(0);
        lastWithdrawalTimestamp = block.timestamp; // Reset timestamp after inheritance is claimed
    }

    // Function to accept ETH transfers
    receive() external payable {}
}
