/**
 * WARSCAN Token Deployment via Clawncher SDK
 * Deploys on Base Mainnet with Uniswap V4
 */

import { ClawnchApiDeployer } from '@clawnch/clawncher-sdk';
import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// Fix BigInt JSON serialization globally
BigInt.prototype.toJSON = function () { return this.toString(); };

const PRIVATE_KEY = '0xfa0c2ad807a87a67b5a9909b2e2eee8587a28d492510d0288a357fdf74e6f313';

const account = privateKeyToAccount(PRIVATE_KEY);
console.log('🔑 Wallet:', account.address);

const wallet = createWalletClient({
    account,
    chain: base,
    transport: http('https://mainnet.base.org'),
});

const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org'),
});

const balance = await publicClient.getBalance({ address: account.address });
console.log('💰 Balance:', formatEther(balance), 'ETH');

// ── Register or reuse API key ──
console.log('\n📝 Getting API key...');
let apiKey;
try {
    const reg = await ClawnchApiDeployer.register(
        { wallet, publicClient },
        { name: 'WarScanAgent', wallet: account.address, description: 'WarScan intelligence platform' }
    );
    apiKey = reg.apiKey;
} catch (err) {
    if (err.message?.includes('already registered')) {
        // Use the key from first successful registration (cleaned of invisible chars)
        apiKey = 'clawnch_3834ba0e08306ee19665711209960835c140a65d1c98fe78763e6fb5a2c4e325';
        console.log('📌 Using stored API key');
    } else {
        throw err;
    }
}
console.log('✅ API key ready');

const deployer = new ClawnchApiDeployer({ apiKey, wallet, publicClient, network: 'mainnet' });

// ── Approve CLAWNCH ──
console.log('\n🔓 Approving CLAWNCH...');
try { await deployer.approveClawnch(); console.log('✅ Done'); }
catch (e) { console.log('ℹ️', e.message?.slice(0, 80)); }

// ── Deploy ──
console.log('\n🚀 Deploying WARSCAN...');
try {
    const result = await deployer.deploy({
        name: 'WarScan',
        symbol: 'WARSCAN',
        image: 'https://pbs.twimg.com/profile_images/2028937335581065216/Ucf07N82_400x400.jpg',
        metadata: {
            description: "WarScan is a real-time global intelligence platform that aggregates 40+ live data feeds — from NASA satellite fires and armed conflicts to submarine cable outages and cyber threats — into a single operational dashboard. The $WARSCAN token powers the platform's on-chain bounty system: users can create intelligence bounties, submit verified OSINT research reports, and earn rewards for actionable threat analysis. Every bounty is secured by a smart contract escrow on Base.",
            links: {
                website: 'https://www.warscan.space',
                twitter: 'https://x.com/War_Scan',
            },
        },
        tokenAdmin: account.address,
        rewards: {
            recipients: [{
                recipient: '0xF922fACCEbEC78C720408130D325661628Ac69b5',
                admin: '0xF922fACCEbEC78C720408130D325661628Ac69b5',
                bps: 8000,
                feePreference: 'Paired',
            }],
        },
        devBuy: {
            ethAmount: parseEther('0.02'),
            recipient: '0xF922fACCEbEC78C720408130D325661628Ac69b5',
        },
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 TOKEN DEPLOYED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 CA:', result.tokenAddress);
    if (result.poolAddress) console.log('🏊 Pool:', result.poolAddress);
    if (result.txHash) console.log('📜 TX:', result.txHash);
    console.log('🔗 https://basescan.org/token/' + result.tokenAddress);
    console.log('📊 https://dexscreener.com/base/' + result.tokenAddress);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
} catch (err) {
    console.error('\n❌ Failed:', err.message);
    if (err.cause) console.error('Cause:', JSON.stringify(err.cause));
    if (err.details) console.error('Details:', JSON.stringify(err.details));
    process.exit(1);
}
