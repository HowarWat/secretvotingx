"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Eip1193Provider } from "ethers";
import { useEip6963 } from "./useEip6963";

/**
 * MetaMaskProvider - Context provider for MetaMask connection
 */
interface MetaMaskContextType {
  provider: Eip1193Provider | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  connect: () => Promise<void>;
}

const MetaMaskContext = createContext<MetaMaskContextType | null>(null);

export function MetaMaskProvider({ children }: { children: ReactNode }) {
  const { providers } = useEip6963();
  const [provider, setProvider] = useState<Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [accounts, setAccounts] = useState<string[] | undefined>(undefined);

  // Auto-select MetaMask provider
  useEffect(() => {
    if (providers.length > 0) {
      const metamask = providers.find((p) =>
        p.info.rdns.includes("metamask") || p.info.name.toLowerCase().includes("metamask")
      );
      if (metamask) {
        setProvider(metamask.provider);
      } else {
        setProvider(providers[0].provider);
      }
    } else if (typeof window !== "undefined" && window.ethereum) {
      setProvider(window.ethereum as Eip1193Provider);
    }
  }, [providers]);

  // Listen for account and chain changes
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = (newAccounts: string[]) => {
      setAccounts(newAccounts.length > 0 ? newAccounts : undefined);
    };

    const handleChainChanged = (newChainId: string) => {
      setChainId(Number.parseInt(newChainId, 16));
      // Reload page on chain change (recommended by MetaMask)
      window.location.reload();
    };

    (provider as any).on?.("accountsChanged", handleAccountsChanged);
    (provider as any).on?.("chainChanged", handleChainChanged);

    // Get initial state
    provider.request({ method: "eth_accounts" }).then((accs) => {
      setAccounts((accs as string[]).length > 0 ? (accs as string[]) : undefined);
    });

    provider.request({ method: "eth_chainId" }).then((id) => {
      setChainId(Number.parseInt(id as string, 16));
    });

    return () => {
      (provider as any).removeListener?.("accountsChanged", handleAccountsChanged);
      (provider as any).removeListener?.("chainChanged", handleChainChanged);
    };
  }, [provider]);

  const connect = async () => {
    if (!provider) {
      throw new Error("No provider available");
    }
    try {
      const newAccounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      setAccounts(newAccounts.length > 0 ? newAccounts : undefined);
    } catch (e) {
      console.error("Failed to connect", e);
    }
  };

  const isConnected = Boolean(provider && accounts && accounts.length > 0);

  return (
    <MetaMaskContext.Provider
      value={{ provider, chainId, accounts, isConnected, connect }}
    >
      {children}
    </MetaMaskContext.Provider>
  );
}

export function useMetaMaskProvider() {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error("useMetaMaskProvider must be used within MetaMaskProvider");
  }
  return context;
}

