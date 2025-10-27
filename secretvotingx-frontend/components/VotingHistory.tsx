"use client";

import { Proposal } from "@/hooks/useSecretVoting";

export interface VotingHistoryProps {
  proposals: Proposal[];
  currentAccount?: string;
  onViewProposal?: (proposalId: number) => void;
}

export function VotingHistory({ proposals, currentAccount, onViewProposal }: VotingHistoryProps) {
  // Filter proposals where user is the owner or likely voted (simplified)
  const myProposals = proposals.filter(
    (p) => currentAccount && p.owner.toLowerCase() === currentAccount.toLowerCase()
  );

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: Proposal["status"]) => {
    switch (status) {
      case "active":
        return "text-green-400";
      case "ended":
        return "text-orange-400";
      case "finalized":
        return "text-gray-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* My Proposals */}
      <div className="glass rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          My Proposals ({myProposals.length})
        </h3>

        {myProposals.length === 0 ? (
          <div className="text-center py-12 text-secondary">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg">You haven&apos;t created any proposals yet</p>
            <p className="text-sm text-tertiary mt-1">Create your first proposal to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myProposals.map((proposal) => (
              <div
                key={proposal.id}
                className="flex items-center justify-between p-4 bg-surface/30 hover:bg-surface/50 rounded-lg transition-colors cursor-pointer group"
                onClick={() => onViewProposal?.(proposal.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-white font-semibold truncate group-hover:text-accent transition-colors">
                      {proposal.title}
                    </h4>
                    <span className={`text-xs font-medium ${getStatusColor(proposal.status)}`}>
                      {proposal.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-tertiary">
                    <span>ID: #{proposal.id}</span>
                    <span>Created: {formatDate(proposal.startTime)}</span>
                    <span>Ends: {formatDate(proposal.endTime)}</span>
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-secondary group-hover:text-accent transition-colors flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voting Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-lg p-4 border border-white/10">
          <div className="text-tertiary text-sm mb-1">Total Proposals</div>
          <div className="text-white text-2xl font-bold">{proposals.length}</div>
        </div>
        <div className="glass rounded-lg p-4 border border-white/10">
          <div className="text-tertiary text-sm mb-1">Active</div>
          <div className="text-green-400 text-2xl font-bold">
            {proposals.filter((p) => p.status === "active").length}
          </div>
        </div>
        <div className="glass rounded-lg p-4 border border-white/10">
          <div className="text-tertiary text-sm mb-1">Finalized</div>
          <div className="text-gray-400 text-2xl font-bold">
            {proposals.filter((p) => p.status === "finalized").length}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Recent Activity
        </h3>
        <div className="space-y-2">
          {proposals
            .slice()
            .sort((a, b) => Number(b.startTime) - Number(a.startTime))
            .slice(0, 5)
            .map((proposal) => (
              <div
                key={proposal.id}
                className="flex items-center gap-3 p-3 bg-surface/20 rounded-lg text-sm hover:bg-surface/40 transition-colors cursor-pointer"
                onClick={() => onViewProposal?.(proposal.id)}
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    proposal.status === "active"
                      ? "bg-green-400"
                      : proposal.status === "ended"
                      ? "bg-orange-400"
                      : proposal.status === "finalized"
                      ? "bg-gray-400"
                      : "bg-blue-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate">{proposal.title}</div>
                  <div className="text-tertiary text-xs">{formatDate(proposal.startTime)}</div>
                </div>
                <span className={`text-xs font-medium ${getStatusColor(proposal.status)}`}>
                  {proposal.status}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

