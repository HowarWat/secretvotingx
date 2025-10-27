import type { Eip1193Provider } from "ethers";

// EIP-712 typed data structure
export type EIP712Type = {
  domain: {
    chainId: number;
    name: string;
    verifyingContract: `0x${string}`;
    version: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any;
  primaryType: string;
  types: {
    [key: string]: {
      name: string;
      type: string;
    }[];
  };
};

// FhevmInstance type (will be provided by SDK or mock)
export type FhevmInstance = {
  getPublicKey: () => string;
  getPublicParams: (bits: number) => string;
  createEncryptedInput: (contractAddress: string, userAddress: string) => any;
  
  // Decryption methods
  userDecrypt: (
    handles: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ) => Promise<Record<string, any>>;
  
  // Mock mode only: Direct decryption without signature
  decrypt?: (
    contractAddress: string,
    userAddress: string,
    handle: bigint,
    type: string
  ) => Promise<bigint>;
  
  // Encryption methods
  encrypt_bool: (value: boolean) => Promise<any>;
  encrypt_uint8: (value: number) => Promise<any>;
  encrypt_uint16: (value: number) => Promise<any>;
  encrypt_uint32: (value: number) => Promise<any>;
  encrypt_uint64: (value: bigint) => Promise<any>;
  
  // Signature generation (Real Relayer SDK only)
  generateKeypair?: () => Promise<{ publicKey: string; privateKey: string }>;
  createEIP712?: (
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ) => EIP712Type;
};

export type FhevmInstanceConfig = {
  network: Eip1193Provider | string;
  publicKey?: string;
  publicParams?: string;
  aclContractAddress?: string;
  kmsVerifierAddress?: string;
};

// Relayer SDK types
export type FhevmRelayerSDKType = {
  initSDK: (options?: any) => Promise<boolean>;
  createInstance: (config: any) => Promise<FhevmInstance>;
  SepoliaConfig: {
    aclContractAddress: string;
    kmsVerifierAddress: string;
    executorAddress: string;
    inputVerifierAddress: string;
  };
  __initialized__?: boolean;
};

export type FhevmWindowType = Window & {
  relayerSDK: FhevmRelayerSDKType;
};

export type FhevmLoadSDKType = () => Promise<void>;
export type FhevmInitSDKType = (options?: any) => Promise<boolean>;
export type FhevmInitSDKOptions = any;


