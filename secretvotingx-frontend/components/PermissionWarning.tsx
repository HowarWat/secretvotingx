"use client";

export interface PermissionWarningProps {
  account?: string;
}

export function PermissionWarning({ account }: PermissionWarningProps) {
  // Permission warning is no longer needed - anyone can create proposals
  return null;
}

