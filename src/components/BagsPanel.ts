import { Panel } from './Panel';
import { BagsTrendingToken } from '@/services/bags-api';

export class BagsPanel extends Panel {
    private tokens: BagsTrendingToken[] = [];

    constructor() {
        super({ id: 'bags', title: 'Bags Finance', showCount: true });
        this.content.classList.add('bags-panel-content', 'custom-scroll');
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

    private render(): void {
        if (this.tokens.length === 0) {
            this.setContent('<div class="empty-slate shimmer">Awaiting Solana token data...</div>');
            return;
        }

        let html = '';

        // Header
        html += `
      <div class="bags-header panel-sub-header cyber-box">
        <span class="cyber-label animate-pulse text-green">SOLANA TOKEN FEED</span>
        <a href="https://bags.fm" target="_blank" class="bags-link">Powered by Bags 💰</a>
      </div>
    `;

        for (const token of this.tokens) {
            const isNew = Date.now() - new Date(token.createdAt).getTime() < 60 * 60 * 1000;
            const pulseClass = isNew ? 'animate-pulse glow-green' : '';
            const priceChangeClass = (token.priceChange24h || 0) >= 0 ? 'text-green' : 'text-red';
            const priceChangeStr = token.priceChange24h != null
                ? `${token.priceChange24h >= 0 ? '+' : ''}${token.priceChange24h.toFixed(1)}%`
                : '';

            const fallbackImage = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2255%22%20font-size%3D%2240%22%20text-anchor%3D%22middle%22%20fill%3D%22%23666%22%20font-family%3D%22monospace%22%3E%F0%9F%92%B0%3C%2Ftext%3E%3C%2Fsvg%3E";

            html += `
        <div class="data-row launch-row hover-glitch interactable" onclick="window.open('${token.url}', '_blank')">
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
            </div>
          </div>
          <div class="launch-meta text-right">
            <div class="launch-time text-dim">${this.getTimeSince(token.createdAt)}</div>
            <div class="launch-source cyber-badge">🟣 Solana</div>
          </div>
        </div>
      `;
        }

        this.setContent(html);
    }
}
