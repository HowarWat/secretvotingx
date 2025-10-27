// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint8, ebool, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SecretVoting - Privacy-preserving voting system using FHEVM
/// @notice All votes and counts are encrypted throughout the voting process
/// @dev Uses homomorphic encryption for vote tallying without revealing individual choices
contract SecretVoting is SepoliaConfig {
    struct Proposal {
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint8 optionCount;
        bool finalized;
        address owner;
        ResultDisclosureStrategy strategy;
        uint256 minQuorum; // minimum number of votes required
    }

    enum ResultDisclosureStrategy {
        PUBLIC_AFTER_END,      // Results public to everyone after voting ends
        OWNER_ONLY,            // Results only to proposal owner
        QUALIFIED_ONLY         // Results to addresses with decryption permission
    }

    struct ProposalResults {
        euint32[] optionVotes;  // Encrypted vote count for each option
        euint32 totalVotes;     // Encrypted total vote count
    }

    // Proposal storage
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => ProposalResults) private proposalResults;
    mapping(uint256 => mapping(address => ebool)) private hasVoted;
    mapping(uint256 => mapping(address => bool)) private hasVotedClear; // Clear-text flag for double-vote prevention
    
    // Role management
    mapping(address => bool) public proposers;
    mapping(address => bool) public administrators;
    address public owner;
    
    uint256 public proposalCount;
    uint256 public defaultVotingDuration = 7 days;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed owner,
        string title,
        uint8 optionCount,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter
    );
    
    event ProposalFinalized(
        uint256 indexed proposalId
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAdministrator() {
        require(administrators[msg.sender] || msg.sender == owner, "Not administrator");
        _;
    }

    modifier onlyProposer() {
        require(proposers[msg.sender] || administrators[msg.sender] || msg.sender == owner, "Not proposer");
        _;
    }

    constructor() {
        owner = msg.sender;
        administrators[msg.sender] = true;
        proposers[msg.sender] = true;
    }

    /// @notice Create a new proposal with encrypted vote tallying
    /// @param title Proposal title
    /// @param description Proposal description
    /// @param optionCount Number of voting options (2-10)
    /// @param duration Voting duration in seconds
    /// @param strategy Result disclosure strategy
    /// @param minQuorum Minimum votes required for validity
    function createProposal(
        string calldata title,
        string calldata description,
        uint8 optionCount,
        uint256 duration,
        ResultDisclosureStrategy strategy,
        uint256 minQuorum
    ) external returns (uint256) {
        require(optionCount >= 2 && optionCount <= 10, "Invalid option count");
        require(duration > 0 && duration <= 365 days, "Invalid duration");
        require(minQuorum > 0, "Invalid quorum");
        
        uint256 proposalId = proposalCount++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;

        proposals[proposalId] = Proposal({
            title: title,
            description: description,
            startTime: startTime,
            endTime: endTime,
            optionCount: optionCount,
            finalized: false,
            owner: msg.sender,
            strategy: strategy,
            minQuorum: minQuorum
        });

        // Initialize encrypted vote counts to zero
        ProposalResults storage results = proposalResults[proposalId];
        for (uint8 i = 0; i < optionCount; i++) {
            results.optionVotes.push(FHE.asEuint32(0));
            FHE.allowThis(results.optionVotes[i]);
        }
        results.totalVotes = FHE.asEuint32(0);
        FHE.allowThis(results.totalVotes);

        emit ProposalCreated(proposalId, msg.sender, title, optionCount, startTime, endTime);
        
        return proposalId;
    }

    /// @notice Cast an encrypted vote for a proposal
    /// @param proposalId The proposal to vote on
    /// @param encryptedOption Encrypted voting option (must be < optionCount)
    /// @param inputProof Zero-knowledge proof for the encrypted input
    function vote(
        uint256 proposalId,
        externalEuint8 encryptedOption,
        bytes calldata inputProof
    ) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.finalized, "Proposal finalized");

        // Check if user has already voted (clear-text check for double-vote prevention)
        // Note: This reveals that a user voted, but not their choice
        require(!hasVotedClear[proposalId][msg.sender], "Already voted");

        // Convert external encrypted input to internal type
        euint8 option = FHE.fromExternal(encryptedOption, inputProof);
        
        // Homomorphically update vote counts for each option
        // Use FHE.select to add 1 to the matching option, 0 to others
        ProposalResults storage results = proposalResults[proposalId];
        for (uint8 i = 0; i < proposal.optionCount; i++) {
            // Check if this is the selected option (encrypted comparison)
            ebool isMatch = FHE.eq(option, FHE.asEuint8(i));
            
            // Add 1 if match, 0 if not match
            euint32 increment = FHE.select(isMatch, FHE.asEuint32(1), FHE.asEuint32(0));
            results.optionVotes[i] = FHE.add(results.optionVotes[i], increment);
            FHE.allowThis(results.optionVotes[i]);
        }

        // Increment total vote count
        results.totalVotes = FHE.add(results.totalVotes, FHE.asEuint32(1));
        FHE.allowThis(results.totalVotes);

        // Mark as voted (both encrypted and clear-text)
        hasVoted[proposalId][msg.sender] = FHE.asEbool(true);
        hasVotedClear[proposalId][msg.sender] = true;
        FHE.allow(hasVoted[proposalId][msg.sender], msg.sender);

        // Grant decryption permissions based on strategy
        if (proposal.strategy == ResultDisclosureStrategy.PUBLIC_AFTER_END) {
            // Will be made public in finalizeProposal
        } else if (proposal.strategy == ResultDisclosureStrategy.OWNER_ONLY) {
            for (uint8 i = 0; i < proposal.optionCount; i++) {
                FHE.allow(results.optionVotes[i], proposal.owner);
            }
            FHE.allow(results.totalVotes, proposal.owner);
        } else if (proposal.strategy == ResultDisclosureStrategy.QUALIFIED_ONLY) {
            // Allow voter to see their own vote counted
            for (uint8 i = 0; i < proposal.optionCount; i++) {
                FHE.allowTransient(results.optionVotes[i], msg.sender);
            }
            FHE.allowTransient(results.totalVotes, msg.sender);
        }

        emit VoteCast(proposalId, msg.sender);
    }

    /// @notice Finalize a proposal after voting period ends
    /// @param proposalId The proposal to finalize
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(!proposal.finalized, "Already finalized");

        proposal.finalized = true;

        // Grant decryption permissions based on strategy
        ProposalResults storage results = proposalResults[proposalId];
        if (proposal.strategy == ResultDisclosureStrategy.PUBLIC_AFTER_END) {
            // Make results publicly decryptable
            for (uint8 i = 0; i < proposal.optionCount; i++) {
                FHE.makePubliclyDecryptable(results.optionVotes[i]);
            }
            FHE.makePubliclyDecryptable(results.totalVotes);
        } else if (proposal.strategy == ResultDisclosureStrategy.OWNER_ONLY) {
            // OWNER_ONLY: Use FHE.allow for proper access control
            // All environments (including local mock) require userDecrypt with signature
            for (uint8 i = 0; i < proposal.optionCount; i++) {
                FHE.allow(results.optionVotes[i], owner);
            }
            FHE.allow(results.totalVotes, owner);
        }

        emit ProposalFinalized(proposalId);
    }

    /// @notice Get encrypted vote count for a specific option
    /// @param proposalId The proposal ID
    /// @param optionIndex The option index
    /// @return Encrypted vote count handle
    function getOptionVotes(uint256 proposalId, uint8 optionIndex) 
        external 
        view 
        returns (euint32) 
    {
        require(optionIndex < proposals[proposalId].optionCount, "Invalid option");
        return proposalResults[proposalId].optionVotes[optionIndex];
    }

    /// @notice Get encrypted total vote count
    /// @param proposalId The proposal ID
    /// @return Encrypted total vote count handle
    function getTotalVotes(uint256 proposalId) 
        external 
        view 
        returns (euint32) 
    {
        return proposalResults[proposalId].totalVotes;
    }

    /// @notice Check if an address has voted (encrypted)
    /// @param proposalId The proposal ID
    /// @param voter The voter address
    /// @return Encrypted boolean indicating if voted
    function getHasVoted(uint256 proposalId, address voter) 
        external 
        view 
        returns (ebool) 
    {
        return hasVoted[proposalId][voter];
    }

    /// @notice Grant decryption permission for a specific address
    /// @param proposalId The proposal ID
    /// @param account The account to grant permission
    function grantDecryptionPermission(uint256 proposalId, address account) 
        external 
    {
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.owner || 
            msg.sender == owner || 
            administrators[msg.sender],
            "Not authorized"
        );

        ProposalResults storage results = proposalResults[proposalId];
        for (uint8 i = 0; i < proposal.optionCount; i++) {
            FHE.allow(results.optionVotes[i], account);
        }
        FHE.allow(results.totalVotes, account);
    }

    // Role management functions
    function setProposer(address account, bool status) external onlyAdministrator {
        proposers[account] = status;
    }

    function setAdministrator(address account, bool status) external onlyOwner {
        administrators[account] = status;
    }

    function setDefaultVotingDuration(uint256 duration) external onlyOwner {
        require(duration > 0 && duration <= 365 days, "Invalid duration");
        defaultVotingDuration = duration;
    }
}

