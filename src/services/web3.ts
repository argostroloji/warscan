import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import { mainnet, sepolia, base } from 'viem/chains';
import { watchAccount, disconnect } from '@wagmi/core';

// 1. Get projectId at https://cloud.walletconnect.com
// You can provide a real project ID later, but using a generic/test one for now
const projectId = 'b456cd3626e279ba86be8b60098bc5bb';

// 2. Create wagmiConfig
const metadata = {
    name: 'WarScan',
    description: 'WarScan Web3 Intelligence Dashboard',
    url: 'https://warscan.app', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [mainnet, sepolia, base] as const;
export const config = defaultWagmiConfig({
    chains,
    projectId,
    metadata,
});

// 3. Create Web3Modal instance
const modal = createWeb3Modal({
    wagmiConfig: config,
    projectId,
    enableAnalytics: false, // Optional
});

/**
 * Attaches the Web3Modal to the specified connect wallet button
 */
export function initWeb3WalletButton(buttonId: string) {
    const btn = document.getElementById(buttonId);
    if (!btn) {
        console.warn(`[Web3] Could not find button with ID ${buttonId}`);
        return;
    }

    // Handle click to open modal
    btn.addEventListener('click', () => {
        modal.open();
    });

    // Watch for account changes and update UI
    watchAccount(config, {
        onChange(account) {
            if (account.isConnected && account.address) {
                // Format address: 0x1234...5678
                const shortened = `${account.address.substring(0, 6)}...${account.address.substring(account.address.length - 4)}`;
                btn.textContent = shortened;
                btn.classList.add('connected');

                // Optional: click to disconnect when already connected
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    disconnect(config);
                };
            } else {
                btn.textContent = 'Connect Wallet';
                btn.classList.remove('connected');
                btn.onclick = null; // restore default behavior
            }
        },
    });
}
