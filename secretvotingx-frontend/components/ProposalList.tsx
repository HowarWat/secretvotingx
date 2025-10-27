"use client";

import { Proposal } from "@/hooks/useSecretVoting";
import { ProposalCard } from "./ProposalCard";
import { useState } from "react";

export interface ProposalListProps {
  proposals: Proposal[];
  isLoading?: boolean;
  currentAccount?: string;
  onVote?: (proposalId: number) => void;
  onView?: (proposalId: number) => void;
  onFinalize?: (proposalId: number) => void;
}

type FilterType = "all" | "active" | "ended" | "finalized";

export function ProposalList({
  proposals,
  isLoading,
  currentAccount,
  onVote,
  onView,
  onFinalize,
}: ProposalListProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProposals = proposals.filter((proposal) => {
    // Filter by status
    if (filter !== "all" && proposal.status !== filter) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        proposal.title.toLowerCase().includes(term) ||
        proposal.description.toLowerCase().includes(term)
      );
    }

    return true;
  });

  const statusCounts = {
    all: proposals.length,
    active: proposals.filter((p) => p.status === "active").length,
    ended: proposals.filter((p) => p.status === "ended").length,
    finalized: proposals.filter((p) => p.status === "finalized").length,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-glass p-6 animate-pulse">
            <div className="h-6 bg-surface/50 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-surface/30 rounded w-full mb-2"></div>
            <div className="h-4 bg-surface/30 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search & Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search proposals..."
            className="w-full pl-12 pr-4 py-3 bg-surface/50 border border-white/10 rounded-lg text-white placeholder-secondary focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(["all", "active", "ended", "finalized"] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm ${
                filter === type
                  ? "bg-accent text-white"
                  : "bg-surface/30 text-secondary hover:bg-surface/60"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
              <span className="ml-2 text-xs opacity-75">({statusCounts[type]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-secondary">
        Showing {filteredProposals.length} of {proposals.length} proposals
      </div>

      {/* Proposal Grid */}
      {filteredProposals.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-secondary opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-lg text-white mb-2">No proposals found</p>
          <p className="text-sm text-secondary">
            {searchTerm
              ? "Try adjusting your search terms"
              : filter !== "all"
              ? `No ${filter} proposals available`
              : "No proposals have been created yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              isOwner={currentAccount?.toLowerCase() === proposal.owner.toLowerCase()}
              onVote={onVote}
              onView={onView}
              onFinalize={onFinalize}
            />
          ))}
        </div>
      )}
    </div>
  );
}


