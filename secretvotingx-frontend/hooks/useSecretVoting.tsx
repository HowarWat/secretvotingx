"use client";

import { useState, useCallback, useEffect } from "react";
import { Contract, BrowserProvider, type Eip1193Provider } from "ethers";
import { SecretVotingABI } from "@/abi/SecretVotingABI";
import { SecretVotingAddresses } from "@/abi/SecretVotingAddresses";
import { FhevmInstance } from "@/fhevm/fhevmTypes";

// Result Disclosure Strategy enum (matches SecretVoting.sol)
export enum ResultDisclosureStrategy {
  PUBLIC_AFTER_END = 0,
  OWNER_ONLY = 1,
  QUALIFIED_ONLY = 2,
}

export interface Proposal {
  id: number;
  title: string;
  description: string;
  startTime: bigint;
  endTime: bigint;
  optionCount: number;
  finalized: boolean;
  owner: string;
  strategy: number;
  minQuorum: bigint;
  status: "upcoming" | "active" | "ended" | "finalized";
  timeLeft?: string;
}

export interface VoteStatus {
  hasVoted: boolean;
  isLoading: boolean;
}

export interface ProposalVotes {
  total: number | null;
  options: (number | null)[];
  isLoading: boolean;
}

export interface UseSecretVotingParams {
  provider: Eip1193Provider | null;
  signer: any;
  chainId: number | undefined;
  account: string | undefined;
  fhevmInstance: FhevmInstance | null | undefined;
  ethersReadonlyProvider?: any;
}

