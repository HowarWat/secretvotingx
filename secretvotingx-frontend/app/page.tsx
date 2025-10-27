"use client";

import { useState, useCallback } from "react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useSecretVoting, Proposal, ProposalVotes } from "@/hooks/useSecretVoting";
import { CreateProposalForm } from "@/components/CreateProposalForm";
import { ProposalList } from "@/components/ProposalList";
import { ProposalDetails } from "@/components/ProposalDetails";
import { VoteModal } from "@/components/VoteModal";
import { VotingHistory } from "@/components/VotingHistory";
import { PermissionWarning } from "@/components/PermissionWarning";

type ViewMode = "proposals" | "create" | "history" | "details";

/**
 * Home page for SecretVotingX
 */
export default function Home() {
  const {
    provider,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
    accounts,
    isConnected,
    connect,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
    isReady,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: isConnected,
  });

  const {
    proposals,
    isLoadingProposals,
    contractAddress,
    loadProposals,
    createProposal,
    vote,
    finalizeProposal,
    decryptResults,
  } = useSecretVoting({
    provider,
    signer: ethersSigner,
    chainId,
    account: accounts?.[0],
    fhevmInstance,
    ethersReadonlyProvider,
  });

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("proposals");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedProposalVotes, setSelectedProposalVotes] = useState<ProposalVotes>({
    total: null,
    options: [],
    isLoading: false,
  });

  // Action states
  const [isCreating, setIsCreating] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [voteModalProposal, setVoteModalProposal] = useState<Proposal | null>(null);

  const currentAccount = accounts?.[0];

  // Handlers
  const handleCreateProposal = useCallback(
    async (data: {
      title: string;
      description: string;
      optionCount: number;
      duration: number;
      strategy: number;
      minQuorum: number;
    }) => {
      console.log("handleCreateProposal called with:", data);
      console.log("Signer available:", !!ethersSigner);
      console.log("Contract address:", contractAddress);
      
      try {
        setIsCreating(true);
        await createProposal(
          data.title,
          data.description,
          data.optionCount,
          data.duration,
          data.strategy,
          data.minQuorum
        );
        console.log("Proposal created, switching to proposals view");
        setViewMode("proposals");
      } catch (error) {
        console.error("Error in handleCreateProposal:", error);
        throw error; // Re-throw to be caught by form
      } finally {
        setIsCreating(false);
      }
    },
    [createProposal, ethersSigner, contractAddress]
  );

  const handleOpenVoteModal = useCallback((proposalId: number) => {
    const proposal = proposals.find((p) => p.id === proposalId);
    if (proposal) {
      setVoteModalProposal(proposal);
      setVoteModalOpen(true);
    }
  }, [proposals]);

  const handleVote = useCallback(
    async (proposalId: number, optionIndex: number) => {
      try {
        setIsVoting(true);
        await vote(proposalId, optionIndex);
        setVoteModalOpen(false);
      } finally {
        setIsVoting(false);
      }
    },
    [vote]
  );

  const handleViewProposal = useCallback(
    async (proposalId: number) => {
      const proposal = proposals.find((p) => p.id === proposalId);
      if (proposal) {
        setSelectedProposal(proposal);
        setSelectedProposalVotes({ total: null, options: [], isLoading: false });
        setViewMode("details");

        // Don't auto-decrypt, let user click "Decrypt Results" button manually
        // This prevents unwanted signature popups when just viewing proposal details
      }
    },
    [proposals]
  );

  const handleFinalize = useCallback(
    async (proposalId: number) => {
      try {
        setIsFinalizing(true);
        await finalizeProposal(proposalId);
        await loadProposals();
        
        // Refresh view if we're looking at this proposal
        if (selectedProposal?.id === proposalId) {
          const updated = proposals.find((p) => p.id === proposalId);
          if (updated) {
            setSelectedProposal(updated);
          }
        }
      } finally {
        setIsFinalizing(false);
      }
    },
    [finalizeProposal, loadProposals, selectedProposal, proposals]
  );

  const handleDecryptResults = useCallback(async () => {
    if (!selectedProposal) return;

    try {
      setIsDecrypting(true);
      const votes = await decryptResults(selectedProposal.id);
      setSelectedProposalVotes(votes);
    } finally {
      setIsDecrypting(false);
    }
  }, [selectedProposal, decryptResults]);

  if (!contractAddress && isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <svg
            className="w-16 h-16 text-error mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Contract Not Deployed</h2>
          <p className="text-secondary mb-4">
            SecretVoting contract is not deployed on this network (Chain ID: {chainId}).
          </p>
          <p className="text-sm text-tertiary">
            Please deploy the contract or switch to a supported network.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-icon flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SecretVotingX</h1>
                <p className="text-xs text-secondary">Privacy-Preserving Voting</p>
              </div>
            </div>

            {!isConnected ? (
              <button onClick={connect} className="btn-primary">
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-xs text-secondary">
                  {chainId === 31337 ? "Localhost" : chainId === 11155111 ? "Sepolia" : `Chain ${chainId}`}
                </div>
                <div className="glass-light px-4 py-2 rounded-lg">
                  <div className="text-xs text-secondary">Connected</div>
                  <div className="text-sm font-mono text-white">
                    {currentAccount?.slice(0, 6)}...{currentAccount?.slice(-4)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 rounded-full bg-accent/10 animate-pulse"></div>
              <svg className="w-12 h-12 text-accent relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-4xl font-bold mb-4 text-white">Welcome to SecretVotingX</h2>
            <p className="text-xl text-secondary max-w-2xl mb-8">
              Experience the future of governance with end-to-end encrypted voting powered by Zama FHEVM.
              Your vote remains private, yet verifiable.
            </p>
            <button onClick={connect} className="btn-primary text-lg px-8 py-4">
              Connect Wallet to Start
            </button>
          </div>
        ) : !isReady ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <p className="text-secondary">Initializing FHEVM instance...</p>
            <p className="text-sm text-tertiary mt-2">{fhevmStatus}</p>
            {fhevmError && (
              <div className="mt-4 p-4 bg-error/10 border border-error/50 rounded-lg max-w-md mx-auto">
                <div className="font-semibold text-error mb-2">Error</div>
                <div className="text-sm text-white/80">{fhevmError.message}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Navigation Tabs */}
            <div className="glass rounded-xl p-2 inline-flex gap-2">
              <button
                onClick={() => setViewMode("proposals")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  viewMode === "proposals"
                    ? "bg-accent text-white shadow-lg"
                    : "text-secondary hover:text-white hover:bg-surface/30"
                }`}
              >
                📋 All Proposals
              </button>
              <button
                onClick={() => setViewMode("create")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  viewMode === "create"
                    ? "bg-accent text-white shadow-lg"
                    : "text-secondary hover:text-white hover:bg-surface/30"
                }`}
              >
                ➕ Create Proposal
              </button>
              <button
                onClick={() => setViewMode("history")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  viewMode === "history"
                    ? "bg-accent text-white shadow-lg"
                    : "text-secondary hover:text-white hover:bg-surface/30"
                }`}
              >
                📊 My Activity
              </button>
            </div>

            {/* View Content */}
            {viewMode === "proposals" && (
              <ProposalList
                proposals={proposals}
                isLoading={isLoadingProposals}
                currentAccount={currentAccount}
                onVote={handleOpenVoteModal}
                onView={handleViewProposal}
                onFinalize={handleFinalize}
              />
            )}

            {viewMode === "create" && (
              <div className="max-w-3xl">
                <div className="glass rounded-2xl p-8 border border-white/10">
                  <h2 className="text-2xl font-bold text-white mb-6">Create New Proposal</h2>
                  <PermissionWarning account={currentAccount} />
                  <CreateProposalForm onSubmit={handleCreateProposal} isSubmitting={isCreating} />
                </div>
              </div>
            )}

            {viewMode === "history" && (
              <VotingHistory
                proposals={proposals}
                currentAccount={currentAccount}
                onViewProposal={handleViewProposal}
              />
            )}

            {viewMode === "details" && selectedProposal && (
              <div>
                <button
                  onClick={() => setViewMode("proposals")}
                  className="mb-4 flex items-center gap-2 text-secondary hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Proposals
                </button>
                <ProposalDetails
                  proposal={selectedProposal}
                  votes={selectedProposalVotes}
                  isOwner={currentAccount?.toLowerCase() === selectedProposal.owner.toLowerCase()}
                  onVote={() => handleOpenVoteModal(selectedProposal.id)}
                  onFinalize={() => handleFinalize(selectedProposal.id)}
                  onDecrypt={handleDecryptResults}
                  isVoting={isVoting}
                  isFinalizing={isFinalizing}
                  isDecrypting={isDecrypting}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Vote Modal */}
      <VoteModal
        proposal={voteModalProposal}
        isOpen={voteModalOpen}
        onClose={() => setVoteModalOpen(false)}
        onVote={handleVote}
        isVoting={isVoting}
      />

      {/* Footer */}
      <footer className="glass border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-secondary">
          <p>Powered by Zama FHEVM • Built with Next.js & Tailwind CSS</p>
        </div>
      </footer>
    </div>
  );
}
