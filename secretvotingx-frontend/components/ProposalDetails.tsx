"use client";

import { Proposal, ProposalVotes } from "@/hooks/useSecretVoting";
import { useState, useEffect } from "react";
import { VoteStatistics } from "./VoteStatistics";

export interface ProposalDetailsProps {
  proposal: Proposal;
  votes: ProposalVotes;
  isOwner: boolean;
  onVote: () => void;
  onFinalize: () => void;
  onDecrypt: () => Promise<void>;
  isVoting?: boolean;
  isFinalizing?: boolean;
  isDecrypting?: boolean;
}

const STRATEGY_INFO = {
  0: {
    label: "Public After End",
    description: "Results will be visible to everyone after voting ends and finalization",
    icon: "🌐",
  },
  1: {
    label: "Owner Only",
    description: "Only the proposal owner can decrypt and view results",
    icon: "🔐",
  },
  2: {
    label: "Qualified Only",
    description: "Only addresses with decryption permission can view results",
    icon: "👥",
  },
};

export function ProposalDetails({
  proposal,
  votes,
  isOwner,
  onVote,
  onFinalize,
  onDecrypt,
  isVoting,
  isFinalizing,
  isDecrypting,
}: ProposalDetailsProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const end = Number(proposal.endTime);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Ended");
        return;
      }

      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [proposal.endTime]);

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canVote = proposal.status === "active";
  const canFinalize = proposal.status === "ended" && !proposal.finalized && isOwner;
  const canViewResults = proposal.finalized || (votes.total !== null);

  const strategyInfo = STRATEGY_INFO[proposal.strategy as keyof typeof STRATEGY_INFO];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-8 border border-white/10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {proposal.title}
            </h1>
            <p className="text-secondary text-lg leading-relaxed">
              {proposal.description}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap ${
              proposal.status === "active"
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : proposal.status === "ended"
                ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                : proposal.status === "finalized"
                ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                : "bg-blue-500/20 text-blue-400 border-blue-500/30"
            }`}
          >
            {proposal.status.toUpperCase()}
          </span>
        </div>

        {/* Owner Badge */}
        {isOwner && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg">
            <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            <span className="text-accent text-sm font-semibold">You own this proposal</span>
          </div>
        )}
      </div>

      {/* Timeline & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="glass rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Timeline
          </h3>
          <div className="space-y-4">
            <div>
              <div className="text-tertiary text-sm mb-1">Started</div>
              <div className="text-white font-medium">{formatDate(proposal.startTime)}</div>
            </div>
            <div>
              <div className="text-tertiary text-sm mb-1">Ends</div>
              <div className="text-white font-medium">{formatDate(proposal.endTime)}</div>
            </div>
            {proposal.status === "active" && (
              <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
                <div className="text-tertiary text-sm mb-1">Time Remaining</div>
                <div className="text-accent font-bold text-xl">{timeLeft}</div>
              </div>
            )}
          </div>
        </div>

        {/* Strategy & Settings */}
        <div className="glass rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </h3>
          <div className="space-y-4">
            <div>
              <div className="text-tertiary text-sm mb-2">Result Disclosure Strategy</div>
              <div className="flex items-start gap-3 p-3 bg-surface/30 rounded-lg">
                <span className="text-2xl">{strategyInfo.icon}</span>
                <div className="flex-1">
                  <div className="text-white font-medium">{strategyInfo.label}</div>
                  <div className="text-secondary text-xs mt-1">{strategyInfo.description}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-tertiary text-sm mb-1">Options</div>
                <div className="text-white font-semibold text-lg">{proposal.optionCount}</div>
              </div>
              <div>
                <div className="text-tertiary text-sm mb-1">Min Quorum</div>
                <div className="text-white font-semibold text-lg">{proposal.minQuorum.toString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <VoteStatistics
        proposalId={proposal.id}
        optionCount={proposal.optionCount}
        votes={votes}
        onDecrypt={onDecrypt}
        canDecrypt={canViewResults}
        isDecrypting={isDecrypting}
        status={proposal.status}
      />

      {/* Actions */}
      {(canVote || canFinalize) && (
        <div className="space-y-4">
          {/* Finalize Button with Explanation */}
          {canFinalize && (
            <div className="glass rounded-xl p-6 border-2 border-accent/30">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-2">Ready to Finalize</h4>
                  <p className="text-sm text-secondary mb-4">
                    The voting period has ended. As the proposal owner, you can now finalize this proposal to:
                  </p>
                  <ul className="text-sm text-secondary space-y-1 list-disc list-inside mb-4">
                    <li>Complete the voting process</li>
                    <li>Enable result decryption based on the disclosure strategy</li>
                    <li>Lock the proposal from further votes</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={onFinalize}
                disabled={isFinalizing}
                className="w-full px-6 py-4 bg-accent hover:bg-accent/80 text-white rounded-lg text-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isFinalizing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Finalizing Proposal...
                  </>
                ) : (
                  <>
                    ✅ Finalize Proposal
                  </>
                )}
              </button>
            </div>
          )}

          {/* Vote Button */}
          {canVote && (
            <button
              onClick={onVote}
              disabled={isVoting}
              className="w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50"
            >
              {isVoting ? "Submitting..." : "🗳️ Cast Your Vote"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}


