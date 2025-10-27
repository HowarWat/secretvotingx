"use client";

import { useState } from "react";
import { Proposal } from "@/hooks/useSecretVoting";

export interface VoteModalProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
  onVote: (proposalId: number, optionIndex: number) => Promise<void>;
  isVoting?: boolean;
}

export function VoteModal({ proposal, isOpen, onClose, onVote, isVoting }: VoteModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  if (!isOpen || !proposal) return null;

  const handleVote = async () => {
    if (selectedOption === null) {
      setError("Please select an option");
      return;
    }

    try {
      setError("");
      await onVote(proposal.id, selectedOption);
      onClose();
      setSelectedOption(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to cast vote";
      setError(errorMessage);
    }
  };

  const handleClose = () => {
    if (!isVoting) {
      onClose();
      setSelectedOption(null);
      setError("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-2xl glass-light rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 glass border-b border-white/10 p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">Cast Your Vote</h2>
            <p className="text-secondary text-sm">
              🔒 Your vote is encrypted end-to-end
            </p>
          </div>
          {!isVoting && (
            <button
              onClick={handleClose}
              className="text-secondary hover:text-white transition-colors ml-4"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Proposal Info */}
          <div className="glass-light p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">{proposal.title}</h3>
            <p className="text-secondary text-sm">{proposal.description}</p>
          </div>

          {/* Voting Info */}
          <div className="flex items-center gap-3 p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <svg className="w-5 h-5 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-white">
              Your vote will be encrypted using FHEVM technology. No one can see your choice until the results are disclosed according to the proposal strategy.
            </p>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Select Your Option <span className="text-error">*</span>
            </label>
            <div className="space-y-2">
              {Array.from({ length: proposal.optionCount }, (_, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${
                    selectedOption === i
                      ? "bg-accent/20 border-2 border-accent shadow-lg shadow-accent/20"
                      : "bg-surface/30 border-2 border-white/5 hover:bg-surface/50 hover:border-white/10"
                  } ${isVoting ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="radio"
                    name="vote-option"
                    value={i}
                    checked={selectedOption === i}
                    onChange={() => !isVoting && setSelectedOption(i)}
                    disabled={isVoting}
                    className="w-5 h-5 text-accent focus:ring-accent focus:ring-offset-0"
                  />
                  <div className="flex-1">
                    <div className="text-white font-semibold">Option {i + 1}</div>
                    <div className="text-secondary text-sm">
                      {i === 0 && "Yes / Approve"}
                      {i === 1 && "No / Reject"}
                      {i > 1 && `Alternative ${i - 1}`}
                    </div>
                  </div>
                  {selectedOption === i && (
                    <svg className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-error/10 border border-error/50 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-error flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <div className="font-semibold text-error mb-1">Error</div>
                  <div className="text-sm text-white/80">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              disabled={isVoting}
              className="flex-1 px-6 py-3 bg-surface/50 hover:bg-surface/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleVote}
              disabled={selectedOption === null || isVoting}
              className="flex-1 btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVoting ? (
                <span className="flex items-center justify-center gap-2">
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
                  Encrypting & Submitting...
                </span>
              ) : (
                "🗳️ Cast Encrypted Vote"
              )}
            </button>
          </div>

          {/* Privacy Notice */}
          <div className="text-xs text-tertiary text-center">
            Your encrypted vote will be recorded on-chain. The transaction will be visible, but your actual choice remains private.
          </div>
        </div>
      </div>
    </div>
  );
}

