"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { BrowserProvider, JsonRpcSigner, JsonRpcProvider } from "ethers";
import { useMetaMaskProvider } from "./useMetaMaskProvider";

/**
 * MetaMaskEthersSignerProvider - Provides ethers.js signer
 */
interface MetaMaskEthersSignerContextType {
  provider: any;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  connect: () => Promise<void>;
  ethersSigner: JsonRpcSigner | undefined;
  ethersReadonlyProvider: JsonRpcProvider | undefined;
  sameChain: React.RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: React.RefObject<(signer: JsonRpcSigner | undefined) => boolean>;
  initialMockChains: Record<number, string>;
}

const MetaMaskEthersSignerContext =
  createContext<MetaMaskEthersSignerContextType | null>(null);

export function MetaMaskEthersSignerProvider({
  children,
  initialMockChains = {},
}: {
  children: ReactNode;
  initialMockChains?: Record<number, string>;
}) {
  const { provider, chainId, accounts, isConnected, connect } = useMetaMaskProvider();
  const [ethersSigner, setEthersSigner] = useState<JsonRpcSigner | undefined>(
    undefined
  );
  const [ethersReadonlyProvider, setEthersReadonlyProvider] = useState<
    JsonRpcProvider | undefined
  >(undefined);

  const chainIdRef = useRef(chainId);
  const ethersSignerRef = useRef(ethersSigner);

  // Update refs
  useEffect(() => {
    chainIdRef.current = chainId;
  }, [chainId]);

  useEffect(() => {
    ethersSignerRef.current = ethersSigner;
  }, [ethersSigner]);

  // Create ethers signer
  useEffect(() => {
    if (provider && accounts && accounts.length > 0) {
      const browserProvider = new BrowserProvider(provider);
      browserProvider.getSigner(accounts[0]).then(setEthersSigner);
    } else {
      setEthersSigner(undefined);
    }
  }, [provider, accounts]);

  // Create readonly provider
  useEffect(() => {
    if (chainId === 31337) {
      setEthersReadonlyProvider(new JsonRpcProvider("http://localhost:8545"));
    } else if (chainId) {
      // For other networks, use the same provider
      if (provider) {
        setEthersReadonlyProvider(new BrowserProvider(provider) as any);
      }
    } else {
      setEthersReadonlyProvider(undefined);
    }
  }, [chainId, provider]);

  // Comparison refs
  const sameChain = useRef((cid: number | undefined) => cid === chainIdRef.current);
  const sameSigner = useRef(
    (signer: JsonRpcSigner | undefined) => signer === ethersSignerRef.current
  );

  const _initialMockChains = useMemo(
    () => ({
      31337: "http://localhost:8545",
      ...initialMockChains,
    }),
    [initialMockChains]
  );

  return (
    <MetaMaskEthersSignerContext.Provider
      value={{
        provider,
        chainId,
        accounts,
        isConnected,
        connect,
        ethersSigner,
        ethersReadonlyProvider,
        sameChain,
        sameSigner,
        initialMockChains: _initialMockChains,
      }}
    >
      {children}
    </MetaMaskEthersSignerContext.Provider>
  );
}

export function useMetaMaskEthersSigner() {
  const context = useContext(MetaMaskEthersSignerContext);
  if (!context) {
    throw new Error(
      "useMetaMaskEthersSigner must be used within MetaMaskEthersSignerProvider"
    );
  }
  return context;
}


