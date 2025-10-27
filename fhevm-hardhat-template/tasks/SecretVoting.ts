import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("voting:create", "Create a new proposal")
  .addParam("title", "Proposal title")
  .addParam("description", "Proposal description")
  .addOptionalParam("options", "Number of options", "2")
  .addOptionalParam("duration", "Voting duration in seconds", "86400")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();
    
    const secretVoting = await deployments.get("SecretVoting");
    const contract = await ethers.getContractAt("SecretVoting", secretVoting.address);

    console.log("Creating proposal...");
    const tx = await contract.createProposal(
      taskArguments.title,
      taskArguments.description,
      parseInt(taskArguments.options),
      parseInt(taskArguments.duration),
      0, // PUBLIC_AFTER_END
      1  // min quorum
    );
    
    const receipt = await tx.wait();
    console.log(`✅ Proposal created! Transaction: ${receipt?.hash}`);
    
    const proposalCount = await contract.proposalCount();
    console.log(`📊 Total proposals: ${proposalCount}`);
  });

task("voting:list", "List all proposals")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    
    const secretVoting = await deployments.get("SecretVoting");
    const contract = await ethers.getContractAt("SecretVoting", secretVoting.address);

    const count = await contract.proposalCount();
    console.log(`\n📋 Total proposals: ${count}\n`);

    for (let i = 0; i < count; i++) {
      const proposal = await contract.proposals(i);
      console.log(`Proposal #${i}:`);
      console.log(`  Title: ${proposal.title}`);
      console.log(`  Description: ${proposal.description}`);
      console.log(`  Options: ${proposal.optionCount}`);
      console.log(`  Status: ${proposal.finalized ? 'Finalized' : 'Active'}`);
      console.log(`  Owner: ${proposal.owner}`);
      console.log(``);
    }
  });

task("voting:info", "Get proposal information")
  .addParam("id", "Proposal ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    
    const secretVoting = await deployments.get("SecretVoting");
    const contract = await ethers.getContractAt("SecretVoting", secretVoting.address);

    const proposalId = parseInt(taskArguments.id);
    const proposal = await contract.proposals(proposalId);
    
    console.log(`\n📊 Proposal #${proposalId}:`);
    console.log(`  Title: ${proposal.title}`);
    console.log(`  Description: ${proposal.description}`);
    console.log(`  Options: ${proposal.optionCount}`);
    console.log(`  Start Time: ${new Date(Number(proposal.startTime) * 1000).toLocaleString()}`);
    console.log(`  End Time: ${new Date(Number(proposal.endTime) * 1000).toLocaleString()}`);
    console.log(`  Finalized: ${proposal.finalized}`);
    console.log(`  Owner: ${proposal.owner}`);
    console.log(`  Strategy: ${proposal.strategy}`);
    console.log(`  Min Quorum: ${proposal.minQuorum}`);
  });

task("voting:finalize", "Finalize a proposal")
  .addParam("id", "Proposal ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();
    
    const secretVoting = await deployments.get("SecretVoting");
    const contract = await ethers.getContractAt("SecretVoting", secretVoting.address);

    const proposalId = parseInt(taskArguments.id);
    console.log(`Finalizing proposal #${proposalId}...`);
    
    const tx = await contract.finalizeProposal(proposalId);
    const receipt = await tx.wait();
    
    console.log(`✅ Proposal finalized! Transaction: ${receipt?.hash}`);
  });


