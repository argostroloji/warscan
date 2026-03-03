export interface ClawnchLaunch {
    id: string;
    symbol: string;
    name: string;
    description: string;
    image: string;
    agentName: string;
    agentWallet: string;
    source: string;
    postId: string;
    postUrl: string;
    contractAddress: string;
    txHash: string;
    chainId: number;
    clankerUrl: string;
    launchedAt: string;
    agentRewardBps: number;
    platformRewardBps: number;
}

export interface ClawnchLaunchesResponse {
    success: boolean;
    launches: ClawnchLaunch[];
    pagination: {
        limit: number;
        offset: number;
        total: number;
        hasMore: boolean;
    }
}

export interface ClawnchStats {
    totalTokens: number;
    totalVolume: string;
    clawnchPrice: string;
    clawnchMarketCap: string;
}

export class ClawnchApiService {
    private baseUrl = '/api/clawnch';

    /**
     * Fetch recent autonomous token launches
     */
    async getRecentLaunches(limit = 20): Promise<ClawnchLaunchesResponse | null> {
        try {
            const res = await fetch(`${this.baseUrl}/api/launches?limit=${limit}`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.warn('[ClawnchAPI] Failed to fetch launches', err);
            return null;
        }
    }

    /**
     * Fetch global platform stats
     */
    async getStats(): Promise<ClawnchStats | null> {
        try {
            const res = await fetch(`${this.baseUrl}/api/stats`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.warn('[ClawnchAPI] Failed to fetch stats', err);
            return null;
        }
    }
}

export const clawnchApi = new ClawnchApiService();
