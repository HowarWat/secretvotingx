"use client";

import { useState } from "react";

export interface CreateProposalFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    optionCount: number;
    duration: number;
    strategy: number;
    minQuorum: number;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

const STRATEGY_OPTIONS = [
  { value: 0, label: "Public After End", description: "Results visible to everyone after voting ends" },
  { value: 1, label: "Owner Only", description: "Only proposal owner can see results" },
  { value: 2, label: "Qualified Only", description: "Only addresses with permission" },
];

const DURATION_PRESETS = [
  { value: 30, label: "30 Sec" },
  { value: 60, label: "1 Min" },
  { value: 300, label: "5 Min" },
  { value: 3600, label: "1 Hour" },
  { value: 86400, label: "1 Day" },
  { value: 604800, label: "1 Week" },
];

export function CreateProposalForm({ onSubmit, isSubmitting }: CreateProposalFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    optionCount: 2,
    duration: 60, // 1 minute default for testing
    strategy: 0,
    minQuorum: 1,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    if (formData.optionCount < 2 || formData.optionCount > 10) {
      newErrors.optionCount = "Must have 2-10 options";
    }

    if (formData.minQuorum < 1) {
      newErrors.minQuorum = "Minimum quorum must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submitted with data:", formData);
    
    if (!validate()) {
      console.log("Validation failed");
      return;
    }

    try {
      console.log("Calling onSubmit...");
      await onSubmit(formData);
      console.log("Proposal created successfully!");
      
      // Reset form on success
      setFormData({
        title: "",
        description: "",
        optionCount: 2,
        duration: 60,
        strategy: 0,
        minQuorum: 1,
      });
      setShowAdvanced(false);
      setErrors({});
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create proposal";
      console.error("Failed to create proposal:", error);
      setErrors({ submit: errorMessage });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Proposal Title <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Should we implement feature X?"
          className="w-full px-4 py-3 bg-surface/50 border border-white/10 rounded-lg text-white placeholder-secondary focus:outline-none focus:border-accent transition-colors"
          disabled={isSubmitting}
        />
        {errors.title && <p className="text-error text-sm mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Description <span className="text-error">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Provide detailed information about this proposal..."
          rows={4}
          className="w-full px-4 py-3 bg-surface/50 border border-white/10 rounded-lg text-white placeholder-secondary focus:outline-none focus:border-accent transition-colors resize-none"
          disabled={isSubmitting}
        />
        {errors.description && <p className="text-error text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Option Count */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Number of Options (2-10)
        </label>
        <input
          type="number"
          min="2"
          max="10"
          value={formData.optionCount}
          onChange={(e) => setFormData({ ...formData, optionCount: parseInt(e.target.value) || 2 })}
          className="w-full px-4 py-3 bg-surface/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent transition-colors"
          disabled={isSubmitting}
        />
        {errors.optionCount && <p className="text-error text-sm mt-1">{errors.optionCount}</p>}
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Voting Duration
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setFormData({ ...formData, duration: preset.value })}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.duration === preset.value
                  ? "bg-accent text-white"
                  : "bg-surface/30 text-secondary hover:bg-surface/60"
              }`}
              disabled={isSubmitting}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <input
          type="number"
          min="10"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
          className="w-full px-4 py-3 bg-surface/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent transition-colors"
          disabled={isSubmitting}
          placeholder="Custom duration (seconds, min: 10)"
        />
      </div>

      {/* Advanced Options Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-accent hover:text-accent/80 text-sm font-medium flex items-center gap-2 transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Advanced Options
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-surface/30 rounded-lg border border-white/5">
          {/* Strategy */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Result Disclosure Strategy
            </label>
            <div className="space-y-2">
              {STRATEGY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    formData.strategy === option.value
                      ? "bg-accent/10 border border-accent/30"
                      : "bg-surface/20 border border-white/5 hover:bg-surface/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="strategy"
                    value={option.value}
                    checked={formData.strategy === option.value}
                    onChange={() => setFormData({ ...formData, strategy: option.value })}
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">{option.label}</div>
                    <div className="text-secondary text-sm">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Min Quorum */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Minimum Quorum
            </label>
            <input
              type="number"
              min="1"
              value={formData.minQuorum}
              onChange={(e) => setFormData({ ...formData, minQuorum: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-3 bg-surface/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent transition-colors"
              disabled={isSubmitting}
            />
            {errors.minQuorum && <p className="text-error text-sm mt-1">{errors.minQuorum}</p>}
          </div>
        </div>
      )}

      {/* Error Display */}
      {errors.submit && (
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
              <div className="font-semibold text-error mb-1">Failed to Create Proposal</div>
              <div className="text-sm text-white/80">{errors.submit}</div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
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
            Creating Proposal...
          </span>
        ) : (
          "Create Proposal"
        )}
      </button>
    </form>
  );
}


