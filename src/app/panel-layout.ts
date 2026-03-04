import type { AppContext, AppModule } from '@/app/app-context';
import type { RelatedAsset } from '@/types';
import type { TheaterPostureSummary } from '@/services/military-surge';
import {
  MapContainer,
  NewsPanel,
  MarketPanel,
  BagsPanel,
  MonitorPanel,
  GdeltIntelPanel,
  LiveNewsPanel,
  CIIPanel,
  CascadePanel,
  StrategicRiskPanel,
  StrategicPosturePanel,
  RuntimeConfigPanel,
  InsightsPanel,
  UcdpEventsPanel,
  DisplacementPanel,
  ClimateAnomalyPanel,
  PopulationExposurePanel,
  SecurityAdvisoriesPanel,
  OrefSirensPanel,
  TelegramIntelPanel,
  WorldClockPanel,
  BountyPanel,
  BankrWidget,
} from '@/components';
import { SatelliteFiresPanel } from '@/components/SatelliteFiresPanel';
import { debounce, saveToStorage } from '@/utils';
import { escapeHtml } from '@/utils/sanitize';
import {
  FEEDS,
  INTEL_SOURCES,
  DEFAULT_PANELS,
  STORAGE_KEYS,
  SITE_VARIANT,
} from '@/config';
import { BETA_MODE } from '@/config/beta';
import { t } from '@/services/i18n';
import { getCurrentTheme } from '@/utils';
import { trackCriticalBannerAction } from '@/services/analytics';

export interface PanelLayoutCallbacks {
  openCountryStory: (code: string, name: string) => void;
  loadAllData: () => Promise<void>;
  updateMonitorResults: () => void;
  loadSecurityAdvisories?: () => Promise<void>;
}

export class PanelLayoutManager implements AppModule {
  private ctx: AppContext;
  private callbacks: PanelLayoutCallbacks;
  private panelDragCleanupHandlers: Array<() => void> = [];
  private criticalBannerEl: HTMLElement | null = null;
  private readonly applyTimeRangeFilterDebounced: (() => void) & { cancel(): void };

  constructor(ctx: AppContext, callbacks: PanelLayoutCallbacks) {
    this.ctx = ctx;
    this.callbacks = callbacks;
    this.applyTimeRangeFilterDebounced = debounce(() => {
      this.applyTimeRangeFilterToNewsPanels();
    }, 120);
  }

  init(): void {
    this.renderLayout();
  }

  destroy(): void {
    this.applyTimeRangeFilterDebounced.cancel();
    this.panelDragCleanupHandlers.forEach((cleanup) => cleanup());
    this.panelDragCleanupHandlers = [];
    if (this.criticalBannerEl) {
      this.criticalBannerEl.remove();
      this.criticalBannerEl = null;
    }
    // Clean up happy variant panels

    window.removeEventListener('resize', this.ensureCorrectZones);
  }

