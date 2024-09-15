import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import { HardhatUserConfig } from 'hardhat/types';
import * as dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.21",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};

export default config;
