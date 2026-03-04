/**
 * Bags.fm API Service - Solana token launch analytics
 */

export interface BagsToken {
    tokenMint: string;
    name: string;
    symbol: string;
    description: string;
    image: string;
    website?: string;
    twitter?: string;
    telegram?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    uri?: string;
    launchWallet?: string;
    launchSignature?: string;
}

export interface BagsTokenFees {
    tokenMint: string;
    lifetimeFees: string; // lamports as string
}

export interface BagsApiResponse<T> {
    success: boolean;
    response?: T;
    error?: string;
}

// Trending tokens from bags.fm website scrape/proxy 
export interface BagsTrendingToken {
    mint: string;
    name: string;
    symbol: string;
    image: string;
    price?: number;
    priceChange24h?: number;
    volume24h?: number;
    marketCap?: number;
    createdAt: string;
    url: string;
}

const BAGS_API_BASE = 'https://public-api-v2.bags.fm/api/v1';
const BAGS_API_KEY = 'bags_prod_MrTA6PLHSZXRG3D0DvpMLxpur7B0yxTN6vS3pLUJpww';

export class BagsApiService {
    private headers: Record<string, string>;

    constructor() {
        this.headers = {
            'x-api-key': BAGS_API_KEY,
            'Content-Type': 'application/json',
        };
    }

    /**
     * Fetch token lifetime fees
     */
    async getTokenLifetimeFees(tokenMint: string): Promise<string | null> {
        try {
            const res = await fetch(
                `${BAGS_API_BASE}/token-launch/lifetime-fees?tokenMint=${tokenMint}`,
                { headers: this.headers }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: BagsApiResponse<string> = await res.json();
            return data.success ? (data.response || '0') : null;
        } catch (err) {
            console.warn('[BagsAPI] Failed to fetch lifetime fees', err);
            return null;
        }
    }

    /**
     * Fetch trending/recent tokens from Bags
     * Uses a lightweight proxy or fallback data
     */
    async getTrendingTokens(): Promise<BagsTrendingToken[]> {
        try {
            // Bags doesn't have a direct "trending" endpoint in their public API yet.
            // We'll use the Bags website feed as a data source via our API proxy.
            const res = await fetch('/api/bags/trending');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.tokens || [];
        } catch (err) {
            console.warn('[BagsAPI] Trending fetch failed, using fallback');
            return this.getFallbackTokens();
        }
    }

    /**
     * Fallback data when API is unavailable
     */
    private getFallbackTokens(): BagsTrendingToken[] {
        return [
            {
                mint: 'WARSCAN_MINT_PENDING',
                name: 'WarScan',
                symbol: 'WARSCAN',
                image: 'https://pbs.twimg.com/profile_images/2028937335581065216/Ucf07N82_400x400.jpg',
                createdAt: new Date().toISOString(),
                url: 'https://bags.fm',
            },
        ];
    }
}

export const bagsApi = new BagsApiService();
