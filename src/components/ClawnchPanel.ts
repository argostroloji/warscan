import { Panel } from './Panel';
import { ClawnchLaunch } from '@/services/clawnch-api';

export class ClawnchPanel extends Panel {
  private launches: ClawnchLaunch[] = [];

  constructor() {
    super({ id: 'clawnch', title: 'Agent Finance', showCount: true });
    this.content.classList.add('clawnch-panel-content', 'custom-scroll');
  }

  renderLaunches(launches: ClawnchLaunch[]): void {
    this.launches = launches;
    this.setCount(launches.length);
    this.render();
  }

  // Override to include shimmer effect specific to this panel
  showLoading(): void {
    this.setContent('<div class="loading-shimmer">Scanning Agent Networks...</div>');
  }

  showError(err: string): void {
    this.setContent(`<div class="error-slate">Error fetching agent launches: ${err}</div>`);
  }

  private getTimeSince(timestamp: string): string {
    const ms = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  private render(): void {
    if (this.launches.length === 0) {
      this.setContent('<div class="empty-slate shimmer">Awaiting agent network genesis...</div>');
      return;
    }

    let html = '';

    // Add Clawnch/Agentic stats header
    html += `
      <div class="clawnch-header panel-sub-header cyber-box">
        <span class="cyber-label animate-pulse text-red">LIVE AGENT TOKENS</span>
        <a href="https://clawn.ch" target="_blank" class="clawnch-link">Powered by Clawnch 🦞</a>
      </div>
    `;

    for (const launch of this.launches) {
      const isNew = Date.now() - new Date(launch.launchedAt).getTime() < 60 * 60 * 1000;
      const pulseClass = isNew ? 'animate-pulse glow-red' : '';
      const sourceMap: { [key: string]: string } = {
        'moltbook': '📘 Moltbook',
        '4claw': '🍀 4Claw',
        'moltx': '✖️ MoltX'
      };

      const fallbackImage = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23222%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2255%22%20font-size%3D%2240%22%20text-anchor%3D%22middle%22%20fill%3D%22%23666%22%20font-family%3D%22monospace%22%3E%F0%9F%A4%96%3C%2Ftext%3E%3C%2Fsvg%3E";

      html += `
        <div class="data-row launch-row hover-glitch interactable" onclick="window.open('${launch.clankerUrl || launch.postUrl}', '_blank')">
          <div class="launch-image">
            <img src="${launch.image || fallbackImage}" alt="Token Icon" onerror="this.src='${fallbackImage}'">
          </div>
          <div class="launch-info">
            <div class="launch-title">
              <span class="launch-symbol ${pulseClass}">${launch.symbol}</span>
              <span class="launch-name text-dim">${launch.name}</span>
            </div>
            <div class="launch-agent text-dim text-small">
              Deployed by <span class="cyber-highlight">${launch.agentName}</span>
            </div>
          </div>
          <div class="launch-meta text-right">
            <div class="launch-time text-dim">${this.getTimeSince(launch.launchedAt)}</div>
            <div class="launch-source cyber-badge">${sourceMap[launch.source] || launch.source}</div>
          </div>
        </div>
      `;
    }

    this.setContent(html);
  }
}
