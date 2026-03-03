import { Panel } from './Panel';

export interface AgentBounty {
    id: string;
    lat: number;
    lng: number;
    locationName: string;
    description: string;
    rewardValue: number;
    rewardToken: string;
    status: 'open' | 'claimed' | 'completed';
    agentName?: string;
    agentAddress?: string;
    creator?: string;
    createdAt: string;
    completedAt?: string;
    reportUrl?: string;
    contractId?: number;
}

export class BountyPanel extends Panel {
    private activeBounties: AgentBounty[] = [];
    private selectedBountyId: string | null = null;
    private unsubscribe: (() => void) | null = null;
    private readonly defaultBounties: AgentBounty[] = [
        {
            id: "bty-881",
            lat: 46.48,
            lng: 30.72,
            locationName: "Odesa Port Operations",
            description: "Analyze satellite imagery and AIS data to determine current operational capacity and vessel queues at Odesa port facilities.",
            rewardValue: 50,
            rewardToken: "WARSCAN",
            status: "open",
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
            id: "bty-882",
            lat: 31.52,
            lng: 34.45,
            locationName: "Gaza Telecoms Infrastructure",
            description: "Assess internet connectivity and cell tower uptime in the Gaza strip using BGP routing data.",
            rewardValue: 100,
            rewardToken: "WARSCAN",
            status: "claimed",
            agentName: "Agent_Sentinel",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
            id: "bty-883",
            lat: 12.55,
            lng: 43.25,
            locationName: "Bab el-Mandeb Strait",
            description: "Identify any military vessel escorts accompanying commercial tankers through the strait over the past 24 hours.",
            rewardValue: 80,
            rewardToken: "WARSCAN",
            status: "completed",
            agentName: "Agent_MaritimeX",
            createdAt: new Date(Date.now() - 1000 * 60 * 24 * 3).toISOString(),
            completedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        }
    ];

    constructor(containerId: string, title: string = 'ACTIVE BOUNTIES') {
        super({
            id: containerId,
            title: title,
            className: 'bounty-panel col-span-1',
            showCount: true
        });

        this.activeBounties = [...this.defaultBounties];
        // Subscribe to context updates if we implemented a global bounty store
        // this.unsubscribe = window.appContext.subscribe(state => {
        //   if (state.bounties && state.bounties !== this.activeBounties) {
        //     this.activeBounties = state.bounties;
        //     this.render();
        //   }
        // });

        // Simulate live incoming bounties eventually
        this.render();
        this.setupEventListeners();
    }

    public updateBounties(bounties: AgentBounty[]) {
        this.activeBounties = bounties;
        this.render();
    }

