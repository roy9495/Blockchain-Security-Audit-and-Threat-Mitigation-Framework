require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const forkingUrl = process.env.ALCHEMY_API_URL || process.env.INFURA_API_URL;

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: forkingUrl
      ? {
          forking: {
            url: forkingUrl,
            blockNumber: 17600000,
          },
        }
      : {},
  },
  paths: {
    sources: "./src",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};