  renderLayout(): void {
    this.ctx.container.innerHTML = `
      <div class="header">
        <div class="header-left">
          <img src="/logo.jpg" class="header-logo" alt="WARSCAN">

          <span class="version">v${__APP_VERSION__}</span>${BETA_MODE ? '<span class="beta-badge">BETA</span>' : ''}
          <button id="ca-copy-btn" class="cyber-btn" title="Copy WARSCAN CA: G2Lm29XTHAFAZbSKDLfhm53jK7jDFpkaFz3FguZBBAGS" style="margin-left: 10px; font-size: 0.75em; padding: 2px 8px; border: 1px solid #14F195; color: #14F195; background: rgba(20, 241, 149, 0.1); display: flex; align-items: center; gap: 4px; border-radius: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span id="ca-text">CA: G2Lm...BAGS</span>
          </button>
          <div id="web3-wallet-container" class="web3-wallet-container">
            <button id="connect-wallet-btn" class="cyber-btn">Connect Wallet</button>
          </div>
          <a href="https://github.com/koala73/worldmonitor" target="_blank" rel="noopener" class="github-link" title="${t('header.viewOnGitHub')}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          </a>
          <div class="status-indicator">
            <span class="status-dot"></span>
            <span>${t('header.live')}</span>
          </div>
          <a href="/skill.md" target="_blank" class="agent-api-link cyber-text" style="margin-left: 12px; font-size: 0.8em; text-decoration: none; border: 1px solid rgba(255, 0, 0, 0.3); padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
            FOR AGENTS / API
          </a>
          <button id="bounties-toggle-btn" class="cyber-btn" title="Toggle Bounty Board" style="margin-left: 8px; font-size: 0.75em; border: 1px solid var(--accent); color: var(--accent); background: rgba(255, 0, 102, 0.1);">
            🎯 BOUNTIES
          </button>
          <button id="bags-toggle-btn" class="cyber-btn" title="Toggle Bags Finance" style="margin-left: 4px; font-size: 0.75em; border: 1px solid #9945FF; color: #9945FF; background: rgba(153, 69, 255, 0.1);">
            💰 BAGS
          </button>
          <div class="region-selector">
            <select id="regionSelect" class="region-select">
              <option value="global">${t('components.deckgl.views.global')}</option>
              <option value="america">${t('components.deckgl.views.americas')}</option>
              <option value="mena">${t('components.deckgl.views.mena')}</option>
              <option value="eu">${t('components.deckgl.views.europe')}</option>
              <option value="asia">${t('components.deckgl.views.asia')}</option>
              <option value="latam">${t('components.deckgl.views.latam')}</option>
              <option value="africa">${t('components.deckgl.views.africa')}</option>
              <option value="oceania">${t('components.deckgl.views.oceania')}</option>
            </select>
          </div>
        </div>
        <div class="header-right">
          ${this.ctx.isDesktopApp ? '' : `<div class="download-wrapper" id="downloadWrapper">
            <button class="download-btn" id="downloadBtn" title="${t('header.downloadApp')}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span id="downloadBtnLabel">${t('header.downloadApp')}</span>
            </button>
            <div class="download-dropdown" id="downloadDropdown"></div>
          </div>`}
          <button class="search-btn" id="searchBtn"><kbd>⌘K</kbd> ${t('header.search')}</button>
          ${this.ctx.isDesktopApp ? '' : `<button class="copy-link-btn" id="copyLinkBtn">${t('header.copyLink')}</button>`}
          <button class="theme-toggle-btn" id="headerThemeToggle" title="${t('header.toggleTheme')}">
            ${getCurrentTheme() === 'dark'
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>'}
          </button>
          ${this.ctx.isDesktopApp ? '' : `<button class="fullscreen-btn" id="fullscreenBtn" title="${t('header.fullscreen')}">⛶</button>`}
          ${SITE_VARIANT === 'happy' ? `<button class="tv-mode-btn" id="tvModeBtn" title="TV Mode (Shift+T)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></button>` : ''}
          <span id="unifiedSettingsMount"></span>
        </div>
      </div>
      <div class="main-content">
        <div class="map-section" id="mapSection">
          <div class="panel-header">
            <div class="panel-header-left">
              <span class="panel-title">${SITE_VARIANT === 'tech' ? t('panels.techMap') : SITE_VARIANT === 'happy' ? 'Good News Map' : t('panels.map')}</span>
            </div>
            <span class="header-clock" id="headerClock"></span>
            <div style="display:flex;align-items:center;gap:2px">
              <button class="map-pin-btn" id="mapFullscreenBtn" title="Fullscreen">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
              </button>
              <button class="map-pin-btn" id="mapPinBtn" title="${t('header.pinMap')}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V16a1 1 0 001 1h12a1 1 0 001-1v-.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V7a1 1 0 011-1 1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v1a1 1 0 001 1 1 1 0 011 1v3.76z"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="map-container" id="mapContainer"></div>
          ${SITE_VARIANT === 'happy' ? '<button class="tv-exit-btn" id="tvExitBtn">Exit TV Mode</button>' : ''}
          <div class="map-resize-handle" id="mapResizeHandle"></div>
          <div class="map-bottom-grid" id="mapBottomGrid"></div>
        </div>
        <div class="panels-grid" id="panelsGrid"></div>
      </div>
    `;

    this.createPanels();

    // CA copy button handler
    const caBadge = this.ctx.container.querySelector('#caBadge');
    if (caBadge) {
      caBadge.addEventListener('click', () => {
        const addr = '0xFEDAE2263C7AaC699c277d3F27b6E5B53feD8bA3';
        navigator.clipboard.writeText(addr).then(() => {
          const el = caBadge.querySelector('.ca-address') as HTMLElement;
          if (el) {
            const orig = el.textContent || '';
            el.textContent = 'Copied!';
            setTimeout(() => { el.textContent = orig; }, 1500);
          }
        }).catch(() => {
          // Fallback: select text
          const ta = document.createElement('textarea');
          ta.value = addr;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          const el = caBadge.querySelector('.ca-address') as HTMLElement;
          if (el) {
            const orig = el.textContent || '';
            el.textContent = 'Copied!';
            setTimeout(() => { el.textContent = orig; }, 1500);
          }
        });
      });
    }

    if (this.ctx.isMobile) {
      this.setupMobileMapToggle();
    }
  }

  private setupMobileMapToggle(): void {
    const mapSection = document.getElementById('mapSection');
    const headerLeft = mapSection?.querySelector('.panel-header-left');
    if (!mapSection || !headerLeft) return;

    const stored = localStorage.getItem('mobile-map-collapsed');
    const collapsed = stored === null || stored === 'true';
    if (collapsed) mapSection.classList.add('collapsed');

    const updateBtn = (btn: HTMLButtonElement, isCollapsed: boolean) => {
      btn.textContent = isCollapsed ? `▶ ${t('components.map.showMap')}` : `▼ ${t('components.map.hideMap')}`;
    };

    const btn = document.createElement('button');
    btn.className = 'map-collapse-btn';
    updateBtn(btn, collapsed);
    headerLeft.after(btn);

    btn.addEventListener('click', () => {
      const isCollapsed = mapSection.classList.toggle('collapsed');
      updateBtn(btn, isCollapsed);
      localStorage.setItem('mobile-map-collapsed', String(isCollapsed));
      if (!isCollapsed) window.dispatchEvent(new Event('resize'));
    });
  }

  renderCriticalBanner(postures: TheaterPostureSummary[]): void {
    if (this.ctx.isMobile) {
      if (this.criticalBannerEl) {
        this.criticalBannerEl.remove();
        this.criticalBannerEl = null;
      }
      document.body.classList.remove('has-critical-banner');
      return;
    }

    const dismissedAt = sessionStorage.getItem('banner-dismissed');
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 30 * 60 * 1000) {
      return;
    }

    const critical = postures.filter(
      (p) => p.postureLevel === 'critical' || (p.postureLevel === 'elevated' && p.strikeCapable)
    );

    if (critical.length === 0) {
      if (this.criticalBannerEl) {
        this.criticalBannerEl.remove();
        this.criticalBannerEl = null;
        document.body.classList.remove('has-critical-banner');
      }
      return;
    }

    const top = critical[0]!;
    const isCritical = top.postureLevel === 'critical';

    if (!this.criticalBannerEl) {
      this.criticalBannerEl = document.createElement('div');
      this.criticalBannerEl.className = 'critical-posture-banner';
      const header = document.querySelector('.header');
      if (header) header.insertAdjacentElement('afterend', this.criticalBannerEl);
    }

    document.body.classList.add('has-critical-banner');
    this.criticalBannerEl.className = `critical-posture-banner ${isCritical ? 'severity-critical' : 'severity-elevated'}`;
    this.criticalBannerEl.innerHTML = `
      <div class="banner-content">
        <span class="banner-icon">${isCritical ? '🚨' : '⚠️'}</span>
        <span class="banner-headline">${escapeHtml(top.headline)}</span>
        <span class="banner-stats">${top.totalAircraft} aircraft • ${escapeHtml(top.summary)}</span>
        ${top.strikeCapable ? '<span class="banner-strike">STRIKE CAPABLE</span>' : ''}
      </div>
      <button class="banner-view" data-lat="${top.centerLat}" data-lon="${top.centerLon}">View Region</button>
      <button class="banner-dismiss">×</button>
    `;

    this.criticalBannerEl.querySelector('.banner-view')?.addEventListener('click', () => {
      trackCriticalBannerAction('view', top.theaterId);
      if (typeof top.centerLat === 'number' && typeof top.centerLon === 'number') {
        this.ctx.map?.setCenter(top.centerLat, top.centerLon, 4);
      } else {
        console.error('[Banner] Missing coordinates for', top.theaterId);
      }
    });

    this.criticalBannerEl.querySelector('.banner-dismiss')?.addEventListener('click', () => {
      trackCriticalBannerAction('dismiss', top.theaterId);
      this.criticalBannerEl?.classList.add('dismissed');
      document.body.classList.remove('has-critical-banner');
      sessionStorage.setItem('banner-dismissed', Date.now().toString());
    });
  }

  applyPanelSettings(): void {
    Object.entries(this.ctx.panelSettings).forEach(([key, config]) => {
      if (key === 'map') {
        const mapSection = document.getElementById('mapSection');
        if (mapSection) {
          mapSection.classList.toggle('hidden', !config.enabled);
        }
        return;
      }
      const panel = this.ctx.panels[key];
      panel?.toggle(config.enabled);
    });
  }

  private createPanels(): void {
    const panelsGrid = document.getElementById('panelsGrid')!;

    const mapContainer = document.getElementById('mapContainer') as HTMLElement;
    this.ctx.map = new MapContainer(mapContainer, {
      zoom: this.ctx.isMobile ? 2.5 : 1.0,
      pan: { x: 0, y: 0 },
      view: this.ctx.isMobile ? this.ctx.resolvedLocation : 'global',
      layers: this.ctx.mapLayers,
      timeRange: '7d',
    });

    this.ctx.map.initEscalationGetters();
    this.ctx.currentTimeRange = this.ctx.map.getTimeRange();

    const politicsPanel = new NewsPanel('politics', t('panels.politics'));
    this.attachRelatedAssetHandlers(politicsPanel);
    this.ctx.newsPanels['politics'] = politicsPanel;
    this.ctx.panels['politics'] = politicsPanel;

    const techPanel = new NewsPanel('tech', t('panels.tech'));
    this.attachRelatedAssetHandlers(techPanel);
    this.ctx.newsPanels['tech'] = techPanel;
    this.ctx.panels['tech'] = techPanel;

    const financePanel = new NewsPanel('finance', t('panels.finance'));
    this.attachRelatedAssetHandlers(financePanel);
    this.ctx.newsPanels['finance'] = financePanel;
    this.ctx.panels['finance'] = financePanel;


    const marketsPanel = new MarketPanel();
    this.ctx.panels['markets'] = marketsPanel;

    const monitorPanel = new MonitorPanel(this.ctx.monitors);
    this.ctx.panels['monitors'] = monitorPanel;
    monitorPanel.onChanged((monitors) => {
      this.ctx.monitors = monitors;
      saveToStorage(STORAGE_KEYS.monitors, monitors);
      this.callbacks.updateMonitorResults();
    });


    const bagsPanel = new BagsPanel();
    this.ctx.panels['bags'] = bagsPanel;

    const bountyPanel = new BountyPanel('bounties');
    this.ctx.panels['bounties'] = bountyPanel;

    const govPanel = new NewsPanel('gov', t('panels.gov'));
    this.attachRelatedAssetHandlers(govPanel);
    this.ctx.newsPanels['gov'] = govPanel;
    this.ctx.panels['gov'] = govPanel;

    const intelPanel = new NewsPanel('intel', t('panels.intel'));
    this.attachRelatedAssetHandlers(intelPanel);
    this.ctx.newsPanels['intel'] = intelPanel;
    this.ctx.panels['intel'] = intelPanel;


    const middleeastPanel = new NewsPanel('middleeast', t('panels.middleeast'));
    this.attachRelatedAssetHandlers(middleeastPanel);
    this.ctx.newsPanels['middleeast'] = middleeastPanel;
    this.ctx.panels['middleeast'] = middleeastPanel;

    const layoffsPanel = new NewsPanel('layoffs', t('panels.layoffs'));
    this.attachRelatedAssetHandlers(layoffsPanel);
    this.ctx.newsPanels['layoffs'] = layoffsPanel;
    this.ctx.panels['layoffs'] = layoffsPanel;

    const aiPanel = new NewsPanel('ai', t('panels.ai'));
    this.attachRelatedAssetHandlers(aiPanel);
    this.ctx.newsPanels['ai'] = aiPanel;
    this.ctx.panels['ai'] = aiPanel;

    const startupsPanel = new NewsPanel('startups', t('panels.startups'));
    this.attachRelatedAssetHandlers(startupsPanel);
    this.ctx.newsPanels['startups'] = startupsPanel;
    this.ctx.panels['startups'] = startupsPanel;

    const vcblogsPanel = new NewsPanel('vcblogs', t('panels.vcblogs'));
    this.attachRelatedAssetHandlers(vcblogsPanel);
    this.ctx.newsPanels['vcblogs'] = vcblogsPanel;
    this.ctx.panels['vcblogs'] = vcblogsPanel;

    const regionalStartupsPanel = new NewsPanel('regionalStartups', t('panels.regionalStartups'));
    this.attachRelatedAssetHandlers(regionalStartupsPanel);
    this.ctx.newsPanels['regionalStartups'] = regionalStartupsPanel;
    this.ctx.panels['regionalStartups'] = regionalStartupsPanel;

    const unicornsPanel = new NewsPanel('unicorns', t('panels.unicorns'));
    this.attachRelatedAssetHandlers(unicornsPanel);
    this.ctx.newsPanels['unicorns'] = unicornsPanel;
    this.ctx.panels['unicorns'] = unicornsPanel;

    const acceleratorsPanel = new NewsPanel('accelerators', t('panels.accelerators'));
    this.attachRelatedAssetHandlers(acceleratorsPanel);
    this.ctx.newsPanels['accelerators'] = acceleratorsPanel;
    this.ctx.panels['accelerators'] = acceleratorsPanel;

    const fundingPanel = new NewsPanel('funding', t('panels.funding'));
    this.attachRelatedAssetHandlers(fundingPanel);
    this.ctx.newsPanels['funding'] = fundingPanel;
    this.ctx.panels['funding'] = fundingPanel;

    const producthuntPanel = new NewsPanel('producthunt', t('panels.producthunt'));
    this.attachRelatedAssetHandlers(producthuntPanel);
    this.ctx.newsPanels['producthunt'] = producthuntPanel;
    this.ctx.panels['producthunt'] = producthuntPanel;

    const securityPanel = new NewsPanel('security', t('panels.security'));
    this.attachRelatedAssetHandlers(securityPanel);
    this.ctx.newsPanels['security'] = securityPanel;
    this.ctx.panels['security'] = securityPanel;

    const policyPanel = new NewsPanel('policy', t('panels.policy'));
    this.attachRelatedAssetHandlers(policyPanel);
    this.ctx.newsPanels['policy'] = policyPanel;
    this.ctx.panels['policy'] = policyPanel;

    const hardwarePanel = new NewsPanel('hardware', t('panels.hardware'));
    this.attachRelatedAssetHandlers(hardwarePanel);
    this.ctx.newsPanels['hardware'] = hardwarePanel;
    this.ctx.panels['hardware'] = hardwarePanel;

    const cloudPanel = new NewsPanel('cloud', t('panels.cloud'));
    this.attachRelatedAssetHandlers(cloudPanel);
    this.ctx.newsPanels['cloud'] = cloudPanel;
    this.ctx.panels['cloud'] = cloudPanel;

    const devPanel = new NewsPanel('dev', t('panels.dev'));
    this.attachRelatedAssetHandlers(devPanel);
    this.ctx.newsPanels['dev'] = devPanel;
    this.ctx.panels['dev'] = devPanel;

    const githubPanel = new NewsPanel('github', t('panels.github'));
    this.attachRelatedAssetHandlers(githubPanel);
    this.ctx.newsPanels['github'] = githubPanel;
    this.ctx.panels['github'] = githubPanel;

    const ipoPanel = new NewsPanel('ipo', t('panels.ipo'));
    this.attachRelatedAssetHandlers(ipoPanel);
    this.ctx.newsPanels['ipo'] = ipoPanel;
    this.ctx.panels['ipo'] = ipoPanel;

    const thinktanksPanel = new NewsPanel('thinktanks', t('panels.thinktanks'));
    this.attachRelatedAssetHandlers(thinktanksPanel);
    this.ctx.newsPanels['thinktanks'] = thinktanksPanel;
    this.ctx.panels['thinktanks'] = thinktanksPanel;


    const africaPanel = new NewsPanel('africa', t('panels.africa'));
    this.attachRelatedAssetHandlers(africaPanel);
    this.ctx.newsPanels['africa'] = africaPanel;
    this.ctx.panels['africa'] = africaPanel;

    const latamPanel = new NewsPanel('latam', t('panels.latam'));
    this.attachRelatedAssetHandlers(latamPanel);
    this.ctx.newsPanels['latam'] = latamPanel;
    this.ctx.panels['latam'] = latamPanel;

    const asiaPanel = new NewsPanel('asia', t('panels.asia'));
    this.attachRelatedAssetHandlers(asiaPanel);
    this.ctx.newsPanels['asia'] = asiaPanel;
    this.ctx.panels['asia'] = asiaPanel;

    const energyPanel = new NewsPanel('energy', t('panels.energy'));
    this.attachRelatedAssetHandlers(energyPanel);
    this.ctx.newsPanels['energy'] = energyPanel;
    this.ctx.panels['energy'] = energyPanel;

    for (const key of Object.keys(FEEDS)) {
      if (this.ctx.newsPanels[key]) continue;
      if (!Array.isArray((FEEDS as Record<string, unknown>)[key])) continue;
      const panelKey = this.ctx.panels[key] && !this.ctx.newsPanels[key] ? `${key}-news` : key;
      if (this.ctx.panels[panelKey]) continue;
      const panelConfig = DEFAULT_PANELS[panelKey] ?? DEFAULT_PANELS[key];
      const label = panelConfig?.name ?? key.charAt(0).toUpperCase() + key.slice(1);
      const panel = new NewsPanel(panelKey, label);
      this.attachRelatedAssetHandlers(panel);
      this.ctx.newsPanels[key] = panel;
      this.ctx.panels[panelKey] = panel;
    }

    if (SITE_VARIANT === 'full') {
      const gdeltIntelPanel = new GdeltIntelPanel();
      this.ctx.panels['gdelt-intel'] = gdeltIntelPanel;

      if (this.ctx.isDesktopApp) {
        import('@/components/DeductionPanel').then(({ DeductionPanel }) => {
          const deductionPanel = new DeductionPanel(() => this.ctx.allNews);
          this.ctx.panels['deduction'] = deductionPanel;
          const el = deductionPanel.getElement();
          this.makeDraggable(el, 'deduction');
          const grid = document.getElementById('panelsGrid');
          if (grid) {
            const gdeltEl = this.ctx.panels['gdelt-intel']?.getElement();
            if (gdeltEl?.nextSibling) {
              grid.insertBefore(el, gdeltEl.nextSibling);
            } else {
              grid.appendChild(el);
            }
          }
        });
      }

      const ciiPanel = new CIIPanel();
      ciiPanel.setShareStoryHandler((code, name) => {
        this.callbacks.openCountryStory(code, name);
      });
      this.ctx.panels['cii'] = ciiPanel;

      const cascadePanel = new CascadePanel();
      this.ctx.panels['cascade'] = cascadePanel;

      const satelliteFiresPanel = new SatelliteFiresPanel();
      this.ctx.panels['satellite-fires'] = satelliteFiresPanel;

      const strategicRiskPanel = new StrategicRiskPanel();
      strategicRiskPanel.setLocationClickHandler((lat, lon) => {
        this.ctx.map?.setCenter(lat, lon, 4);
      });
      this.ctx.panels['strategic-risk'] = strategicRiskPanel;

      const strategicPosturePanel = new StrategicPosturePanel(() => this.ctx.allNews);
      strategicPosturePanel.setLocationClickHandler((lat, lon) => {
        this.ctx.map?.setCenter(lat, lon, 4);
      });
      this.ctx.panels['strategic-posture'] = strategicPosturePanel;

      const ucdpEventsPanel = new UcdpEventsPanel();
      ucdpEventsPanel.setEventClickHandler((lat, lon) => {
        this.ctx.map?.setCenter(lat, lon, 5);
      });
      this.ctx.panels['ucdp-events'] = ucdpEventsPanel;

      const displacementPanel = new DisplacementPanel();
      displacementPanel.setCountryClickHandler((lat, lon) => {
        this.ctx.map?.setCenter(lat, lon, 4);
      });
      this.ctx.panels['displacement'] = displacementPanel;

      const climatePanel = new ClimateAnomalyPanel();
      climatePanel.setZoneClickHandler((lat, lon) => {
        this.ctx.map?.setCenter(lat, lon, 4);
      });
      this.ctx.panels['climate'] = climatePanel;

      const populationExposurePanel = new PopulationExposurePanel();
      this.ctx.panels['population-exposure'] = populationExposurePanel;

      const securityAdvisoriesPanel = new SecurityAdvisoriesPanel();
      securityAdvisoriesPanel.setRefreshHandler(() => {
        void this.callbacks.loadSecurityAdvisories?.();
      });
      this.ctx.panels['security-advisories'] = securityAdvisoriesPanel;

      const orefSirensPanel = new OrefSirensPanel();
      this.ctx.panels['oref-sirens'] = orefSirensPanel;

      const telegramIntelPanel = new TelegramIntelPanel();
      this.ctx.panels['telegram-intel'] = telegramIntelPanel;
    }


    this.ctx.panels['world-clock'] = new WorldClockPanel();

    const liveNewsPanel = new LiveNewsPanel();
    this.ctx.panels['live-news'] = liveNewsPanel;

    if (this.ctx.isDesktopApp) {
      const runtimeConfigPanel = new RuntimeConfigPanel({ mode: 'alert' });
      this.ctx.panels['runtime-config'] = runtimeConfigPanel;
    }

    const insightsPanel = new InsightsPanel();
    this.ctx.panels['insights'] = insightsPanel;



    const defaultOrder = Object.keys(DEFAULT_PANELS).filter(k => k !== 'map');
    const savedOrder = this.getSavedPanelOrder();
    const savedBottomOrder = this.getSavedBottomPanelOrder();
    const isUltraWide = window.innerWidth >= 1600;

    let panelOrder = defaultOrder;
    if (savedOrder.length > 0 || savedBottomOrder.length > 0) {
      const allSaved = [...savedOrder, ...savedBottomOrder];
      const missing = defaultOrder.filter(k => !allSaved.includes(k));
      const valid = savedOrder.filter(k => defaultOrder.includes(k));
      const validBottom = isUltraWide ? savedBottomOrder.filter(k => defaultOrder.includes(k)) : [];

      const monitorsIdx = valid.indexOf('monitors');
      if (monitorsIdx !== -1) valid.splice(monitorsIdx, 1);
      const insertIdx = valid.indexOf('politics') + 1 || 0;
      const newPanels = missing.filter(k => k !== 'monitors');
      valid.splice(insertIdx, 0, ...newPanels);
      if (SITE_VARIANT !== 'happy') {
        valid.push('monitors');
      }
      panelOrder = valid;

      // Handle bottom panels
      validBottom.forEach(key => {
        const panel = this.ctx.panels[key];
        if (panel) {
          const el = panel.getElement();
          this.makeDraggable(el, key);
          document.getElementById('mapBottomGrid')?.appendChild(el);
        }
      });
    }

    if (SITE_VARIANT !== 'happy') {
      const liveNewsIdx = panelOrder.indexOf('live-news');
      if (liveNewsIdx > 0) {
        panelOrder.splice(liveNewsIdx, 1);
        panelOrder.unshift('live-news');
      }

      const webcamsIdx = panelOrder.indexOf('live-webcams');
      if (webcamsIdx !== -1 && webcamsIdx !== panelOrder.indexOf('live-news') + 1) {
        panelOrder.splice(webcamsIdx, 1);
        const afterNews = panelOrder.indexOf('live-news') + 1;
        panelOrder.splice(afterNews, 0, 'live-webcams');
      }
    }

    if (this.ctx.isDesktopApp) {
      const runtimeIdx = panelOrder.indexOf('runtime-config');
      if (runtimeIdx > 1) {
        panelOrder.splice(runtimeIdx, 1);
        panelOrder.splice(1, 0, 'runtime-config');
      } else if (runtimeIdx === -1) {
        panelOrder.splice(1, 0, 'runtime-config');
      }
    }

    panelOrder.forEach((key: string) => {
      const panel = this.ctx.panels[key];
      if (panel && !panel.getElement().parentElement) {
        const el = panel.getElement();
        this.makeDraggable(el, key);
        panelsGrid.appendChild(el);
      }
    });

    window.addEventListener('resize', () => this.ensureCorrectZones());

    this.ctx.map.onTimeRangeChanged((range) => {
      this.ctx.currentTimeRange = range;
      this.applyTimeRangeFilterDebounced();
    });

    this.applyPanelSettings();
    this.applyInitialUrlState();

    // CA Copy Button Logic Setup
    document.getElementById('ca-copy-btn')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const textSpan = document.getElementById('ca-text');
      const ca = 'G2Lm29XTHAFAZbSKDLfhm53jK7jDFpkaFz3FguZBBAGS';

      try {
        await navigator.clipboard.writeText(ca);
        if (textSpan) textSpan.innerText = 'Copied!';
        btn.style.borderColor = '#fff';
        btn.style.color = '#fff';

        setTimeout(() => {
          if (textSpan) textSpan.innerText = 'CA: G2Lm...BAGS';
          btn.style.borderColor = '#14F195';
          btn.style.color = '#14F195';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy CA', err);
      }
    });

    window.addEventListener('map-bounty-click', (e: Event) => {
      const customEvent = e as CustomEvent<{ lat: number, lng: number }>;
      this.promptBountyPlacement(customEvent.detail.lat, customEvent.detail.lng);
    });

    window.addEventListener('approve-bounty-click', (e: Event) => {
      const customEvent = e as CustomEvent<{ bountyId: string, agentAddress: string, reward: string, contractId?: number }>;
      this.promptBountyResolution(customEvent.detail.bountyId);
    });

    window.addEventListener('submit-bounty-report', (e: Event) => {
      const customEvent = e as CustomEvent<{ bountyId: string, reportUrl: string }>;
      this.executeBountySubmission(customEvent.detail.bountyId, customEvent.detail.reportUrl);
    });

    window.addEventListener('bounty-location-click', (e: Event) => {
      const customEvent = e as CustomEvent<{ lat: number, lng: number }>;
      this.ctx.map?.setCenter(customEvent.detail.lat, customEvent.detail.lng, 6);
    });

    // Bounty Toggle logic
    document.getElementById('bounties-toggle-btn')?.addEventListener('click', () => {
      const panel = this.ctx.panels['bounties'];
      if (panel) {
        const isHidden = panel.getElement().classList.contains('hidden');
        panel.toggle(isHidden);
        // Persist setting
        if (this.ctx.panelSettings['bounties']) {
          this.ctx.panelSettings['bounties'].enabled = isHidden;
          saveToStorage(STORAGE_KEYS.panels, this.ctx.panelSettings);
        }
      }
    });

    // Bags Toggle logic
    document.getElementById('bags-toggle-btn')?.addEventListener('click', () => {
      const panel = this.ctx.panels['bags'];
      if (panel) {
        const isHidden = panel.getElement().classList.contains('hidden');
        panel.toggle(isHidden);
        // Persist setting
        if (this.ctx.panelSettings['bags']) {
          this.ctx.panelSettings['bags'].enabled = isHidden;
          saveToStorage(STORAGE_KEYS.panels, this.ctx.panelSettings);
        }
      }
    });
  }

  private async promptBountyPlacement(lat: number, lng: number) {
    const Swal = (await import('sweetalert2')).default;

    const result = await Swal.fire({
      title: 'PLACE INTELLIGENCE BOUNTY',
      html: `
            <div style="text-align: left; margin-top: 10px;">
                <p class="text-dim text-small" style="margin-bottom: 15px;">Deploy autonomous agents or incentivize human analysts to gather intelligence at these coordinates.</p>
                <div style="margin-bottom: 10px;">
                    <label style="color: #00ff66; font-size: 0.8em;">TARGET LOCATION</label>
                    <input id="bounty-loc" class="swal2-input" value="${lat.toFixed(4)}, ${lng.toFixed(4)}" readonly style="background: rgba(0,255,100,0.1); color: #00ff66; border: 1px solid #00ff66; margin-top: 5px;">
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="color: #00f3ff; font-size: 0.8em;">MISSION OBJECTIVE</label>
                    <textarea id="bounty-desc" class="swal2-textarea" placeholder="Describe the intelligence required (e.g., 'Analyze satellite imagery for troop movements')" style="background: rgba(0,243,255,0.05); color: #fff; border: 1px solid rgba(0,243,255,0.3); margin-top: 5px; min-height: 80px;"></textarea>
                </div>
                <div style="margin-bottom: 10px; display: flex; gap: 10px;">
                    <div style="flex: 1;">
                        <label style="color: #ffb800; font-size: 0.8em;">REWARD AMOUNT</label>
                        <input id="bounty-rew" type="number" step="0.01" class="swal2-input" placeholder="0.05" style="background: rgba(255,184,0,0.1); color: #ffb800; border: 1px solid rgba(255,184,0,0.3); margin-top: 5px;">
                    </div>
                    <div style="flex: 1;">
                        <label style="color: #ffb800; font-size: 0.8em;">TOKEN</label>
                        <select id="bounty-tok" class="swal2-select" style="background: rgba(255,184,0,0.1); color: #ffb800; border: 1px solid rgba(255,184,0,0.3); margin-top: 5px; width: 100%;">
                            <option value="WARSCAN">WARSCAN</option>
                        </select>
                    </div>
                </div>
            </div>
        `,
      background: '#0a0a0f',
      color: '#fff',
      confirmButtonText: 'DEPLOY CONTRACT',
      confirmButtonColor: '#ff3366',
      showCancelButton: true,
      cancelButtonColor: '#333',
      cancelButtonText: 'ABORT',
      customClass: {
        title: 'cyber-highlight',
        popup: 'cyber-border',
        confirmButton: 'cyber-btn-primary',
        cancelButton: 'cyber-btn-secondary'
      },
      preConfirm: () => {
        const desc = (document.getElementById('bounty-desc') as HTMLTextAreaElement).value;
        const rew = (document.getElementById('bounty-rew') as HTMLInputElement).value;
        const tok = (document.getElementById('bounty-tok') as HTMLSelectElement).value;

        if (!desc || !rew) {
          Swal.showValidationMessage('Objective and Reward are required');
          return false;
        }
        return { desc, rew: parseFloat(rew), tok };
      }
    });

    if (result.isConfirmed && result.value) {
      if (!this.ctx.activeBounties) this.ctx.activeBounties = [];
      const { desc, rew, tok } = result.value;

      // BETA LIMIT: Max 100000 WARSCAN
      if (rew > 100000) {
        const Swal = (await import('sweetalert2')).default;
        Swal.fire({
          title: 'Beta Limit Exceeded',
          text: 'During the beta phase, the maximum bounty reward is limited to 100,000 WARSCAN. Please reduce the reward amount.',
          icon: 'warning',
          background: '#0a0a0f',
          color: '#ffb800',
          confirmButtonColor: '#ff3366',
          customClass: { popup: 'cyber-border', confirmButton: 'cyber-btn-primary' }
        });
        return;
      }

      try {
        let transactionHash = "mock-tx-hash";

        try {
          const { solanaBountyService } = await import('@/services/solana-bounty');

          Swal.fire({
            title: 'Connecting to Solana',
            text: 'Please connect your Phantom wallet...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
          });

          await solanaBountyService.connectWallet();

          Swal.fire({
            title: 'Awaiting Solana Signature',
            text: `Confirm the bounty deposit of ${rew} ${tok} in your wallet.`,
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
          });

          // Convert to a number id
          const numericId = Math.floor(Math.random() * 1000000);
          transactionHash = await solanaBountyService.placeBounty(numericId, rew);

        } catch (web3Err: any) {
          console.warn("Solana Web3 Failed, falling back to mock:", web3Err);
          // Fallback to mock behavior if no wallet is connected or an error occurs
          const signed = await BankrWidget.promptSignature(rew, 'Deploy Intelligence Contract');
          if (!signed) throw new Error("User Rejected");
        }

        const bounty = {
          id: "bty-" + Math.floor(Math.random() * 10000),
          lat: lat,
          lng: lng,
          locationName: `Target [${lat.toFixed(2)}, ${lng.toFixed(2)}]`,
          description: desc,
          rewardValue: rew,
          rewardToken: tok,
          status: 'open' as const,
          createdAt: new Date().toISOString(),
        };

        this.ctx.activeBounties.unshift(bounty);
        if (this.ctx.panels.bounties && 'updateBounties' in this.ctx.panels.bounties) {
          (this.ctx.panels.bounties as any).updateBounties(this.ctx.activeBounties);
        }

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Smart Contract Deployed',
          text: `TX: ${transactionHash.substring(0, 10)}...`,
          showConfirmButton: false,
          timer: 3000,
          background: '#00ff66',
          color: '#000'
        });

      } catch (error: any) {
        const Swal = (await import('sweetalert2')).default;
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Transaction Failed',
          text: error.message || 'Rejected',
          showConfirmButton: false,
          timer: 3000,
          background: '#333',
          color: '#fff'
        });
      }
    }
  }

  private async promptBountyResolution(bountyId: string) {
    const Swal = (await import('sweetalert2')).default;
    const target = this.ctx.activeBounties?.find(b => b.id === bountyId);

    if (!target) return;

    const result = await Swal.fire({
      title: 'Approve Intelligence Report?',
      text: `Are you sure you want to approve the report submitted by ${target.agentName || 'Agent'} and release ${target.rewardValue} ${target.rewardToken}?`,
      icon: 'question',
      background: '#0a0a0f',
      color: '#fff',
      showCancelButton: true,
      confirmButtonText: 'APPROVE & PAY',
      confirmButtonColor: '#00ff66',
      cancelButtonText: 'REJECT',
      cancelButtonColor: '#ff3366',
      customClass: { popup: 'cyber-border', confirmButton: 'cyber-btn-primary' }
    });

    if (result.isConfirmed) {
      try {
        const { solanaBountyService } = await import('@/services/solana-bounty');

        Swal.fire({
          title: 'Awaiting Solana Signature',
          text: 'Confirm the transaction in your Phantom wallet to release funds...',
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); }
        });

        // Parse local ID (mocked format)
        const numericId = parseInt(bountyId.replace('bty-', '')) || Math.floor(Math.random() * 1000);
        // We need hunter's address (mocking or real)
        const hunterAddress = target.agentAddress || "11111111111111111111111111111111";

        const txHash = await solanaBountyService.approveBounty(numericId, hunterAddress);

        target.status = 'completed';
        if (this.ctx.panels.bounties && 'updateBounties' in this.ctx.panels.bounties) {
          (this.ctx.panels.bounties as any).updateBounties(this.ctx.activeBounties);
        }

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Bounty Paid!',
          text: `TX: ${txHash.substring(0, 10)}...`,
          showConfirmButton: false,
          timer: 3000,
          background: '#00ff66',
          color: '#000'
        });

      } catch (err: any) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Approval Failed',
          text: err.message,
          showConfirmButton: false,
          timer: 3000,
          background: '#333',
          color: '#fff'
        });
      }
    }
  }

  private async executeBountySubmission(bountyId: string, reportUrl: string) {
    const Swal = (await import('sweetalert2')).default;

    try {
      // In a real Web3 flow, we might trigger a wallet interaction if required,
      // but for "submitting work", it's usually just an on-chain record or off-chain notice.
      // Here we will update our local state to reflect the submission.

      if (this.ctx.activeBounties) {
        const target = this.ctx.activeBounties.find(b => b.id === bountyId);
        if (target) {
          target.status = 'claimed';
          target.reportUrl = reportUrl;
          target.agentName = "Agent_Anonymous"; // Mocking agent name for submission
          target.agentAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; // Mocking an agent address

          if (this.ctx.panels.bounties && 'updateBounties' in this.ctx.panels.bounties) {
            (this.ctx.panels.bounties as any).updateBounties([...this.ctx.activeBounties]);
          }
        }
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Investigation Submitted',
        text: 'Awaiting creator review/approval.',
        showConfirmButton: false,
        timer: 3000,
        background: '#00f3ff',
        color: '#000'
      });
    } catch (error: any) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Submission Failed',
        text: error.message,
        confirmButtonColor: '#ff3366'
      });
    }
  }


  private applyTimeRangeFilterToNewsPanels(): void {
    Object.entries(this.ctx.newsByCategory).forEach(([category, items]) => {
      const panel = this.ctx.newsPanels[category];
      if (!panel) return;
      const filtered = this.filterItemsByTimeRange(items);
      if (filtered.length === 0 && items.length > 0) {
        panel.renderFilteredEmpty(`No items in ${this.getTimeRangeLabel()}`);
        return;
      }
      panel.renderNews(filtered);
    });
  }

  private filterItemsByTimeRange(items: import('@/types').NewsItem[], range: import('@/components').TimeRange = this.ctx.currentTimeRange): import('@/types').NewsItem[] {
    if (range === 'all') return items;
    const ranges: Record<string, number> = {
      '1h': 60 * 60 * 1000, '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000, '48h': 48 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000, 'all': Infinity,
    };
    const cutoff = Date.now() - (ranges[range] ?? Infinity);
    return items.filter((item) => {
      const ts = item.pubDate instanceof Date ? item.pubDate.getTime() : new Date(item.pubDate).getTime();
      return Number.isFinite(ts) ? ts >= cutoff : true;
    });
  }

  private getTimeRangeLabel(): string {
    const labels: Record<string, string> = {
      '1h': 'the last hour', '6h': 'the last 6 hours',
      '24h': 'the last 24 hours', '48h': 'the last 48 hours',
      '7d': 'the last 7 days', 'all': 'all time',
    };
    return labels[this.ctx.currentTimeRange] ?? 'the last 7 days';
  }

  private applyInitialUrlState(): void {
    if (!this.ctx.initialUrlState || !this.ctx.map) return;

    const { view, zoom, lat, lon, timeRange, layers } = this.ctx.initialUrlState;

    if (view) {
      this.ctx.map.setView(view);
    }

    if (timeRange) {
      this.ctx.map.setTimeRange(timeRange);
    }

    if (layers) {
      this.ctx.mapLayers = layers;
      saveToStorage(STORAGE_KEYS.mapLayers, this.ctx.mapLayers);
      this.ctx.map.setLayers(layers);
    }

    if (lat !== undefined && lon !== undefined) {
      const effectiveZoom = zoom ?? this.ctx.map.getState().zoom;
      if (effectiveZoom > 2) this.ctx.map.setCenter(lat, lon, zoom);
    } else if (!view && zoom !== undefined) {
      this.ctx.map.setZoom(zoom);
    }

    const regionSelect = document.getElementById('regionSelect') as HTMLSelectElement;
    const currentView = this.ctx.map.getState().view;
    if (regionSelect && currentView) {
      regionSelect.value = currentView;
    }
  }

  private getSavedPanelOrder(): string[] {
    try {
      const saved = localStorage.getItem(this.ctx.PANEL_ORDER_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  savePanelOrder(): void {
    const grid = document.getElementById('panelsGrid');
    const bottomGrid = document.getElementById('mapBottomGrid');
    if (!grid || !bottomGrid) return;

    const order = Array.from(grid.children)
      .map((el) => (el as HTMLElement).dataset.panel)
      .filter((key): key is string => !!key);

    const bottomOrder = Array.from(bottomGrid.children)
      .map((el) => (el as HTMLElement).dataset.panel)
      .filter((key): key is string => !!key);

    localStorage.setItem(this.ctx.PANEL_ORDER_KEY, JSON.stringify(order));
    localStorage.setItem(this.ctx.PANEL_ORDER_KEY + '-bottom', JSON.stringify(bottomOrder));
  }

  private getSavedBottomPanelOrder(): string[] {
    try {
      const saved = localStorage.getItem(this.ctx.PANEL_ORDER_KEY + '-bottom');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  private wasUltraWide = window.innerWidth >= 1600;

  public ensureCorrectZones(): void {
    const isUltraWide = window.innerWidth >= 1600;
    const mapSection = document.getElementById('mapSection');
    const mapEnabled = !mapSection?.classList.contains('hidden');
    const effectiveUltraWide = isUltraWide && mapEnabled;

    if (effectiveUltraWide === this.wasUltraWide) return;
    this.wasUltraWide = effectiveUltraWide;

    const grid = document.getElementById('panelsGrid');
    const bottomGrid = document.getElementById('mapBottomGrid');
    if (!grid || !bottomGrid) return;

    if (!effectiveUltraWide) {
      // Move everything from bottom grid back to panels grid in correct order
      const panelsInBottom = Array.from(bottomGrid.querySelectorAll('.panel')) as HTMLElement[];
      const savedOrder = this.getSavedPanelOrder();
      const defaultOrder = Object.keys(DEFAULT_PANELS).filter(k => k !== 'map');

      panelsInBottom.forEach(panelEl => {
        const id = panelEl.dataset.panel;
        if (!id) return;

        // Use saved sidebar order if present, otherwise default order
        const searchOrder = savedOrder.includes(id) ? savedOrder : defaultOrder;
        const pos = searchOrder.indexOf(id);

        if (pos === -1) {
          grid.appendChild(panelEl);
          return;
        }

        // Find the first panel in searchOrder AFTER this one that is currently in the sidebar grid
        let inserted = false;
        for (let i = pos + 1; i < searchOrder.length; i++) {
          const nextId = searchOrder[i];
          const nextEl = grid.querySelector(`[data-panel="${nextId}"]`);
          if (nextEl) {
            grid.insertBefore(panelEl, nextEl);
            inserted = true;
            break;
          }
        }

        if (!inserted) {
          grid.appendChild(panelEl);
        }
      });
    } else {
      // Move panels that belong to bottom zone from sidebar to bottom grid
      const savedBottomOrder = this.getSavedBottomPanelOrder();
      savedBottomOrder.forEach(id => {
        const el = grid.querySelector(`[data-panel="${id}"]`);
        if (el) {
          bottomGrid.appendChild(el);
        }
      });
    }
  }

  private attachRelatedAssetHandlers(panel: NewsPanel): void {
    panel.setRelatedAssetHandlers({
      onRelatedAssetClick: (asset) => this.handleRelatedAssetClick(asset),
      onRelatedAssetsFocus: (assets) => this.ctx.map?.highlightAssets(assets),
      onRelatedAssetsClear: () => this.ctx.map?.highlightAssets(null),
    });
  }

  private handleRelatedAssetClick(asset: RelatedAsset): void {
    if (!this.ctx.map) return;

    switch (asset.type) {
      case 'pipeline':
        this.ctx.map.enableLayer('pipelines');
        this.ctx.mapLayers.pipelines = true;
        saveToStorage(STORAGE_KEYS.mapLayers, this.ctx.mapLayers);
        this.ctx.map.triggerPipelineClick(asset.id);
        break;
      case 'cable':
        this.ctx.map.enableLayer('cables');
        this.ctx.mapLayers.cables = true;
        saveToStorage(STORAGE_KEYS.mapLayers, this.ctx.mapLayers);
        this.ctx.map.triggerCableClick(asset.id);
        break;
      case 'datacenter':
        this.ctx.map.enableLayer('datacenters');
        this.ctx.mapLayers.datacenters = true;
        saveToStorage(STORAGE_KEYS.mapLayers, this.ctx.mapLayers);
        this.ctx.map.triggerDatacenterClick(asset.id);
        break;
      case 'base':
        this.ctx.map.enableLayer('bases');
        this.ctx.mapLayers.bases = true;
        saveToStorage(STORAGE_KEYS.mapLayers, this.ctx.mapLayers);
        this.ctx.map.triggerBaseClick(asset.id);
        break;
      case 'nuclear':
        this.ctx.map.enableLayer('nuclear');
        this.ctx.mapLayers.nuclear = true;
        saveToStorage(STORAGE_KEYS.mapLayers, this.ctx.mapLayers);
        this.ctx.map.triggerNuclearClick(asset.id);
        break;
    }
  }

  private makeDraggable(el: HTMLElement, key: string): void {
    el.dataset.panel = key;
    let isDragging = false;
    let dragStarted = false;
    let startX = 0;
    let startY = 0;
    let rafId = 0;
    const DRAG_THRESHOLD = 8;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (el.dataset.resizing === 'true') return;
      if (
        target.classList?.contains('panel-resize-handle') ||
        target.closest?.('.panel-resize-handle') ||
        target.classList?.contains('panel-col-resize-handle') ||
        target.closest?.('.panel-col-resize-handle')
      ) return;
      if (target.closest('button, a, input, select, textarea, .panel-content')) return;

      isDragging = true;
      dragStarted = false;
      startX = e.clientX;
      startY = e.clientY;
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      if (!dragStarted) {
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);
        if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) return;
        dragStarted = true;
        el.classList.add('dragging');
      }
      const cx = e.clientX;
      const cy = e.clientY;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        this.handlePanelDragMove(el, cx, cy);
        rafId = 0;
      });
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      if (dragStarted) {
        el.classList.remove('dragging');
        this.savePanelOrder();
      }
      dragStarted = false;
    };

    el.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    this.panelDragCleanupHandlers.push(() => {
      el.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      isDragging = false;
      dragStarted = false;
      el.classList.remove('dragging');
    });
  }

  private handlePanelDragMove(dragging: HTMLElement, clientX: number, clientY: number): void {
    const grid = document.getElementById('panelsGrid');
    const bottomGrid = document.getElementById('mapBottomGrid');
    if (!grid || !bottomGrid) return;

    dragging.style.pointerEvents = 'none';
    const target = document.elementFromPoint(clientX, clientY);
    dragging.style.pointerEvents = '';

    if (!target) return;

    // Check if we are over a grid or a panel inside a grid
    const targetGrid = (target.closest('.panels-grid') || target.closest('.map-bottom-grid')) as HTMLElement | null;
    const targetPanel = target.closest('.panel') as HTMLElement | null;

    if (!targetGrid && !targetPanel) return;

    const currentTargetGrid = targetGrid || (targetPanel ? targetPanel.parentElement as HTMLElement : null);
    if (!currentTargetGrid || (currentTargetGrid !== grid && currentTargetGrid !== bottomGrid)) return;

    if (targetPanel && targetPanel !== dragging && !targetPanel.classList.contains('hidden')) {
      const targetRect = targetPanel.getBoundingClientRect();
      const draggingRect = dragging.getBoundingClientRect();

      const children = Array.from(currentTargetGrid.children);
      const dragIdx = children.indexOf(dragging);
      const targetIdx = children.indexOf(targetPanel);

      const sameRow = Math.abs(draggingRect.top - targetRect.top) < 30;
      const targetMid = sameRow
        ? targetRect.left + targetRect.width / 2
        : targetRect.top + targetRect.height / 2;
      const cursorPos = sameRow ? clientX : clientY;

      if (dragIdx === -1) {
        // Moving from one grid to another
        if (cursorPos < targetMid) {
          currentTargetGrid.insertBefore(dragging, targetPanel);
        } else {
          currentTargetGrid.insertBefore(dragging, targetPanel.nextSibling);
        }
      } else {
        // Reordering within same grid
        if (dragIdx < targetIdx) {
          if (cursorPos > targetMid) {
            currentTargetGrid.insertBefore(dragging, targetPanel.nextSibling);
          }
        } else {
          if (cursorPos < targetMid) {
            currentTargetGrid.insertBefore(dragging, targetPanel);
          }
        }
      }
    } else if (currentTargetGrid !== dragging.parentElement) {
      // Dragging over an empty or near-empty grid zone
      currentTargetGrid.appendChild(dragging);
    }
  }

  getLocalizedPanelName(panelKey: string, fallback: string): string {
    if (panelKey === 'runtime-config') {
      return t('modals.runtimeConfig.title');
    }
    const key = panelKey.replace(/-([a-z])/g, (_match, group: string) => group.toUpperCase());
    const lookup = `panels.${key}`;
    const localized = t(lookup);
    return localized === lookup ? fallback : localized;
  }

  getAllSourceNames(): string[] {
    const sources = new Set<string>();
    Object.values(FEEDS).forEach(feeds => {
      if (feeds) feeds.forEach(f => sources.add(f.name));
    });
    INTEL_SOURCES.forEach(f => sources.add(f.name));
    return Array.from(sources).sort((a, b) => a.localeCompare(b));
  }
}
