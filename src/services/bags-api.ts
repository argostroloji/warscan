/**
 * Bags.fm API Service - Full Solana token analytics integration
 * Features: Live token feed (DexScreener), Fee analytics, Creator info, Claim stats
 * Partner: argostroloji | Partner Key: 9btNzpXFhqTSqUfkEg6sLnDXBzHQFXWahebTBxjHzg9Z
 */

// ── Types ──────────────────────────────────────────────────────

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

export interface BagsCreator {
    username: string;
    pfp: string;
    royaltyBps: number;
    isCreator: boolean;
    wallet: string;
    provider: string;
    providerUsername: string;
    twitterUsername?: string;
    bagsUsername?: string;
    isAdmin: boolean;
}

export interface BagsClaimStat {
    username: string;
    pfp: string;
    royaltyBps: number;
    isCreator: boolean;
    wallet: string;
    totalClaimed: string; // lamports as string
    provider: string;
    providerUsername: string;
    twitterUsername?: string;
    bagsUsername?: string;
    isAdmin: boolean;
}

export interface BagsTokenStats {
    lifetimeFees: string | null;  // lamports
    creators: BagsCreator[];
    claimStats: BagsClaimStat[];
}

// ── Constants ──────────────────────────────────────────────────

const BAGS_API_BASE = 'https://public-api-v2.bags.fm/api/v1';
const BAGS_API_KEY = 'bags_prod_MrTA6PLHSZXRG3D0DvpMLxpur7B0yxTN6vS3pLUJpww';
const DEXSCREENER_SEARCH_URL = 'https://api.dexscreener.com/latest/dex/search?q=';

// Partner integration
export const BAGS_PARTNER_KEY = '9btNzpXFhqTSqUfkEg6sLnDXBzHQFXWahebTBxjHzg9Z';
export const BAGS_REF_CODE = 'argostroloji';
export const BAGS_REF_URL = `https://bags.fm/?ref=${BAGS_REF_CODE}`;

// ── Service ────────────────────────────────────────────────────

export class BagsApiService {
    private headers: Record<string, string>;
    private tokenCache: BagsTrendingToken[] | null = null;
    private tokenCacheTime = 0;
    private statsCache: Map<string, { data: BagsTokenStats; time: number }> = new Map();
    private readonly CACHE_TTL = 60_000;       // 1 minute token cache
    private readonly STATS_CACHE_TTL = 120_000; // 2 minute stats cache

    constructor() {
        this.headers = {
            'x-api-key': BAGS_API_KEY,
            'Content-Type': 'application/json',
        };
    }

    // ── Token Feed (DexScreener) ─────────────────────────────────

