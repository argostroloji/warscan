import { Panel } from './Panel';
import { BagsTrendingToken } from '@/services/bags-api';

export class BagsPanel extends Panel {
  private tokens: BagsTrendingToken[] = [];

  constructor() {
    super({ id: 'bags', title: 'Bags Finance', showCount: true });
    this.content.classList.add('bags-panel-content', 'custom-scroll');

    // Event delegation for click handling (CSP-safe, no inline onclick)
    this.content.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      const row = target.closest('.launch-row[data-url]') as HTMLElement | null;
      if (row?.dataset.url) {
        window.open(row.dataset.url, '_blank');
      }
    });

    // Listen for dynamically injected tokens from searches
    window.addEventListener('bags-tokens-updated', ((e: CustomEvent<BagsTrendingToken[]>) => {
      if (e.detail) {
        this.renderTokens(e.detail);
      }
    }) as EventListener);
  }

  renderTokens(tokens: BagsTrendingToken[]): void {
    this.tokens = tokens;
    this.setCount(tokens.length);
    this.render();
  }

  showLoading(): void {
    this.setContent('<div class="loading-shimmer">Scanning Solana Tokens...</div>');
  }

  showError(err: string): void {
    this.setContent(`<div class="error-slate">Error fetching Bags data: ${err}</div>`);
  }

  private getTimeSince(timestamp: string): string {
    const ms = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  private formatPrice(price?: number): string {
    if (!price) return '';
    if (price < 0.0001) return `$${price.toExponential(2)}`;
    if (price < 1) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(2)}`;
  }

  private formatVolume(vol?: number): string {
    if (!vol) return '';
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  }

  private formatMarketCap(mc?: number): string {
    if (!mc) return '';
    if (mc >= 1_000_000_000) return `$${(mc / 1_000_000_000).toFixed(2)}B`;
    if (mc >= 1_000_000) return `$${(mc / 1_000_000).toFixed(2)}M`;
    if (mc >= 1_000) return `$${(mc / 1_000).toFixed(1)}K`;
    return `$${mc.toFixed(0)}`;
  }

  private render(): void {
    let html = '';

    // Header with Analytics Search
    html += `
      <div class="bags-header panel-sub-header cyber-box" style="flex-direction: column; align-items: stretch; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="cyber-label animate-pulse text-green">SOLANA TOKEN FEED</span>
          <a href="https://bags.fm" target="_blank" class="bags-link">Powered by Bags 💰</a>
        </div>
        
        <!-- Bags Token Analytics -->
        <div class="bags-search" style="display: flex; gap: 6px; margin-top: 4px;">
          <input type="text" id="bags-mint-search" placeholder="Enter Token Mint for Fee Logs..." class="cyber-input" style="flex: 1; padding: 4px 8px; font-size: 0.8em;">
          <button id="bags-mint-btn" class="cyber-btn" style="padding: 4px 8px; font-size: 0.8em; min-width: 60px;">CHECK</button>
        </div>
        <div id="bags-stats-container" style="display: none; padding: 8px; border: 1px dashed var(--accent); border-radius: 4px; font-size: 0.85em; margin-top: 4px; background: rgba(0,0,0,0.3);">
          <!-- Stats injected here -->
        </div>
      </div>
    `;

    if (this.tokens.length === 0) {
      html += '<div class="empty-slate shimmer">Awaiting Solana token data...</div>';
      this.setContent(html);
      this.setupSearchHandler();
      return;
    }

    // Token List
    for (const token of this.tokens) {
      const isNew = Date.now() - new Date(token.createdAt).getTime() < 60 * 60 * 1000;
      const pulseClass = isNew ? 'animate-pulse glow-green' : '';
      const priceChangeClass = (token.priceChange24h || 0) >= 0 ? 'text-green' : 'text-red';
      const priceChangeStr = token.priceChange24h != null
        ? `${token.priceChange24h >= 0 ? '+' : ''}${token.priceChange24h.toFixed(1)}%`
        : '';

      const fallbackImage = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2255%22%20font-size%3D%2240%22%20text-anchor%3D%22middle%22%20fill%3D%22%23666%22%20font-family%3D%22monospace%22%3E%F0%9F%92%B0%3C%2Ftext%3E%3C%2Fsvg%3E";

      html += `
        <div class="data-row launch-row hover-glitch interactable" data-url="${token.url}" style="cursor:pointer">
          <div class="launch-image">
            <img src="${token.image || fallbackImage}" alt="${token.symbol}" onerror="this.src='${fallbackImage}'">
          </div>
          <div class="launch-info">
            <div class="launch-title">
              <span class="launch-symbol ${pulseClass}">${token.symbol}</span>
              <span class="launch-name text-dim">${token.name}</span>
            </div>
            <div class="launch-agent text-dim text-small">
              ${this.formatPrice(token.price)}
              ${priceChangeStr ? `<span class="${priceChangeClass}">${priceChangeStr}</span>` : ''}
              ${token.volume24h ? ` · Vol: ${this.formatVolume(token.volume24h)}` : ''}
              ${token.marketCap ? ` · MC: ${this.formatMarketCap(token.marketCap)}` : ''}
            </div>
          </div>
          <div class="launch-meta text-right">
            <div class="launch-time text-dim">${this.getTimeSince(token.createdAt)}</div>
            <div class="launch-source cyber-badge">🟣 SOL</div>
          </div>
        </div>
      `;
    }

    this.setContent(html);
    this.setupSearchHandler();
  }

  private setupSearchHandler() {
    const input = document.getElementById('bags-mint-search') as HTMLInputElement;
    const btn = document.getElementById('bags-mint-btn');
    const container = document.getElementById('bags-stats-container');

    if (!input || !btn || !container) return;

    btn.addEventListener('click', async () => {
      const mint = input.value.trim();
      if (!mint) return;

      container.style.display = 'block';
      container.innerHTML = '<div class="loading-shimmer text-center" style="padding: 4px;">Loading analytics from Bags.fm...</div>';

      try {
        const { bagsApi, BagsApiService } = await import('@/services/bags-api');
        const stats = await bagsApi.getTokenStats(mint);

        let html = `
          <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
            <span class="text-dim">Lifetime Trading Fees:</span>
            <span class="text-green glow-green" style="font-weight: bold;">${BagsApiService.lamportsToSol(stats.lifetimeFees)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
            <span class="text-dim">Creators/Admins:</span>
            <span style="color: var(--accent);">${stats.creators.length}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
            <span class="text-dim">Fee Claimers:</span>
            <span style="color: var(--accent);">${stats.claimStats.length}</span>
          </div>
        `;

        if (stats.claimStats.length > 0) {
          const topClaimer = stats.claimStats.sort((a, b) => parseInt(b.totalClaimed) - parseInt(a.totalClaimed))[0];
          if (topClaimer) {
            html += `
             <div style="display:flex; justify-content:space-between; margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">
               <span class="text-dim">Top Claimer:</span>
               <span>${topClaimer.twitterUsername ? '@' + topClaimer.twitterUsername : topClaimer.wallet.slice(0, 6) + '...'} (${BagsApiService.lamportsToSol(topClaimer.totalClaimed)})</span>
             </div>`;
          }
        }

        container.innerHTML = html;
      } catch (err) {
        container.innerHTML = `<div class="text-red">Error fetching stats. Make sure this is a Bags token mint.</div>`;
      }
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') btn.click();
    });
  }
}
