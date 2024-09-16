import { ethers } from "hardhat";
import { expect } from "chai";
import { InheritanceContract } from "../typechain-types"; 
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("InheritanceContract", function () {
  let contract: InheritanceContract;
  let contractAddr: string;
  let owner: SignerWithAddress;
  let heir: SignerWithAddress;
  let other: SignerWithAddress;

  beforeEach(async function () {
    [owner, heir, other] = await ethers.getSigners();

    // Deploy the contract with a cast to the InheritanceContract type
    const contractFactory = await ethers.getContractFactory("InheritanceContract");

    contract = (await contractFactory.deploy()) as unknown as InheritanceContract;
    contractAddr = await contract.getAddress();
  });

  it("should deploy the contract correctly", async function () {
    expect(await contract.owner()).to.equal(owner.address);
    expect(await contract.lastWithdrawalTimestamp()).to.be.closeTo(Math.floor(Date.now() / 1000), 5);
  });

  it("should allow the owner to withdraw funds", async function () {
    // Send ETH to the contract
    await owner.sendTransaction({
      to: contractAddr,
      value: ethers.parseEther("1.0")
    });
  
    const initialBalance = await ethers.provider.getBalance(owner.address);
  
    // Withdraw funds from the contract
    await contract.connect(owner).withdraw(ethers.parseEther("0.5"));
  
    // Verify balances
    expect(await ethers.provider.getBalance(contractAddr)).to.equal(ethers.parseEther("0.5"));
    
    const finalBalance = await ethers.provider.getBalance(owner.address);
    expect(finalBalance).to.be.closeTo(initialBalance + ethers.parseEther("0.5"), ethers.parseUnits("0.01", "ether"));
    expect(await contract.lastWithdrawalTimestamp()).to.be.closeTo(Math.floor(Date.now() / 1000), 5);
  });  

  it("should prevent non-owners from withdrawing funds", async function () {
    await owner.sendTransaction({
      to: contractAddr,
      value: ethers.parseEther("1.0")
    });

    await expect(contract.connect(heir).withdraw(ethers.parseEther("0.5")))
      .to.be.revertedWith("Only the owner can call this function");
  });

  it("should only allow owner to designate an heir", async function () {
    await contract.connect(owner).designateHeir(heir.address);
    expect(await contract.heir()).to.equal(heir.address);

    await expect(contract.connect(heir).designateHeir(other.address))
      .to.be.revertedWith("Only the owner can call this function");
  });
  
  it("should allow the heir to claim inheritance after 30 days", async function () {
    await contract.connect(owner).designateHeir(heir.address);
  
    // Send ETH to the contract
    await owner.sendTransaction({
      to: contractAddr,
      value: ethers.parseEther("1.0")
    });
    await contract.connect(owner).withdraw(ethers.parseEther("0.5"));
  
    // Fast forward time to simulate 30 days passing after the withdrawal
    await ethers.provider.send('evm_increaseTime', [30 * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine', []);
  
    // Heir claims inheritance
    await contract.connect(heir).claimInheritance();
  
    // Verify state changes
    expect(await contract.owner()).to.equal(heir.address);
    expect(await contract.heir()).to.equal(ethers.ZeroAddress);
  });
  

  it("should not allow the heir to claim inheritance if 30 days have not passed", async function () {
    await contract.connect(owner).designateHeir(heir.address);

    await expect(contract.connect(heir).claimInheritance())
      .to.be.revertedWith("One month has not passed since the last withdrawal");
  });
});