    /**
     * Fetch trending Solana tokens from DexScreener
     */
    async getTrendingTokens(): Promise<BagsTrendingToken[]> {
        if (this.tokenCache && Date.now() - this.tokenCacheTime < this.CACHE_TTL) {
            return this.tokenCache;
        }

        try {
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
                    url: BagsApiService.getTokenUrl(addr),
                });
            }

            tokens.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));

            // Fill with fallbacks if needed
            if (tokens.length < 15) {
                const fallbacks = this.getFallbackTokens().filter(f => f.mint !== 'G2Lm29XTHAFAZbSKDLfhm53jK7jDFpkaFz3FguZBBAGS');
                for (const f of fallbacks) {
                    if (!tokens.find(t => t.mint === f.mint)) tokens.push(f);
                }
            }

            // Force Inject WARSCAN at the top
            const warscanToken = {
                mint: 'G2Lm29XTHAFAZbSKDLfhm53jK7jDFpkaFz3FguZBBAGS',
                name: 'WarScan',
                symbol: 'WARSCAN',
                image: 'https://pbs.twimg.com/profile_images/2028937335581065216/Ucf07N82_400x400.jpg',
                createdAt: new Date().toISOString(),
                url: BagsApiService.getTokenUrl('G2Lm29XTHAFAZbSKDLfhm53jK7jDFpkaFz3FguZBBAGS'),
                marketCap: 1500000,
                volume24h: 350000,
                price: 0.0015,
                priceChange24h: 12.5
            };
            tokens.unshift(warscanToken);

            this.tokenCache = tokens.slice(0, 20);
            this.tokenCacheTime = Date.now();
            return this.tokenCache;
        } catch (err) {
            console.warn('[BagsAPI] DexScreener fetch failed', err);
            return this.getLatestProfiles();
        }
    }

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
                url: BagsApiService.getTokenUrl(p.tokenAddress),
            }));

            // Fill with fallbacks if needed
            if (tokens.length < 15) {
                const fallbacks = this.getFallbackTokens().filter(f => f.mint !== 'G2Lm29XTHAFAZbSKDLfhm53jK7jDFpkaFz3FguZBBAGS');
                for (const f of fallbacks) {
                    if (!tokens.find(t => t.mint === f.mint)) tokens.push(f);
                }
            }

            // Force Inject WARSCAN at the top
            const warscanToken = {
                mint: 'G2Lm29XTHAFAZbSKDLfhm53jK7jDFpkaFz3FguZBBAGS',
                name: 'WarScan',
                symbol: 'WARSCAN',
                image: 'https://pbs.twimg.com/profile_images/2028937335581065216/Ucf07N82_400x400.jpg',
                createdAt: new Date().toISOString(),
                url: BagsApiService.getTokenUrl('G2Lm29XTHAFAZbSKDLfhm53jK7jDFpkaFz3FguZBBAGS'),
            };
            tokens.unshift(warscanToken);

            this.tokenCache = tokens;
            this.tokenCacheTime = Date.now();
            return tokens;
        } catch {
            return this.getFallbackTokens();
        }
    }

    private getFallbackTokens(): BagsTrendingToken[] {
        return [
            {
                mint: 'G2Lm29XTHAFAZbSKDLfhm53jK7jDFpkaFz3FguZBBAGS',
                name: 'WarScan',
                symbol: 'WARSCAN',
                image: 'https://pbs.twimg.com/profile_images/2028937335581065216/Ucf07N82_400x400.jpg',
                createdAt: new Date().toISOString(),
                url: BagsApiService.getTokenUrl('G2Lm29XTHAFAZbSKDLfhm53jK7jDFpkaFz3FguZBBAGS'),
                marketCap: 1500000,
                volume24h: 350000,
                price: 0.0015
            },
            {
                mint: '6XACVQwUPZdya5UwTcatUbmWbJwuYC6BRSwSX79Gpump',
                name: 'NO NUCLEAR PLEASE',
                symbol: 'NONUKE',
                image: 'https://cdn.dexscreener.com/cms/images/G92akps_UhVVICXF?width=64&height=64&fit=crop&quality=95&format=auto',
                createdAt: new Date().toISOString(),
                url: BagsApiService.getTokenUrl('6XACVQwUPZdya5UwTcatUbmWbJwuYC6BRSwSX79Gpump'),
                marketCap: 5200000,
                volume24h: 850000
            },
            {
                mint: '8DwDJ8mp3edVQw8pqbRX18LtNjircbY9b6ygPrnKpump',
                name: 'James Howells',
                symbol: 'JAMES',
                image: 'https://cdn.dexscreener.com/cms/images/9KYsLo6vZfJ0G1Zg?width=64&height=64&fit=crop&quality=95&format=auto',
                createdAt: new Date().toISOString(),
                url: BagsApiService.getTokenUrl('8DwDJ8mp3edVQw8pqbRX18LtNjircbY9b6ygPrnKpump'),
                marketCap: 1900000,
                volume24h: 320000
            },
            {
                mint: 'DVDmWyp9VyfkX5y5sw4RXhr93AhKvRFVZwLLVn9qR2Bd',
                name: 'DVD Logo',
                symbol: 'DVD',
                image: 'https://cdn.dexscreener.com/cms/images/u_O9ycvnX6ssXvcb?width=64&height=64&fit=crop&quality=95&format=auto',
                createdAt: new Date().toISOString(),
                url: BagsApiService.getTokenUrl('DVDmWyp9VyfkX5y5sw4RXhr93AhKvRFVZwLLVn9qR2Bd'),
                marketCap: 4500000,
                volume24h: 600000
            },
            {
                mint: 'Hrz6hE6fyzv4r3kMMjbFsqdJMz7n7VfjbKEvrC7kpump',
                name: 'Nostalgic Game',
                symbol: 'NGAME',
                image: 'https://cdn.dexscreener.com/cms/images/iZ8Ib_-hfguvO0ZP?width=64&height=64&fit=crop&quality=95&format=auto',
                createdAt: new Date().toISOString(),
                url: BagsApiService.getTokenUrl('Hrz6hE6fyzv4r3kMMjbFsqdJMz7n7VfjbKEvrC7kpump'),
                marketCap: 2100000,
                volume24h: 180000
            },
            {
                mint: 'EtmbZtSKmVTgtyWhY1DhVACihKoFaVN3j6j5xvqwpump',
                name: 'Control Sentinel',
                symbol: 'CTRL',
                image: 'https://cdn.dexscreener.com/cms/images/C-xDpTyK6vbBDDSC?width=64&height=64&fit=crop&quality=95&format=auto',
                createdAt: new Date().toISOString(),
                url: BagsApiService.getTokenUrl('EtmbZtSKmVTgtyWhY1DhVACihKoFaVN3j6j5xvqwpump'),
                marketCap: 3800000,
                volume24h: 420000
            },
            {
                mint: 'So11111111111111111111111111111111111111112',
                name: 'Wrapped SOL',
                symbol: 'SOL',
                image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
                createdAt: new Date(Date.now() - 86400000 * 365).toISOString(),
                url: BagsApiService.getTokenUrl('So11111111111111111111111111111111111111112'),
                marketCap: 65000000000,
                volume24h: 2500000000
            },
            {
                mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
                name: 'dogwifhat',
                symbol: 'WIF',
                image: 'https://bafkreigz522v56k64xhmjxtv2s7a5jwnpt5yegj3eeywytj46x3ub5e7e4.ipfs.nftstorage.link/',
                createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
                url: BagsApiService.getTokenUrl('EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'),
                marketCap: 2500000000,
                volume24h: 400000000
            }
        ];
    }

    // ── Bags.fm API Endpoints ────────────────────────────────────

    /**
     * Get lifetime fees for a token
     */
    async getLifetimeFees(tokenMint: string): Promise<string | null> {
        try {
            console.log(`[BagsAPI] Fetching lifetime fees for ${tokenMint}`);
            const res = await fetch(
                `${BAGS_API_BASE}/token-launch/lifetime-fees?tokenMint=${tokenMint}`,
                { headers: this.headers, signal: AbortSignal.timeout(8000) }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            console.log(`[BagsAPI] Fees response:`, data);
            return data.success ? (data.response || '0') : null;
        } catch (err) {
            console.warn('[BagsAPI] Failed to fetch lifetime fees', err);
            return null;
        }
    }

    /**
     * Get token creators/deployers
     */
    async getTokenCreators(tokenMint: string): Promise<BagsCreator[]> {
        try {
            console.log(`[BagsAPI] Fetching creators for ${tokenMint}`);
            const res = await fetch(
                `${BAGS_API_BASE}/token-launch/creator/v3?tokenMint=${tokenMint}`,
                { headers: this.headers, signal: AbortSignal.timeout(8000) }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            console.log(`[BagsAPI] Creators response:`, data);
            return data.success ? (data.response || []) : [];
        } catch (err) {
            console.warn('[BagsAPI] Failed to fetch creators', err);
            return [];
        }
    }

    /**
     * Get claim statistics for a token
     */
    async getClaimStats(tokenMint: string): Promise<BagsClaimStat[]> {
        try {
            console.log(`[BagsAPI] Fetching claim stats for ${tokenMint}`);
            const res = await fetch(
                `${BAGS_API_BASE}/token-launch/claim-stats?tokenMint=${tokenMint}`,
                { headers: this.headers, signal: AbortSignal.timeout(8000) }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            console.log(`[BagsAPI] Claim stats response:`, data);
            return data.success ? (data.response || []) : [];
        } catch (err) {
            console.warn('[BagsAPI] Failed to fetch claim stats', err);
            return [];
        }
    }

    /**
     * Get full token stats (fees + creators + claim stats)
     * Cached for 2 minutes per token
     */
    async getTokenStats(tokenMint: string): Promise<BagsTokenStats> {
        // 1. Push user searched token dynamically to list (Do this FIRST before any early returns)
        if (!this.tokenCache?.find(t => t.mint === tokenMint)) {
            let newToken: BagsTrendingToken | null = null;
            try {
                const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.pairs?.[0] && data.pairs[0].chainId === 'solana') {
                        const pair = data.pairs[0];
                        newToken = {
                            mint: pair.baseToken.address,
                            name: pair.baseToken.name || 'Searched Token',
                            symbol: pair.baseToken.symbol || '???',
                            image: pair.info?.imageUrl || '',
                            price: pair.priceUsd ? parseFloat(pair.priceUsd) : undefined,
                            priceChange24h: pair.priceChange?.h24 ?? undefined,
                            volume24h: pair.volume?.h24 ?? undefined,
                            marketCap: pair.marketCap ?? pair.fdv ?? undefined,
                            createdAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : new Date().toISOString(),
                            url: BagsApiService.getTokenUrl(pair.baseToken.address),
                        };
                    }
                }
            } catch (e) { console.warn('DexScreener fetch failed for new CA', e); }

            if (!newToken) {
                // If token is brand new and completely unknown to APIs, inject a generic one
                newToken = {
                    mint: tokenMint,
                    name: `Token ${tokenMint.slice(0, 6)}...`,
                    symbol: 'NEW',
                    image: 'https://pbs.twimg.com/profile_images/2028937335581065216/Ucf07N82_400x400.jpg',
                    createdAt: new Date().toISOString(),
                    url: BagsApiService.getTokenUrl(tokenMint),
                };
            }

            this.tokenCache = this.tokenCache || [];
            this.tokenCache.unshift(newToken);
            window.dispatchEvent(new CustomEvent('bags-tokens-updated', { detail: this.tokenCache }));
        }

        // 2. Return Stats (Mock for WARSCAN, or Live data)
        if (tokenMint === 'G2Lm29XTHAFAZbSKDLfhm53jK7jDFpkaFz3FguZBBAGS') {
            return {
                lifetimeFees: "12500000000", // 12.5 SOL
                creators: [{
                    username: 'WarScanTeam',
                    pfp: 'https://pbs.twimg.com/profile_images/2028937335581065216/Ucf07N82_400x400.jpg',
                    royaltyBps: 500,
                    isCreator: true,
                    wallet: 'WARSCAN_CREATOR_WALLET',
                    provider: 'twitter',
                    providerUsername: 'warscanteam',
                    isAdmin: true
                }],
                claimStats: []
            };
        }

        const cached = this.statsCache.get(tokenMint);
        if (cached && Date.now() - cached.time < this.STATS_CACHE_TTL) {
            return cached.data;
        }

        const [lifetimeFees, creators, claimStats] = await Promise.all([
            this.getLifetimeFees(tokenMint),
            this.getTokenCreators(tokenMint),
            this.getClaimStats(tokenMint),
        ]);

        const stats: BagsTokenStats = { lifetimeFees, creators, claimStats };
        this.statsCache.set(tokenMint, { data: stats, time: Date.now() });

        return stats;
    }

    // ── Utility ──────────────────────────────────────────────────

    /**
     * Format lamports to SOL with display string
     */
    static lamportsToSol(lamports: string | null): string {
        if (!lamports || lamports === '0') return '0 SOL';
        const sol = parseInt(lamports) / 1_000_000_000;
        if (sol < 0.001) return `${sol.toExponential(2)} SOL`;
        return `${sol.toFixed(4)} SOL`;
    }

    /**
     * Get partner-referred Bags.fm URL for a token
     */
    static getTokenUrl(tokenMint: string): string {
        return `https://bags.fm/${tokenMint}?ref=${BAGS_REF_CODE}`;
    }
}

export const bagsApi = new BagsApiService();
