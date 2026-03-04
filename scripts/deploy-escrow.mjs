/**
 * Deploy WarScanBountyEscrow to Base Mainnet
 * Passes the WARSCAN token address to the constructor
 */
import { ethers } from 'ethers';
import fs from 'fs';

const PRIVATE_KEY = '0xfa0c2ad807a87a67b5a9909b2e2eee8587a28d492510d0288a357fdf74e6f313';
const WARSCAN_TOKEN = '0xFEDAE2263C7AaC699c277d3F27b6E5B53feD8bA3';
const RPC_URL = 'https://mainnet.base.org';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

console.log('🔑 Deployer:', wallet.address);

const balance = await provider.getBalance(wallet.address);
console.log('💰 Balance:', ethers.formatEther(balance), 'ETH');

// Load the compiled artifact
const artifact = JSON.parse(fs.readFileSync('./src/contracts/WarScanBountyEscrow.json', 'utf8'));

console.log('\n🚀 Deploying WarScanBountyEscrow...');
console.log('   Token address:', WARSCAN_TOKEN);

const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
const contract = await factory.deploy(WARSCAN_TOKEN);

console.log('📜 TX Hash:', contract.deploymentTransaction()?.hash);
console.log('⏳ Waiting for confirmation...');

await contract.waitForDeployment();
const escrowAddress = await contract.getAddress();

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 ESCROW CONTRACT DEPLOYED!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📍 Escrow Address:', escrowAddress);
console.log('🔗 https://basescan.org/address/' + escrowAddress);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\nℹ️ Add to .env: VITE_ESCROW_ADDRESS=' + escrowAddress);
