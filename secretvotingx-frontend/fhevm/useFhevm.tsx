"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { Eip1193Provider } from "ethers";
import { createFhevmInstance, FhevmAbortError } from "./internal/fhevm";
import type { FhevmInstance } from "./fhevmTypes";

type FhevmStatus =
  | "idle"
  | "sdk-loading"
  | "sdk-loaded"
  | "sdk-initializing"
  | "sdk-initialized"
  | "creating"
  | "ready"
  | "error";

/**
 * useFhevm - React hook for FHEVM instance management
 * Implements the same pattern as the reference frontend
 */
export function useFhevm(params: {
  provider: Eip1193Provider | undefined;
  chainId: number | undefined;
  initialMockChains?: Record<number, string>;
  enabled?: boolean;
}) {
  const { provider, chainId, initialMockChains, enabled = true } = params;

  const [instance, setInstance] = useState<FhevmInstance | undefined>(
    undefined
  );
  const [status, setStatus] = useState<FhevmStatus>("idle");
  const [error, setError] = useState<Error | undefined>(undefined);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isCreatingRef = useRef(false);

  const createInstance = useCallback(async () => {
    if (!enabled || !provider || !chainId || isCreatingRef.current) {
      return;
    }

    // Cancel previous creation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    isCreatingRef.current = true;
    setError(undefined);
    setStatus("sdk-loading");

    try {
      const newInstance = await createFhevmInstance({
        provider,
        mockChains: initialMockChains,
        signal: abortControllerRef.current.signal,
        onStatusChange: (status) => {
          setStatus(status);
        },
      });

      setInstance(newInstance);
      setStatus("ready");
    } catch (e) {
      if (e instanceof FhevmAbortError) {
        // Aborted, ignore
        setStatus("idle");
      } else {
        console.error("Failed to create FHEVM instance", e);
        setError(e as Error);
        setStatus("error");
      }
    } finally {
      isCreatingRef.current = false;
    }
  }, [enabled, provider, chainId, initialMockChains]);

  useEffect(() => {
    if (enabled && provider && chainId) {
      createInstance();
    } else {
      setInstance(undefined);
      setStatus("idle");
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, provider, chainId, createInstance]);

  return {
    instance,
    status,
    error,
    isReady: status === "ready" && instance !== undefined,
  };
}


