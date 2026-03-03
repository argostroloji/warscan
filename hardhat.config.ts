import "@nomicfoundation/hardhat-ethers";

const config = {
    solidity: "0.8.24",
    networks: {
        baseSepolia: {
            type: "http",
            url: "https://sepolia.base.org",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        }
    }
};

export default config;
