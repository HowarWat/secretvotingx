import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { SecretVoting, SecretVoting__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("SecretVoting")) as SecretVoting__factory;
  const secretVotingContract = (await factory.deploy()) as SecretVoting;
  const secretVotingAddress = await secretVotingContract.getAddress();

  return { secretVotingContract, secretVotingAddress };
}

describe("SecretVoting", function () {
  let signers: Signers;
  let secretVotingContract: SecretVoting;
  let secretVotingAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { 
      deployer: ethSigners[0], 
      alice: ethSigners[1], 
      bob: ethSigners[2],
      charlie: ethSigners[3]
    };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn(`This test suite is designed for mock environment`);
      this.skip();
    }

    ({ secretVotingContract, secretVotingAddress } = await deployFixture());
  });

  it("should deploy successfully", async function () {
    expect(await secretVotingContract.owner()).to.equal(signers.deployer.address);
    expect(await secretVotingContract.proposalCount()).to.equal(0);
  });

  it("should create a proposal", async function () {
    const tx = await secretVotingContract.connect(signers.deployer).createProposal(
      "Test Proposal",
      "This is a test proposal",
      3, // 3 options
      24 * 60 * 60, // 1 day
      0, // PUBLIC_AFTER_END strategy
      1  // min quorum
    );
    await tx.wait();

    expect(await secretVotingContract.proposalCount()).to.equal(1);
    
    const proposal = await secretVotingContract.proposals(0);
    expect(proposal.title).to.equal("Test Proposal");
    expect(proposal.optionCount).to.equal(3);
    expect(proposal.finalized).to.equal(false);
  });

  it("should allow voting with encrypted option", async function () {
    // Create proposal
    await secretVotingContract.connect(signers.deployer).createProposal(
      "Vote Test",
      "Testing encrypted voting",
      2, // 2 options: Yes/No
      24 * 60 * 60,
      0,
      1
    );

    // Alice votes for option 0 (encrypted)
    const encryptedOption = await fhevm
      .createEncryptedInput(secretVotingAddress, signers.alice.address)
      .add8(0) // vote for option 0
      .encrypt();

    const voteTx = await secretVotingContract
      .connect(signers.alice)
      .vote(0, encryptedOption.handles[0], encryptedOption.inputProof);
    await voteTx.wait();

    // Check that Alice has voted (using clear-text flag)
    // In our implementation, we use hasVotedClear for double-vote prevention
    // The encrypted flag is also available but requires proper ACL permissions

    // Grant decryption permission to deployer for testing
    await secretVotingContract.connect(signers.deployer).grantDecryptionPermission(0, signers.deployer.address);

    // Total votes should be 1 (encrypted)
    const totalVotes = await secretVotingContract.getTotalVotes(0);
    const totalVotesClear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      totalVotes,
      secretVotingAddress,
      signers.deployer
    );
    expect(totalVotesClear).to.equal(1);
  });

  it("should prevent double voting", async function () {
    // Create proposal
    await secretVotingContract.connect(signers.deployer).createProposal(
      "No Double Vote",
      "Testing double vote prevention",
      2,
      24 * 60 * 60,
      0,
      1
    );

    // Alice votes once
    const encryptedOption1 = await fhevm
      .createEncryptedInput(secretVotingAddress, signers.alice.address)
      .add8(0)
      .encrypt();

    await secretVotingContract
      .connect(signers.alice)
      .vote(0, encryptedOption1.handles[0], encryptedOption1.inputProof);

    // Alice tries to vote again
    const encryptedOption2 = await fhevm
      .createEncryptedInput(secretVotingAddress, signers.alice.address)
      .add8(1)
      .encrypt();

    await expect(
      secretVotingContract
        .connect(signers.alice)
        .vote(0, encryptedOption2.handles[0], encryptedOption2.inputProof)
    ).to.be.revertedWith("Already voted");
  });

  it("should tally votes correctly (homomorphic counting)", async function () {
    // Create proposal with 3 options
    await secretVotingContract.connect(signers.deployer).createProposal(
      "Multi Option",
      "Testing vote tallying",
      3,
      24 * 60 * 60,
      0,
      1
    );

    // Alice votes for option 0
    const encAlice = await fhevm
      .createEncryptedInput(secretVotingAddress, signers.alice.address)
      .add8(0)
      .encrypt();
    await secretVotingContract
      .connect(signers.alice)
      .vote(0, encAlice.handles[0], encAlice.inputProof);

    // Bob votes for option 1
    const encBob = await fhevm
      .createEncryptedInput(secretVotingAddress, signers.bob.address)
      .add8(1)
      .encrypt();
    await secretVotingContract
      .connect(signers.bob)
      .vote(0, encBob.handles[0], encBob.inputProof);

    // Charlie votes for option 0
    const encCharlie = await fhevm
      .createEncryptedInput(secretVotingAddress, signers.charlie.address)
      .add8(0)
      .encrypt();
    await secretVotingContract
      .connect(signers.charlie)
      .vote(0, encCharlie.handles[0], encCharlie.inputProof);

    // Grant decryption permission to deployer for testing
    await secretVotingContract.connect(signers.deployer).grantDecryptionPermission(0, signers.deployer.address);

    // Total votes should be 3
    const totalVotes = await secretVotingContract.getTotalVotes(0);
    const totalClear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      totalVotes,
      secretVotingAddress,
      signers.deployer
    );
    expect(totalClear).to.equal(3);

    // Option 0 should have 2 votes
    const option0Votes = await secretVotingContract.getOptionVotes(0, 0);
    const option0Clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      option0Votes,
      secretVotingAddress,
      signers.deployer
    );
    expect(option0Clear).to.equal(2);

    // Option 1 should have 1 vote
    const option1Votes = await secretVotingContract.getOptionVotes(0, 1);
    const option1Clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      option1Votes,
      secretVotingAddress,
      signers.deployer
    );
    expect(option1Clear).to.equal(1);

    // Option 2 should have 0 votes
    const option2Votes = await secretVotingContract.getOptionVotes(0, 2);
    const option2Clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      option2Votes,
      secretVotingAddress,
      signers.deployer
    );
    expect(option2Clear).to.equal(0);
  });

  it("should handle role management", async function () {
    // Initially, only deployer is proposer
    expect(await secretVotingContract.proposers(signers.alice.address)).to.equal(false);

    // Grant proposer role to Alice
    await secretVotingContract.connect(signers.deployer).setProposer(signers.alice.address, true);
    expect(await secretVotingContract.proposers(signers.alice.address)).to.equal(true);

    // Alice can now create proposals
    await expect(
      secretVotingContract.connect(signers.alice).createProposal(
        "Alice's Proposal",
        "Created by Alice",
        2,
        24 * 60 * 60,
        0,
        1
      )
    ).to.not.be.reverted;
  });
});

