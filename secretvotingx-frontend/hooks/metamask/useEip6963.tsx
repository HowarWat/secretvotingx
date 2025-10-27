"use client";

import { useEffect, useState } from "react";
import type {
  EIP6963ProviderDetail,
  EIP6963AnnounceProviderEvent,
} from "./Eip6963Types";

/**
 * useEip6963 - Hook for EIP-6963 provider discovery
 */
export function useEip6963() {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);

  useEffect(() => {
    const handleAnnouncement = (event: EIP6963AnnounceProviderEvent) => {
      setProviders((prev) => {
        const exists = prev.some((p) => p.info.uuid === event.detail.info.uuid);
        if (exists) return prev;
        return [...prev, event.detail];
      });
    };

    window.addEventListener(
      "eip6963:announceProvider",
      handleAnnouncement as EventListener
    );

    // Request providers to announce themselves
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener(
        "eip6963:announceProvider",
        handleAnnouncement as EventListener
      );
    };
  }, []);

  return { providers };
}


