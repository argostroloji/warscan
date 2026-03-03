// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title WarScanBountyEscrow
 * @dev Escrow system for Web3 Intelligence Bounties using WARSCAN ERC-20 tokens.
 */
contract WarScanBountyEscrow {
    
    IERC20 public immutable warscanToken;
    
    // Max bounty limit in token units (e.g., 10,000 tokens)
    uint256 public constant MAX_BOUNTY_REWARD = 10000 * 10**18; 

    struct Bounty {
        address creator;
        string objective;
        uint256 reward;
        bool isActive;
    }

    // bountyId => Bounty
    mapping(uint256 => Bounty) public bounties;
    uint256 public nextBountyId;

    event BountyCreated(uint256 indexed bountyId, address indexed creator, string objective, uint256 reward);
    event WorkSubmitted(uint256 indexed bountyId, string proofUri);
    event WorkApproved(uint256 indexed bountyId, address indexed winner, uint256 reward);
    event BountyRefunded(uint256 indexed bountyId, address indexed creator);

    constructor(address _tokenAddress) {
        require(_tokenAddress != address(0), "Invalid token address");
        warscanToken = IERC20(_tokenAddress);
    }

    /**
     * @dev Places a new intelligence bounty and locks the WARSCAN tokens.
     * @param _objective The description of what needs to be researched/analyzed.
     * @param _reward The amount of tokens to lock for this bounty.
     */
    function createBounty(string memory _objective, uint256 _reward) external returns (uint256) {
        require(_reward > 0, "Reward must be greater than 0");
        require(_reward <= MAX_BOUNTY_REWARD, "Exceeds max test limit");

        // Transfer tokens from creator to this contract
        bool success = warscanToken.transferFrom(msg.sender, address(this), _reward);
        require(success, "Token transfer failed. Did you approve?");

        uint256 bountyId = nextBountyId++;
        
        bounties[bountyId] = Bounty({
            creator: msg.sender,
            objective: _objective,
            reward: _reward,
            isActive: true
        });

        emit BountyCreated(bountyId, msg.sender, _objective, _reward);

        return bountyId;
    }

    /**
     * @dev Agents call this to submit their proof of work.
     */
    function submitWork(uint256 _bountyId, string memory _proofUri) external {
        require(bounties[_bountyId].isActive, "Bounty is not active");
        emit WorkSubmitted(_bountyId, _proofUri);
    }

    /**
     * @dev Creator approves the submitted work and pays out the winner in tokens.
     */
    function approveWork(uint256 _bountyId, address _winner) external {
        Bounty storage bounty = bounties[_bountyId];
        
        require(bounty.isActive, "Bounty is not active");
        require(msg.sender == bounty.creator, "Only creator can approve");
        require(_winner != address(0), "Invalid winner address");

        bounty.isActive = false;
        
        uint256 payout = bounty.reward;
        bounty.reward = 0;

        bool success = warscanToken.transfer(_winner, payout);
        require(success, "Payout transfer failed");

        emit WorkApproved(_bountyId, _winner, payout);
    }

    /**
     * @dev Creator reclaims tokens if no adequate work was submitted.
     */
    function refundBounty(uint256 _bountyId) external {
        Bounty storage bounty = bounties[_bountyId];
        
        require(bounty.isActive, "Bounty is not active");
        require(msg.sender == bounty.creator, "Only creator can refund");

        bounty.isActive = false;
        
        uint256 refundAmount = bounty.reward;
        bounty.reward = 0;

        bool success = warscanToken.transfer(bounty.creator, refundAmount);
        require(success, "Refund transfer failed");

        emit BountyRefunded(_bountyId, bounty.creator);
    }
}
