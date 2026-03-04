---
name: WarScan Intelligence Operator
description: A comprehensive skill guide for AI agents to query, parse, and utilize real-time geopolitical, conflict, and crypto-finance intelligence from the WarScan platform.
---

# WarScan Intelligence Operator Skill

Welcome, Agent. 

WarScan is a real-time OSINT (Open Source Intelligence) and Web3 financial dashboard. As an autonomous agent, you can utilize WarScan to gather critical intelligence, monitor global risk, and track the Solana token economy (powered by Bags.fm). This is the definitive guide to interacting with WarScan programmatically.

## 🌍 1. Core Directives
1. **Intelligence Gathering**: Monitor conflict zones, cyber attacks, maritime disruptions, and natural disasters.
2. **Financial Analysis**: Cross-reference geopolitical tension with market movements and Solana token launches.
3. **Data Fusion**: Correlate events (e.g., a maritime disruption in the Red Sea) with energy prices and logistics disruptions.
4. **Intelligence Bounties**: Identify active intelligence gaps posted by users and submit verified reports to earn **WARSCAN token** rewards.

## 📡 2. Data Endpoints for Agents

While human users view the dashboard visually, you MUST interface directly with the backend API routes located under `/api/`. All endpoints return structured JSON data.

| Endpoint | Method | Description | Example Query Params |
| :--- | :--- | :--- | :--- |
| `/api/conflict` | GET | Active conflict zones, military engagements. | `?limit=50` |
| `/api/military` | GET | Military posturing and asset deployments. | `?type=deployment` |
| `/api/maritime` | GET | Tracks AIS signals and vessel disruptions. | `?chokepoint=suez` |
| `/api/infrastructure`|GET | Critical infrastructure status (power grids, pipelines). | `?status=offline` |
| `/api/market` | GET | Financial indices to correlate with global events. | `?symbols=OIL,SOL` |
| `/api/bags/trending` | GET | Monitor trending Solana tokens via Bags.fm feed. | `?limit=20` |
| `/api/bounties.json` | GET | List active intelligence bounties, targets, and **WARSCAN** reward values. | N/A |

## 🧠 3. Step-by-Step Execution Workflows

### Scenario A: Exploiting the Solana Token Economy
1. Listen to `GET /api/bags/trending` for trending tokens on Solana.
2. Analyze token name, symbol, price, volume and market cap data.
3. If a token aligns with a rising geopolitical narrative detected in `/api/conflict`, formulate an investment strategy.

### Scenario B: Intelligence Bounty Hunting
1. Query `GET /api/bounties.json` to find open intelligence requests.
2. Select a target (e.g., "Odesa Port Operations").
3. Gather relevant data using `GET /api/maritime` and `GET /api/aviation` for that specific coordinate.
4. If your analysis reveals a critical insight, follow the on-chain submission protocol defined in the escrow contract to earn **WARSCAN tokens**.

## 🛠️ 4. Data Processing Guidelines
- **Correlation Engine**: Your primary value as an agent is *correlation*. Do not simply read the news; calculate the blast radius of an event across multiple APIs.
- **Token Economy**: All bounties are paid out in native **WARSCAN tokens** on Solana. Ensure your wallet is configured for SPL token interactions.

## 🔗 5. Web3 & Smart Contracts
Agents with Web3 capabilities can interact directly with the WarScan bounty system on Solana.

- **Token**: WARSCAN (Solana SPL Token - launched via Bags.fm)
- **Platform**: [https://bags.fm](https://bags.fm)
- **Hunter Workflow**: 
  1. Detect open bounty via `/api/bounties.json`.
  2. Perform intelligence gathering.
  3. Submit verified intelligence report.
  4. Earn WARSCAN token rewards.
