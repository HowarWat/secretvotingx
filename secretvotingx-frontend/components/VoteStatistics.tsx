"use client";

import { useEffect, useState } from "react";

export interface VoteStatisticsProps {
  proposalId: number;
  optionCount: number;
  votes: {
    total: number | null;
    options: (number | null)[];
    isLoading: boolean;
  };
  onDecrypt?: () => Promise<void>;
  canDecrypt?: boolean;
  isDecrypting?: boolean;
  status: "upcoming" | "active" | "ended" | "finalized";
}

export function VoteStatistics({
  proposalId,
  optionCount,
  votes,
  onDecrypt,
  canDecrypt,
  isDecrypting,
  status,
}: VoteStatisticsProps) {
  const hasResults = votes.total !== null && votes.options.length > 0;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Auto-show results after finalization
    if (status === "finalized") {
      setIsVisible(true);
    }
  }, [status]);

  const getWinningOption = () => {
    if (!hasResults) return null;
    let maxVotes = -1;
    let winningIndex = 0;
    votes.options.forEach((count, index) => {
      if (count !== null && count > maxVotes) {
        maxVotes = count;
        winningIndex = index;
      }
    });
    return { index: winningIndex, votes: maxVotes };
  };

  const winningOption = getWinningOption();

  return (
    <div className="glass rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Voting Statistics
        </h3>

        {/* Decrypt Button */}
        {!hasResults && canDecrypt && onDecrypt && (
          <button
            onClick={onDecrypt}
            disabled={isDecrypting || votes.isLoading}
            className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDecrypting || votes.isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                Decrypting...
              </>
            ) : (
              <>
                🔓 Decrypt Results
              </>
            )}
          </button>
        )}

        {/* Toggle visibility for existing results */}
        {hasResults && (
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="text-accent hover:text-accent/80 text-sm font-medium flex items-center gap-1 transition-colors"
          >
            {isVisible ? "Hide" : "Show"} Results
            <svg
              className={`w-4 h-4 transition-transform ${isVisible ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Loading State */}
      {(votes.isLoading || isDecrypting) && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <p className="text-secondary">Decrypting results...</p>
          </div>
        </div>
      )}

      {/* No Results Yet */}
      {!hasResults && !votes.isLoading && !isDecrypting && (
        <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-lg">
          <svg className="w-16 h-16 mx-auto mb-4 text-secondary opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="text-white mb-2">Results are encrypted</p>
          <p className="text-sm text-secondary mb-4">
            {status === "active" && "Voting is still in progress"}
            {status === "ended" && "Proposal needs to be finalized first"}
            {status === "finalized" && canDecrypt && "Click 'Decrypt Results' to view"}
            {status === "finalized" && !canDecrypt && "You don't have permission to view results"}
          </p>
          
          {/* Helpful hint for "ended" status */}
          {status === "ended" && (
            <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg text-left max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-orange-400 mb-1">Action Required</div>
                  <div className="text-white/80">
                    The voting period has ended. Click the <strong>&quot;Finalize Proposal&quot;</strong> button below to complete the proposal and enable result decryption.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Display */}
      {hasResults && isVisible && (
        <div className="space-y-6">
          {/* Total Votes */}
          <div className="flex items-center justify-between p-4 bg-surface/30 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm text-secondary">Total Votes Cast</div>
                <div className="text-2xl font-bold text-white">{votes.total}</div>
              </div>
            </div>
          </div>

          {/* Option Results */}
          <div className="space-y-4">
            {votes.options.map((count, index) => {
              const isWinner = winningOption && index === winningOption.index && votes.total! > 0;
              const percentage = votes.total && votes.total > 0 && count !== null
                ? (count / votes.total) * 100
                : 0;

              return (
                <div
                  key={index}
                  className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                    isWinner
                      ? "border-accent bg-accent/5"
                      : "border-white/10 bg-surface/20"
                  }`}
                >
                  {/* Progress Bar Background */}
                  <div
                    className={`absolute inset-0 transition-all duration-500 ${
                      isWinner ? "bg-accent/10" : "bg-primary/5"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />

                  {/* Content */}
                  <div className="relative p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isWinner && (
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      <div>
                        <div className={`font-semibold ${isWinner ? "text-accent" : "text-white"}`}>
                          Option {index + 1}
                          {isWinner && <span className="ml-2 text-xs">👑 Winner</span>}
                        </div>
                        <div className="text-xs text-secondary">
                          {index === 0 && "Yes / Approve"}
                          {index === 1 && "No / Reject"}
                          {index > 1 && `Alternative ${index - 1}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-xl font-bold ${isWinner ? "text-accent" : "text-white"}`}>
                        {count ?? "?"}
                      </div>
                      <div className="text-xs text-secondary">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {winningOption && votes.total! > 0 && (
            <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium text-accent">
                    Option {winningOption.index + 1} is leading with {winningOption.votes} votes
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

