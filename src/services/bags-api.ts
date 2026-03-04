/**
 * Bags.fm API Service - Solana token launch analytics
 * Uses DexScreener API for live token data (free, no API key needed)
 */

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

const DEXSCREENER_SEARCH_URL = 'https://api.dexscreener.com/latest/dex/search?q=';

export class BagsApiService {
    private cache: BagsTrendingToken[] | null = null;
    private cacheTime = 0;
    private readonly CACHE_TTL = 60_000; // 1 minute cache

    /**
     * Fetch trending Solana tokens from DexScreener
     * Searches for recently launched tokens on Meteora (Bags.fm uses Meteora pools)
     */
    async getTrendingTokens(): Promise<BagsTrendingToken[]> {
        // Return cache if fresh
        if (this.cache && Date.now() - this.cacheTime < this.CACHE_TTL) {
            return this.cache;
        }

        try {
            // Search DexScreener for Solana tokens on Meteora (Bags.fm platform)
            const res = await fetch(`${DEXSCREENER_SEARCH_URL}bags.fm`, {
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            const pairs = data.pairs || [];
            const seen = new Set<string>();
            const tokens: BagsTrendingToken[] = [];

            for (const pair of pairs) {
                if (pair.chainId !== 'solana') continue;
                const addr = pair.baseToken?.address;
                if (!addr || seen.has(addr)) continue;
                seen.add(addr);

                tokens.push({
                    mint: addr,
                    name: pair.baseToken.name || 'Unknown',
                    symbol: pair.baseToken.symbol || '???',
                    image: pair.info?.imageUrl || '',
                    price: pair.priceUsd ? parseFloat(pair.priceUsd) : undefined,
                    priceChange24h: pair.priceChange?.h24 ?? undefined,
                    volume24h: pair.volume?.h24 ?? undefined,
                    marketCap: pair.marketCap ?? pair.fdv ?? undefined,
                    createdAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : new Date().toISOString(),
                    url: pair.url || `https://dexscreener.com/solana/${addr}`,
                });
            }

            // Sort by market cap descending
            tokens.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));

            // If no results from search, also try latest token profiles
            if (tokens.length === 0) {
                return this.getLatestProfiles();
            }

            this.cache = tokens.slice(0, 20);
            this.cacheTime = Date.now();
            return this.cache;
        } catch (err) {
            console.warn('[BagsAPI] DexScreener fetch failed, trying latest profiles', err);
            return this.getLatestProfiles();
        }
    }

    /**
     * Fallback: get latest token profiles from DexScreener
     */
    private async getLatestProfiles(): Promise<BagsTrendingToken[]> {
        try {
            const res = await fetch('https://api.dexscreener.com/token-profiles/latest/v1', {
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const profiles = await res.json();

            const solanaProfiles = (profiles || [])
                .filter((p: any) => p.chainId === 'solana')
                .slice(0, 15);

            const tokens: BagsTrendingToken[] = solanaProfiles.map((p: any) => ({
                mint: p.tokenAddress,
                name: p.description?.slice(0, 30) || p.tokenAddress.slice(0, 8),
                symbol: p.tokenAddress.slice(0, 6).toUpperCase(),
                image: p.icon || '',
                createdAt: new Date().toISOString(),
                url: p.links?.[0]?.url || `https://dexscreener.com/solana/${p.tokenAddress}`,
            }));

            this.cache = tokens;
            this.cacheTime = Date.now();
            return tokens;
        } catch (err) {
            console.warn('[BagsAPI] Latest profiles fetch failed, using fallback');
            return this.getFallbackTokens();
        }
    }

    /**
     * Final fallback — static WARSCAN entry
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
