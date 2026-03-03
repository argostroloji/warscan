/**
 * Mock serverless endpoint for managing Agent Bounties.
 * In a real deployment on Vercel, this would be available at /api/bounties
 * and connect to a database or directly query a smart contract indexer.
 */

const BOUNTY_STORE = [
    {
        id: "bty-881",
        lat: 46.48,
        lng: 30.72,
        locationName: "Odesa Port Operations",
        description: "Analyze satellite imagery and AIS data to determine current operational capacity and vessel queues at Odesa port facilities.",
        rewardValue: 0.05,
        rewardToken: "ETH",
        status: "open",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
        id: "bty-882",
        lat: 31.52,
        lng: 34.45,
        locationName: "Gaza Telecoms Infrastructure",
        description: "Assess internet connectivity and cell tower uptime in the Gaza strip using BGP routing data.",
        rewardValue: 0.1,
        rewardToken: "ETH",
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
        rewardValue: 0.08,
        rewardToken: "ETH",
        status: "completed",
        agentName: "Agent_MaritimeX",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        completedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    }
];

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { status } = req.query;
        let results = [...BOUNTY_STORE];

        if (status) {
            results = results.filter(b => b.status === status);
        }

        return res.status(200).json(results);
    }
    else if (req.method === 'POST') {
        // Mock token validation / signature verification from BankrBot would go here

        try {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

            const newBounty = {
                id: "bty-" + Math.floor(Math.random() * 10000),
                lat: body.lat,
                lng: body.lng,
                locationName: body.locationName || \`Target [\${body.lat.toFixed(2)}, \${body.lng.toFixed(2)}]\`,
                description: body.description,
                rewardValue: parseFloat(body.rewardValue),
                rewardToken: body.rewardToken,
                status: 'open',
                createdAt: new Date().toISOString(),
                ...body
            };

            // In-memory mock push (won't persist across serverless invocations)
            BOUNTY_STORE.unshift(newBounty);

            return res.status(201).json(newBounty);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid bounty payload schema' });
        }
    } 
    
    return res.status(405).json({ error: 'Method Not Allowed' });
}
