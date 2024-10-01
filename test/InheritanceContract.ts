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

    // Deploy the contract
    const contractFactory = await ethers.getContractFactory(
      "InheritanceContract"
    );
    contract =
      (await contractFactory.deploy()) as unknown as InheritanceContract; // can't cast directly to InheritanceContract
    contractAddr = await contract.getAddress();
  });

  // Test 1: Should set the correct owner upon deployment
  it("should deploy the contract correctly", async function () {
    expect(await contract.owner()).to.equal(owner.address);

    // Verify lastWithdrawalTimestamp is updated
    const latestBlock = await ethers.provider.getBlock("latest");

    // Ensure latestBlock is not null
    if (!latestBlock) {
      throw new Error("Failed to fetch the latest block");
    }

    expect(Number(await contract.lastWithdrawalTimestamp())).to.be.closeTo(
      latestBlock.timestamp,
      5
    );
  });

  // Test 2: Owner can withdraw funds from the contract
  it("should allow the owner to withdraw funds", async function () {
    // Owner deposits 1 ether into the contract
    await owner.sendTransaction({
      to: contractAddr,
      value: ethers.parseEther("1.0"),
    });

    // Get owner's initial balance
    const initialBalance = await ethers.provider.getBalance(owner.address);

    // Owner withdraws 0.5 ether from the contract
    const tx = await contract.connect(owner).withdraw(ethers.parseEther("0.5"));
    await tx.wait();

    // Verify contract balance is reduced
    expect(await ethers.provider.getBalance(contractAddr)).to.equal(
      ethers.parseEther("0.5")
    );

    // Get owner's final balance
    const finalBalance = await ethers.provider.getBalance(owner.address);

    // Calculate the balance difference (as BigInt)
    const balanceDifference = finalBalance - initialBalance;

    // Since gas cost is deducted, balanceDifference should be approximately 0.5 ether minus gas cost.

    // We can assert that balanceDifference is greater than 0.49 ETH (assuming gas cost is less than 0.01 ETH)
    expect(balanceDifference).to.be.greaterThan(ethers.parseEther("0.49"));

    // Verify lastWithdrawalTimestamp is updated
    const latestBlock = await ethers.provider.getBlock("latest");

    // Ensure latestBlock is not null
    if (!latestBlock) {
      throw new Error("Failed to fetch the latest block");
    }

    expect(Number(await contract.lastWithdrawalTimestamp())).to.be.closeTo(
      latestBlock.timestamp,
      5
    );
  });

  // Test 3: Owner can designate an heir
  it("should allow the owner to designate an heir", async function () {
    await contract.connect(owner).designateHeir(heir.address);
    expect(await contract.heir()).to.equal(heir.address);
  });

  // Test 4: Heir can claim inheritance after 30 days
  it("should allow the heir to claim inheritance after 30 days", async function () {
    await contract.connect(owner).designateHeir(heir.address);

    // Fast forward time by 31 days
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    // Heir claims inheritance
    await contract.connect(heir).claimInheritance();

    // Verify state changes
    expect(await contract.owner()).to.equal(heir.address);
    expect(await contract.heir()).to.equal(ethers.ZeroAddress);
  });

  // Test 5: Non-owner cannot withdraw funds
  it("should prevent non-owners from withdrawing funds", async function () {
    await owner.sendTransaction({
      to: contractAddr,
      value: ethers.parseEther("1.0"),
    });

    await expect(
      contract.connect(heir).withdraw(ethers.parseEther("0.5"))
    ).to.be.revertedWith("Only the owner can call this function");
  });

  // Test 6: Non-heir cannot claim inheritance
  it("should not allow non-heir to claim inheritance", async function () {
    await contract.connect(owner).designateHeir(heir.address);

    // Fast forward time by 31 days
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    // Non-heir attempts to claim inheritance
    await expect(contract.connect(other).claimInheritance()).to.be.revertedWith(
      "Only the heir can claim inheritance"
    );
  });

  // Test 7: Heir cannot claim inheritance before 30 days
  it("should not allow the heir to claim inheritance before 30 days", async function () {
    await contract.connect(owner).designateHeir(heir.address);

    // Attempt to claim inheritance before 30 days
    await expect(contract.connect(heir).claimInheritance()).to.be.revertedWith(
      "One month has not passed since the last withdrawal"
    );
  });

  // Test 8: Owner can withdraw 0 ETH to reset the counter
  it("should reset the counter when owner withdraws 0 ETH", async function () {
    await contract.connect(owner).designateHeir(heir.address);

    // Owner withdraws 0 ETH to reset the counter
    await contract.connect(owner).withdraw(ethers.parseEther("0"));

    // Fast forward time by 15 days
    await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    // Heir attempts to claim inheritance and should fail
    await expect(contract.connect(heir).claimInheritance()).to.be.revertedWith(
      "One month has not passed since the last withdrawal"
    );
  });

  // Test 9: New owner can designate a new heir after inheritance is claimed
  it("new owner can designate a new heir after claiming inheritance", async function () {
    await contract.connect(owner).designateHeir(heir.address);

    // Fast forward time by 31 days
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    // Heir claims inheritance
    await contract.connect(heir).claimInheritance();

    // New owner designates a new heir
    await contract.connect(heir).designateHeir(other.address);
    expect(await contract.heir()).to.equal(other.address);
  });

  // Test 10: Previous owner cannot perform owner-only actions after inheritance is claimed
  it("previous owner cannot perform owner-only actions after inheritance is claimed", async function () {
    await contract.connect(owner).designateHeir(heir.address);

    // Fast forward time by 31 days
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    // Heir claims inheritance
    await contract.connect(heir).claimInheritance();

    // Previous owner attempts to withdraw funds
    await expect(
      contract.connect(owner).withdraw(ethers.parseEther("0.1"))
    ).to.be.revertedWith("Only the owner can call this function");

    // Previous owner attempts to designate a new heir
    await expect(
      contract.connect(owner).designateHeir(other.address)
    ).to.be.revertedWith("Only the owner can call this function");
  });

  // Test 11: Cannot claim inheritance when no heir is designated
  it("should not allow inheritance claim when no heir is designated", async function () {
    // Fast forward time by 31 days
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    // Non-owner attempts to claim inheritance
    await expect(contract.connect(other).claimInheritance()).to.be.revertedWith(
      "Only the heir can claim inheritance"
    );
  });

  // Test 12: Cannot claim inheritance when heir is address zero
  it("should not allow inheritance claim when heir is address zero", async function () {
    // Owner sets heir to address zero
    await contract.connect(owner).designateHeir(ethers.ZeroAddress);

    // Fast forward time by 31 days
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    // Any address attempts to claim inheritance
    await expect(contract.connect(other).claimInheritance()).to.be.revertedWith(
      "Only the heir can claim inheritance"
    );
  });

  // Test 13: Owner designates self as heir and claims inheritance
  it("owner designates self as heir and claims inheritance", async function () {
    // Owner designates self as heir
    await contract.connect(owner).designateHeir(owner.address);

    // Fast forward time by 31 days
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    // Owner claims inheritance
    await contract.connect(owner).claimInheritance();

    // Ownership remains unchanged
    expect(await contract.owner()).to.equal(owner.address);

    // Heir is reset to address zero
    expect(await contract.heir()).to.equal(ethers.ZeroAddress);

    // Confirm lastWithdrawalTimestamp is updated
    const latestBlock = await ethers.provider.getBlock("latest");
    expect(await contract.lastWithdrawalTimestamp()).to.be.closeTo(
      latestBlock.timestamp,
      5
    );
  });

  // Test 14: New owner can withdraw funds after inheritance is claimed
  it("new owner can withdraw funds after inheritance is claimed", async function () {
    // Owner deposits 1 ether into the contract
    await owner.sendTransaction({
      to: contractAddr,
      value: ethers.parseEther("1.0"),
    });

    // Owner designates heir
    await contract.connect(owner).designateHeir(heir.address);

    // Fast forward time by 31 days
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    // Heir claims inheritance
    await contract.connect(heir).claimInheritance();

    // New owner withdraws 0.5 ether
    await contract.connect(heir).withdraw(ethers.parseEther("0.5"));

    // Verify contract balance is reduced
    expect(await ethers.provider.getBalance(contractAddr)).to.equal(
      ethers.parseEther("0.5")
    );
  });

  // Test 15: Heir cannot claim inheritance again without being re-designated
  it("heir cannot claim inheritance again without being re-designated", async function () {
    // Owner designates heir
    await contract.connect(owner).designateHeir(heir.address);

    // Fast forward time and heir claims inheritance
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);
    await contract.connect(heir).claimInheritance();

    // Heir does not designate a new heir

    // Fast forward time again
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    // Heir attempts to claim inheritance again and fails
    await expect(contract.connect(heir).claimInheritance()).to.be.revertedWith(
      "Only the heir can claim inheritance"
    );
  });

  // Test 16: Withdraw after inheritance claim resets the counter
  it("withdraw after inheritance claim resets the counter", async function () {
    // Owner designates heir
    await contract.connect(owner).designateHeir(heir.address);

    // Heir claims inheritance after 31 days
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);
    await contract.connect(heir).claimInheritance();

    // New owner withdraws 0 ETH to reset the counter
    await contract.connect(heir).withdraw(ethers.parseEther("0"));

    // Fast forward time by less than 30 days
    await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    // Heir (now owner) attempts to claim inheritance again and fails
    await expect(contract.connect(heir).claimInheritance()).to.be.revertedWith(
      "One month has not passed since the last withdrawal"
    );
  });
});