export function useSecretVoting({
  provider,
  signer,
  chainId,
  account,
  fhevmInstance,
  ethersReadonlyProvider,
}: UseSecretVotingParams) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [proposalCount, setProposalCount] = useState<number>(0);
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  // Get readonly contract instance (for reading data)
  const getContract = useCallback(() => {
    if (!chainId) return null;
    
    const chainIdKey = chainId.toString() as keyof typeof SecretVotingAddresses;
    const addressConfig = SecretVotingAddresses[chainIdKey];
    if (!addressConfig) {
      return null;
    }
    
    // Check for zero address (contract not deployed)
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    if ((addressConfig.address as string) === ZERO_ADDRESS) {
      return null;
    }
    
    setContractAddress(addressConfig.address);
    
    // Priority: ethersReadonlyProvider > BrowserProvider from provider
    let runner;
    if (ethersReadonlyProvider) {
      runner = ethersReadonlyProvider;
    } else if (provider) {
      // Create BrowserProvider from raw provider
      runner = new BrowserProvider(provider);
    } else {
      return null;
    }
    
    return new Contract(addressConfig.address, SecretVotingABI.abi, runner);
  }, [ethersReadonlyProvider, provider, chainId]);

  // Calculate proposal status
  const getProposalStatus = (startTime: bigint, endTime: bigint, finalized: boolean): Proposal["status"] => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (finalized) return "finalized";
    if (now < startTime) return "upcoming";
    if (now > endTime) return "ended";
    return "active";
  };

  // Format time left
  const formatTimeLeft = (endTime: bigint): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = Number(endTime) - now;
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  // Load all proposals
  const loadProposals = useCallback(async () => {
    const contract = getContract();
    if (!contract) return;

    try {
      setIsLoadingProposals(true);
      const count = await contract.proposalCount();
      setProposalCount(Number(count));

      const loadedProposals: Proposal[] = [];
      for (let i = 0; i < Number(count); i++) {
        try {
          const data = await contract.proposals(i);
          const status = getProposalStatus(data.startTime, data.endTime, data.finalized);
          
          loadedProposals.push({
            id: i,
            title: data.title,
            description: data.description,
            startTime: data.startTime,
            endTime: data.endTime,
            optionCount: Number(data.optionCount),
            finalized: data.finalized,
            owner: data.owner,
            strategy: Number(data.strategy),
            minQuorum: data.minQuorum,
            status,
            timeLeft: status === "active" ? formatTimeLeft(data.endTime) : undefined,
          });
        } catch (err) {
          console.error(`Error loading proposal ${i}:`, err);
        }
      }

      setProposals(loadedProposals);
    } catch (error) {
      console.error("Error loading proposals:", error);
    } finally {
      setIsLoadingProposals(false);
    }
  }, [getContract]);

  // Create proposal
  const createProposal = useCallback(async (
    title: string,
    description: string,
    optionCount: number,
    duration: number,
    strategy: number,
    minQuorum: number
  ) => {
    console.log("createProposal called");
    console.log("Signer:", signer);
    console.log("Contract address:", contractAddress);
    
    if (!signer) {
      throw new Error("No signer available. Please ensure your wallet is connected.");
    }
    
    if (!contractAddress) {
      throw new Error("Contract not deployed on this network.");
    }
    
    const contract = new Contract(
      contractAddress,
      SecretVotingABI.abi,
      signer
    );

    console.log("Sending transaction...");
    
    try {
      const tx = await contract.createProposal(
        title,
        description,
        optionCount,
        duration,
        strategy,
        minQuorum
      );
      
      console.log("Transaction sent:", tx.hash);
      console.log("Waiting for confirmation...");
      
      await tx.wait();
      console.log("Transaction confirmed!");
      
      await loadProposals();
      
      return tx;
    } catch (error: any) {
      console.error("Transaction error:", error);
      
      // Better error messages
      if (error.code === "ACTION_REJECTED") {
        throw new Error("Transaction was rejected by user");
      } else if (error.message?.includes("Not proposer")) {
        throw new Error("You don't have permission to create proposals. Only proposers can create proposals.");
      } else if (error.reason) {
        throw new Error(`Contract error: ${error.reason}`);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to create proposal. Please try again.");
      }
    }
  }, [signer, contractAddress, loadProposals]);

  // Vote on proposal
  const vote = useCallback(async (proposalId: number, optionIndex: number) => {
    console.log("vote called:", { proposalId, optionIndex });
    console.log("Dependencies:", { 
      hasSigner: !!signer, 
      hasFhevm: !!fhevmInstance, 
      contractAddress,
      account 
    });

    if (!signer || !fhevmInstance || !contractAddress || !account) {
      throw new Error("Missing required dependencies for voting");
    }

    // Check proposal status first
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    const now = Math.floor(Date.now() / 1000);
    if (now < Number(proposal.startTime)) {
      throw new Error("Voting has not started yet");
    }
    if (now > Number(proposal.endTime)) {
      throw new Error("Voting has ended");
    }
    if (proposal.finalized) {
      throw new Error("Proposal has been finalized");
    }
    if (optionIndex >= proposal.optionCount) {
      throw new Error(`Invalid option. Must be between 0 and ${proposal.optionCount - 1}`);
    }

    console.log("Creating encrypted input...");
    
    try {
      // Create encrypted input
      const encryptedInput = fhevmInstance.createEncryptedInput(contractAddress, account);
      encryptedInput.add8(optionIndex);
      
      console.log("Encrypting input...");
      const encryptResult = await encryptedInput.encrypt();
      console.log("Encryption result:", encryptResult);
      
      const { handles, inputProof } = encryptResult;
      
      if (!handles || handles.length === 0) {
        throw new Error("Failed to encrypt vote");
      }

      console.log("Encrypted handle:", handles[0]);
      console.log("Input proof length:", inputProof?.length || 0);

      const contract = new Contract(contractAddress, SecretVotingABI.abi, signer);
      
      console.log("Sending vote transaction...");
      const tx = await contract.vote(proposalId, handles[0], inputProof);
      
      console.log("Transaction sent:", tx.hash);
      console.log("Waiting for confirmation...");
      
      await tx.wait();
      console.log("Vote confirmed!");
      
      await loadProposals();
      return tx;
    } catch (error: any) {
      console.error("Vote error:", error);
      
      // Better error messages
      if (error.code === "ACTION_REJECTED") {
        throw new Error("Transaction was rejected by user");
      } else if (error.message?.includes("Already voted")) {
        throw new Error("You have already voted on this proposal");
      } else if (error.message?.includes("Voting not started")) {
        throw new Error("Voting has not started yet");
      } else if (error.message?.includes("Voting ended")) {
        throw new Error("Voting has ended");
      } else if (error.message?.includes("Proposal finalized")) {
        throw new Error("This proposal has been finalized");
      } else if (error.reason) {
        throw new Error(`Contract error: ${error.reason}`);
      } else if (error.message) {
        throw error;
      } else {
        throw new Error("Failed to cast vote. Please try again.");
      }
    }
  }, [signer, fhevmInstance, contractAddress, account, loadProposals, proposals]);

  // Finalize proposal
  const finalizeProposal = useCallback(async (proposalId: number) => {
    if (!signer || !contractAddress) throw new Error("Missing signer or contract");

    const contract = new Contract(contractAddress, SecretVotingABI.abi, signer);
    const tx = await contract.finalizeProposal(proposalId);
    await tx.wait();
    
    await loadProposals();
    return tx;
  }, [signer, contractAddress, loadProposals]);

  // Check if user has voted
  const checkHasVoted = useCallback(async (proposalId: number): Promise<boolean> => {
    const contract = getContract();
    if (!contract || !account) return false;

    try {
      // This returns an encrypted handle, we can't directly decrypt without proper permissions
      // For UI purposes, we'll track votes client-side or use events
      await contract.getHasVoted(proposalId, account);
      return false; // Placeholder - would need decryption logic
    } catch {
      return false;
    }
  }, [getContract, account]);

  // Decrypt proposal results (if permitted)
  const decryptResults = useCallback(async (proposalId: number): Promise<ProposalVotes> => {
    const contract = getContract();
    if (!contract || !fhevmInstance || !account || !signer || !contractAddress) {
      return { total: null, options: [], isLoading: false };
    }

    try {
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) {
        throw new Error("Proposal not found");
      }

      console.log("Starting decryption for proposal:", proposalId);

      // Get encrypted handles
      const totalHandle = await contract.getTotalVotes(proposalId);
      const optionHandles: string[] = [];
      for (let i = 0; i < proposal.optionCount; i++) {
        const handle = await contract.getOptionVotes(proposalId, i);
        optionHandles.push(handle);
      }

      console.log("Encrypted handles obtained:", {
        totalHandle,
        optionHandles,
      });

      // Check if we're in mock mode (chainId 31337)
      const isMockMode = chainId === 31337;
      console.log("Decryption mode:", isMockMode ? "Mock (local)" : "Real (Relayer)");
      
      // Check if proposal uses public disclosure strategy
      const isPublicDisclosure = proposal.strategy === ResultDisclosureStrategy.PUBLIC_AFTER_END && proposal.finalized;
      
      // Check if user is the proposal owner (for OWNER_ONLY strategy)
      const isOwner = proposal.owner && account && proposal.owner.toLowerCase() === account.toLowerCase();
      
      // Determine if we can use publicDecrypt:
      // 1. PUBLIC_AFTER_END: Always use publicDecrypt (no signature needed)
      // 2. OWNER_ONLY: Contract uses FHE.allow in all environments, must use userDecrypt with signature
      // 3. QUALIFIED_ONLY: Contract uses FHE.allow, must use userDecrypt with signature
      const canUsePublicDecrypt = isPublicDisclosure;
      
      console.log("Disclosure strategy:", {
        strategy: proposal.strategy,
        finalized: proposal.finalized,
        isPublicDisclosure,
        isOwner,
        isMockMode,
        canUsePublicDecrypt
      });

      let decrypted: Record<string, bigint>;
      
      // Collect all handles first
      const handlesToDecrypt: string[] = [];
      
      if (totalHandle && totalHandle !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        handlesToDecrypt.push(totalHandle);
      }
      
      for (const handle of optionHandles) {
        if (handle && handle !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
          handlesToDecrypt.push(handle);
        }
      }
      
      console.log("Handles to decrypt:", handlesToDecrypt.length);

      // Determine decryption method based on disclosure strategy:
      // 
      // publicDecrypt (no signature required):
      //   - PUBLIC_AFTER_END strategy (all environments)
      // 
      // userDecrypt (EIP-712 signature required):
      //   - OWNER_ONLY strategy (all environments - contract uses FHE.allow)
      //   - QUALIFIED_ONLY strategy (all environments - contract uses FHE.allow)
      const shouldUsePublicDecrypt = canUsePublicDecrypt;
      const needsUserDecrypt = !canUsePublicDecrypt;

      if (shouldUsePublicDecrypt) {
        // Use publicDecrypt (no signature required):
        // - PUBLIC_AFTER_END strategy (all environments)
        console.log("Using publicDecrypt (no signature required)");
        
        if (typeof (fhevmInstance as any).publicDecrypt === 'function') {
          const results = await (fhevmInstance as any).publicDecrypt(handlesToDecrypt);
          console.log("publicDecrypt results:", results);
          decrypted = results;
        } else {
          throw new Error("Instance does not support publicDecrypt method");
        }
      } else if (needsUserDecrypt) {
        // OWNER_ONLY / QUALIFIED_ONLY: Use userDecrypt with signature (all environments)
        console.log("Using userDecrypt (requires EIP-712 signature)");
        
        // Get decryption signature (works in both Mock and Real mode)
        const { FhevmDecryptionSignature } = await import("@/fhevm/FhevmDecryptionSignature");
        
        // Create in-memory storage for decryption signature
        const storage = {
          async get(key: string): Promise<string | null> {
            return sessionStorage.getItem(key);
          },
          async set(key: string, value: string): Promise<void> {
            sessionStorage.setItem(key, value);
          },
          async remove(key: string): Promise<void> {
            sessionStorage.removeItem(key);
          }
        };
        
        const sig = await FhevmDecryptionSignature.loadOrSign(
          fhevmInstance,
          [contractAddress as `0x${string}`],
          signer,
          storage
        );

        if (!sig) {
          throw new Error("Failed to generate decryption signature");
        }

        console.log("Decryption signature generated");

        // Prepare handles for decryption
        const handlesToDecrypt: { handle: string; contractAddress: string }[] = [];
        
        // Add total votes handle
        if (totalHandle && totalHandle !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
          handlesToDecrypt.push({ handle: totalHandle, contractAddress });
        }

        // Add option handles
        for (const handle of optionHandles) {
          if (handle && handle !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
            handlesToDecrypt.push({ handle, contractAddress });
          }
        }

        console.log("Handles to decrypt:", handlesToDecrypt.length);

        // Decrypt all handles at once
        decrypted = await fhevmInstance.userDecrypt(
          handlesToDecrypt,
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );
      } else {
        throw new Error("Unable to determine decryption method");
      }

      console.log("Decryption result:", decrypted);

      // Parse results
      let totalVotes: number | null = null;
      const decryptedOptions: (number | null)[] = [];

      // Extract total
      if (totalHandle && totalHandle !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        const value = decrypted[totalHandle];
        totalVotes = value !== undefined ? Number(value) : null;
      }

      // Extract options
      for (const handle of optionHandles) {
        if (handle && handle !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
          const value = decrypted[handle];
          decryptedOptions.push(value !== undefined ? Number(value) : null);
        } else {
          decryptedOptions.push(null);
        }
      }

      const results: ProposalVotes = {
        total: totalVotes,
        options: decryptedOptions,
        isLoading: false,
      };

      console.log("Decryption complete:", results);

      return results;
    } catch (error) {
      console.error("Error decrypting results:", error);
      throw error;
    }
  }, [getContract, fhevmInstance, account, signer, contractAddress, proposals, chainId]);

  // Load proposals when contract is ready
  useEffect(() => {
    if (provider && chainId) {
      loadProposals();
    }
  }, [provider, chainId, loadProposals]);

  return {
    proposals,
    proposalCount,
    isLoadingProposals,
    contractAddress,
    loadProposals,
    createProposal,
    vote,
    finalizeProposal,
    checkHasVoted,
    decryptResults,
  };
}

