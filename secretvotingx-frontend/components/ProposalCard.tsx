"use client";

import { Proposal } from "@/hooks/useSecretVoting";

export interface ProposalCardProps {
  proposal: Proposal;
  onVote?: (proposalId: number) => void;
  onView?: (proposalId: number) => void;
  onFinalize?: (proposalId: number) => void;
  isOwner?: boolean;
  showActions?: boolean;
}

const STRATEGY_LABELS = {
  0: "Public After End",
  1: "Owner Only",
  2: "Qualified Only",
};

const STATUS_STYLES = {
  upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  ended: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  finalized: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export function ProposalCard({
  proposal,
  onVote,
  onView,
  onFinalize,
  isOwner,
  showActions = true,
}: ProposalCardProps) {
  const canVote = proposal.status === "active";
  const canFinalize = proposal.status === "ended" && !proposal.finalized && isOwner;

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="card-glass overflow-hidden group">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors line-clamp-2">
            {proposal.title}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${
              STATUS_STYLES[proposal.status]
            }`}
          >
            {proposal.status.toUpperCase()}
          </span>
        </div>
        
        <p className="text-secondary text-sm line-clamp-2 mb-4">
          {proposal.description}
        </p>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-tertiary">Options:</span>
            <span className="text-white ml-2 font-medium">{proposal.optionCount}</span>
          </div>
          <div>
            <span className="text-tertiary">Min Quorum:</span>
            <span className="text-white ml-2 font-medium">{proposal.minQuorum.toString()}</span>
          </div>
          <div>
            <span className="text-tertiary">Strategy:</span>
            <span className="text-white ml-2 font-medium">
              {STRATEGY_LABELS[proposal.strategy as keyof typeof STRATEGY_LABELS]}
            </span>
          </div>
          {proposal.timeLeft && (
            <div>
              <span className="text-tertiary">Time Left:</span>
              <span className="text-accent ml-2 font-medium">{proposal.timeLeft}</span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 py-4 bg-surface/30 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-tertiary">Start:</span>
          <span className="text-white">{formatDate(proposal.startTime)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-tertiary">End:</span>
          <span className="text-white">{formatDate(proposal.endTime)}</span>
        </div>
      </div>

      {/* Owner Badge */}
      {isOwner && (
        <div className="px-6 py-2 bg-accent/10 border-t border-accent/20">
          <span className="text-accent text-xs font-semibold flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            You own this proposal
          </span>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="p-4 flex gap-3">
          {onView && (
            <button
              onClick={() => onView(proposal.id)}
              className="flex-1 px-4 py-2 bg-surface/50 hover:bg-surface/80 text-white rounded-lg font-medium transition-colors text-sm border border-white/10"
            >
              View Details
            </button>
          )}
          
          {canVote && onVote && (
            <button
              onClick={() => onVote(proposal.id)}
              className="flex-1 btn-primary py-2 text-sm font-semibold"
            >
              🗳️ Vote Now
            </button>
          )}
          
          {canFinalize && onFinalize && (
            <button
              onClick={() => onFinalize(proposal.id)}
              className="flex-1 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Finalize
            </button>
          )}
        </div>
      )}
    </div>
  );
}


