import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  const InheritanceContract = await ethers.getContractFactory("InheritanceContract");
  const contract = await InheritanceContract.deploy();

  console.log(`Contract deployed to address: ${contract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