    public destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        super.destroy();
    }

    public render(): void {
        if (!this.content) return;

        this.setCount(this.activeBounties.length);

        if (this.activeBounties.length === 0) {
            this.setContent(`
        <div class="empty-state text-dim" style="padding: 1rem; text-align: center;">
          No active bounties. Right-click the map to post a new intelligence request.
        </div>
      `);
            return;
        }

        let html = '<div class="bounty-list" style="display: flex; flex-direction: column; gap: 8px;">';

        for (const bounty of this.activeBounties) {

            let statusClass = 'text-dim';
            let statusText = 'OPEN';
            let statusIcon = '🎯';

            if (bounty.status === 'claimed') {
                statusClass = 'cyber-highlight text-blink';
                statusText = 'CLAIMED BY ' + bounty.agentName?.toUpperCase();
                statusIcon = '🤖';
            } else if (bounty.status === 'completed') {
                statusClass = 'glow-green';
                statusText = 'COMPLETED';
                statusIcon = '✅';
            }

            const isSelected = this.selectedBountyId === bounty.id;

            let actionButton = '';
            if (bounty.status === 'claimed') {
                actionButton = `<button class="intel-btn approve-btn" data-id="${bounty.id}" data-contract-id="${bounty.contractId ?? ''}" data-agent="${bounty.agentAddress || ''}" data-reward="${bounty.rewardValue}" style="background: rgba(255, 51, 102, 0.2); border: 1px solid #ff3366; color: #ff3366; padding: 2px 8px; border-radius: 2px; font-size: 0.7em; cursor: pointer; transition: all 0.2s;">APPROVE & PAY</button>`;
            } else if (bounty.status === 'completed') {
                actionButton = `<button class="intel-btn" style="background: transparent; border: 1px solid #00ff66; color: #00ff66; padding: 2px 8px; border-radius: 2px; font-size: 0.7em; cursor: pointer; transition: all 0.2s;">VIEW REPORT</button>`;
            }

            html += `
        <div class="data-row hover-glitch interactable bounty-item ${isSelected ? 'selected' : ''}" data-id="${bounty.id}" data-lat="${bounty.lat}" data-lng="${bounty.lng}" style="flex-direction: column; align-items: flex-start; gap: 4px; padding: 10px; border-left: 3px solid ${bounty.status === 'open' ? '#ff3366' : bounty.status === 'claimed' ? '#00f3ff' : '#00ff66'}; cursor: pointer; background: ${isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent'}; margin-bottom: 4px; transition: all 0.2s;">
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; pointer-events: none;">
                <span class="cyber-highlight" style="font-weight: bold; font-size: 1em;">${statusIcon} ${bounty.locationName.toUpperCase()}</span>
                <span class="bounty-reward" style="background: rgba(0, 255, 100, 0.1); color: #00ff66; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-family: monospace; border: 1px solid rgba(0, 255, 100, 0.2);">
                    ${bounty.rewardValue} ${bounty.rewardToken}
                </span>
            </div>
            
            <div class="text-small text-dim" style="line-height: 1.4; margin-top: 4px; margin-bottom: 4px; pointer-events: none; ${isSelected ? 'white-space: normal;' : 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;'}">
                ${bounty.description}
            </div>

            ${isSelected ? `
                <div class="bounty-details" style="width: 100%; margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgba(255, 255, 255, 0.1);">
                    ${bounty.status === 'open' ? `
                        <div class="submission-form" style="display: flex; flex-direction: column; gap: 8px;">
                            <span class="text-small cyber-highlight">SUBMIT INVESTIGATION REPORT:</span>
                            <div style="display: flex; gap: 4px;">
                                <input type="text" class="cyber-input submission-url" placeholder="Enter IPFS/Report URL..." style="flex: 1; min-width: 0; background: rgba(0,0,0,0.3); border: 1px solid var(--accent); color: white; padding: 4px 8px; font-size: 0.8em;">
                                <button class="cyber-btn submit-btn" data-id="${bounty.id}" style="padding: 4px 12px; font-size: 0.8em;">SUBMIT</button>
                            </div>
                        </div>
                    ` : bounty.status === 'claimed' ? `
                        <div class="review-flow" style="display: flex; flex-direction: column; gap: 8px;">
                             <span class="text-small cyber-highlight">SUBMITTED REPORT:</span>
                             <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0, 243, 255, 0.05); padding: 6px; border-radius: 4px; border: 1px solid rgba(0, 243, 255, 0.2);">
                                <a href="${bounty.reportUrl || '#'}" target="_blank" class="text-small" style="color: #00f3ff; text-decoration: underline; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">${bounty.reportUrl || 'View Investigation'}</a>
                                ${actionButton}
                             </div>
                        </div>
                    ` : `
                        <div class="completed-flow">
                            <span class="text-small glow-green">✓ INVESTIGATION PAID & ARCHIVED</span>
                            <div style="margin-top: 4px;">
                                <a href="${bounty.reportUrl || '#'}" target="_blank" class="text-small" style="color: #00ff66; text-decoration: underline;">View Archived Report</a>
                            </div>
                        </div>
                    `}
                </div>
            ` : `
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; margin-top: 4px; pointer-events: none;">
                    <span class="text-small ${statusClass}" style="font-family: monospace; font-size: 0.75em;">
                        [STATUS: ${statusText}]
                    </span>
                    ${bounty.status === 'claimed' ? '<span class="text-tiny" style="color: var(--accent);">[REVIEW REQUIRED]</span>' : ''}
                </div>
            `}
        </div>
        `;
        }

        html += '</div>';
        this.setContent(html);
    }

    private setupEventListeners(): void {
        if (!this.content) return;

        this.content.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            // 1. Approve & Pay Button
            const approveBtn = target.closest('.approve-btn');
            if (approveBtn) {
                e.stopPropagation();
                const bountyId = approveBtn.getAttribute('data-id');
                const agentAddress = approveBtn.getAttribute('data-agent');
                const reward = approveBtn.getAttribute('data-reward');
                const contractIdStr = approveBtn.getAttribute('data-contract-id');
                const contractId = contractIdStr ? parseInt(contractIdStr) : undefined;

                window.dispatchEvent(new CustomEvent('approve-bounty-click', {
                    detail: { bountyId, agentAddress, reward, contractId }
                }));
                return;
            }

            // 2. Submit Button
            const submitBtn = target.closest('.submit-btn');
            if (submitBtn) {
                e.stopPropagation();
                const bountyId = submitBtn.getAttribute('data-id');
                const row = submitBtn.closest('.bounty-item');
                const urlInput = row?.querySelector('.submission-url') as HTMLInputElement;
                const reportUrl = urlInput?.value;

                if (!reportUrl) {
                    alert('Please enter a report URL');
                    return;
                }

                window.dispatchEvent(new CustomEvent('submit-bounty-report', {
                    detail: { bountyId, reportUrl }
                }));
                return;
            }

            // 3. Input Click (Prevent closing)
            if (target.closest('.cyber-input')) {
                e.stopPropagation();
                return;
            }

            // 4. Row Click (Expand/Collapse + Center Map)
            const row = target.closest('.bounty-item');
            if (row) {
                const id = row.getAttribute('data-id');
                const lat = parseFloat(row.getAttribute('data-lat') || '0');
                const lng = parseFloat(row.getAttribute('data-lng') || '0');

                if (this.selectedBountyId === id) {
                    this.selectedBountyId = null;
                } else {
                    this.selectedBountyId = id;
                    window.dispatchEvent(new CustomEvent('bounty-location-click', {
                        detail: { lat, lng }
                    }));
                }
                this.render();
            }
        });
    }
}
