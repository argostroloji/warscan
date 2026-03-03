import { expect } from "chai";
import hre from "hardhat";

describe("WarScanBountyEscrow", function () {
    async function deployEscrowFixture() {
        const [owner, agent1, agent2] = await hre.ethers.getSigners();
        const Escrow = await hre.ethers.getContractFactory("WarScanBountyEscrow");
        const escrow = await Escrow.deploy();
        return { escrow, owner, agent1, agent2 };
    }

    describe("Deployment", function () {
        it("Should deploy successfully with correct max bounty", async function () {
            const { escrow } = await deployEscrowFixture();
            expect(await escrow.MAX_BOUNTY_REWARD()).to.equal(hre.ethers.parseEther("0.0035"));
        });
    });

    describe("Bounty Creation", function () {
        it("Should create a bounty and lock funds", async function () {
            const { escrow, owner } = await deployEscrowFixture();

            const reward = hre.ethers.parseEther("0.001");
            await expect(escrow.createBounty("Find the ship", { value: reward }))
                .to.emit(escrow, "BountyCreated")
                .withArgs(0, owner.address, "Find the ship", reward);

            const bounty = await escrow.bounties(0);
            expect(bounty.creator).to.equal(owner.address);
            expect(bounty.reward).to.equal(reward);
            expect(bounty.isActive).to.be.true;
        });

        it("Should revert if reward exceeds maximum", async function () {
            const { escrow } = await deployEscrowFixture();
            const tooMuch = hre.ethers.parseEther("0.01"); // > 0.0035
            await expect(escrow.createBounty("Too big", { value: tooMuch }))
                .to.be.revertedWith("Exceeds $10 max test limit");
        });
    });

    describe("Bounty Resolution", function () {
        it("Creator can approve work and payout agent", async function () {
            const { escrow, owner, agent1 } = await deployEscrowFixture();
            const reward = hre.ethers.parseEther("0.002");
            await escrow.createBounty("Analyze photo", { value: reward });

            // Agent submits work (just emits event, no state change to reward yet)
            await expect(escrow.connect(agent1).submitWork(0, "ipfs://QmHash"))
                .to.emit(escrow, "WorkSubmitted")
                .withArgs(0, "ipfs://QmHash");

            // Creator approves and pays
            await expect(escrow.approveWork(0, agent1.address))
                .to.emit(escrow, "WorkApproved")
                .withArgs(0, agent1.address, reward);

            const bounty = await escrow.bounties(0);
            expect(bounty.isActive).to.be.false;
            expect(bounty.reward).to.equal(0);
        });

        it("Agents cannot approve their own work", async function () {
            const { escrow, agent1 } = await deployEscrowFixture();
            const reward = hre.ethers.parseEther("0.001");
            await escrow.createBounty("Find location", { value: reward });

            await expect(escrow.connect(agent1).approveWork(0, agent1.address))
                .to.be.revertedWith("Only creator can approve");
        });

        it("Creator can refund an active bounty", async function () {
            const { escrow, owner } = await deployEscrowFixture();
            const reward = hre.ethers.parseEther("0.001");

            // Track balance before refund but after creation gas costs are done
            await escrow.createBounty("Cancel this", { value: reward });

            await expect(escrow.refundBounty(0))
                .to.emit(escrow, "BountyRefunded")
                .withArgs(0, owner.address);

            const bounty = await escrow.bounties(0);
            expect(bounty.isActive).to.be.false;
            expect(bounty.reward).to.equal(0);
        });
    });
});
