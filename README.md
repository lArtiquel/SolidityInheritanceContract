Sure! Here's an improved version of your README file, with adjustments for clarity, accuracy, and completeness:

---

# Inheritance Smart Contract

## Task

Create an inheritance smart contract in Solidity. This smart contract should allow the owner to withdraw ETH from the contract. If the owner does not withdraw ETH from the contract for more than 1 month, an heir can take control of the contract and designate a new heir. It should be possible for the owner to withdraw 0 ETH just to reset the one-month counter.

## Prerequisites

- **Node.js**: Ensure you have Node.js installed (version 14 or higher is recommended).
- **NPM**: Node Package Manager comes with Node.js.
- **Hardhat**: A development environment for Ethereum smart contract developers.

## Installation

1. **Clone the Repository**

   ```bash
   git clone <repository_url>
   cd <repository_directory>
   ```

2. **Install Dependencies**

   Install the required npm packages:

   ```bash
   npm install
   ```

## Compile the Smart Contract

To compile the smart contract using Hardhat:

```bash
npx hardhat compile
```

Alternatively, if you have a script defined in your `package.json`, you can run:

```bash
npm run compile
```

## Running Tests

The project includes a comprehensive test suite to cover various scenarios and edge cases.

To run the tests:

```bash
npx hardhat test
```

Or if you have a script defined:

```bash
npm test
```

## Deployment to Sepolia Network

To deploy the contract to the Sepolia test network:

1. **Configure Network Settings**

   Ensure your `hardhat.config.js` file is set up with the appropriate network configurations, including the Sepolia network and your private key. Example configuration:

   ```javascript
   networks: {
     sepolia: {
       url: "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID",
       accounts: [`0x${YOUR_PRIVATE_KEY}`],
     },
   },
   ```

2. **Deploy the Contract**

   Run the deployment script:

   ```bash
   npx hardhat run scripts/deploy.ts --network sepolia
   ```

   or

   ```bash
   npm run deploy
   ```

## Deployment Output

After deployment, you should see output similar to:

```
Deploying contracts with the account: 0x62E52D55A6CD7dbd7Be8A9D855b3B78E198667DA
Contract deployed to address: 0x4D3dBE618Fe0B53c4092F385CBD038499BB7CdD0
```

The contract is verified and can be viewed at:

[Contract on Sourcify](https://repo.sourcify.dev/contracts/full_match/11155111/0x4D3dBE618Fe0B53c4092F385CBD038499BB7CdD0/)

## Interacting with the Contract

You can interact with the deployed contract using Etherscan, web3.js, ethers.js, or any Ethereum wallet that supports contract interactions.

### Basic Interaction Steps:

1. **Owner Withdrawals**

   - Call the `withdraw(uint256 amount)` function from the owner account.
   - To reset the inactivity counter without withdrawing funds, call `withdraw(0)`.

2. **Designate an Heir**

   - As the owner, call `designateHeir(address newHeir)` with the address of the heir.

3. **Heir Claims Inheritance**

   - After 30 days of owner inactivity, the designated heir can call `claimInheritance()` to become the new owner.
   - The new owner can then designate a new heir.
