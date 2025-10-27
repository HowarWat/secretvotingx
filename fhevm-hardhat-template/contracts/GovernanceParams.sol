// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title GovernanceParams - Governance parameter management
/// @notice Manages global governance parameters for the voting system
contract GovernanceParams {
    address public owner;
    mapping(address => bool) public administrators;

    // Governance parameters
    uint256 public minVotingDuration = 1 hours;
    uint256 public maxVotingDuration = 365 days;
    uint256 public defaultQuorum = 1; // minimum 1 vote
    uint256 public maxOptions = 10;
    uint256 public minOptions = 2;

    event ParameterUpdated(string indexed paramName, uint256 oldValue, uint256 newValue);
    event AdministratorSet(address indexed account, bool status);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAdministrator() {
        require(administrators[msg.sender] || msg.sender == owner, "Not administrator");
        _;
    }

    constructor() {
        owner = msg.sender;
        administrators[msg.sender] = true;
    }

    function setMinVotingDuration(uint256 duration) external onlyAdministrator {
        require(duration > 0 && duration < maxVotingDuration, "Invalid duration");
        uint256 old = minVotingDuration;
        minVotingDuration = duration;
        emit ParameterUpdated("minVotingDuration", old, duration);
    }

    function setMaxVotingDuration(uint256 duration) external onlyAdministrator {
        require(duration > minVotingDuration, "Invalid duration");
        uint256 old = maxVotingDuration;
        maxVotingDuration = duration;
        emit ParameterUpdated("maxVotingDuration", old, duration);
    }

    function setDefaultQuorum(uint256 quorum) external onlyAdministrator {
        uint256 old = defaultQuorum;
        defaultQuorum = quorum;
        emit ParameterUpdated("defaultQuorum", old, quorum);
    }

    function setMaxOptions(uint256 max) external onlyAdministrator {
        require(max >= minOptions && max <= 100, "Invalid max options");
        uint256 old = maxOptions;
        maxOptions = max;
        emit ParameterUpdated("maxOptions", old, max);
    }

    function setAdministrator(address account, bool status) external onlyOwner {
        administrators[account] = status;
        emit AdministratorSet(account, status);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
        administrators[newOwner] = true;
    }
}


