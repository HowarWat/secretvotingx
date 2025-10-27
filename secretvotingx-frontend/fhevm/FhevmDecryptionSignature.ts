import type { ethers } from "ethers";
import type { FhevmInstance, EIP712Type } from "./internal/fhevmTypes";
import type { GenericStringStorage } from "./GenericStringStorage";

/**
 * FhevmDecryptionSignature - Manages EIP-712 decryption signatures
 * Based on reference implementation with proper key generation and EIP-712 signing
 */

export type FhevmDecryptionSignatureType = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number; // Unix timestamp in seconds
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
};

export class FhevmDecryptionSignature {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number;
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;

  constructor(data: FhevmDecryptionSignatureType) {
    this.publicKey = data.publicKey;
    this.privateKey = data.privateKey;
    this.signature = data.signature;
    this.startTimestamp = data.startTimestamp;
    this.durationDays = data.durationDays;
    this.userAddress = data.userAddress;
    this.contractAddresses = data.contractAddresses;
    this.eip712 = data.eip712;
  }

  /**
   * Create a new decryption signature with EIP-712 typed data
   */
  static async new(
    instance: FhevmInstance,
    contractAddresses: string[],
    publicKey: string,
    privateKey: string,
    signer: ethers.JsonRpcSigner
  ): Promise<FhevmDecryptionSignature | null> {
    try {
      const userAddress = (await signer.getAddress()) as `0x${string}`;
      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = 365; // 1 year validity

      // Check if instance supports createEIP712 (Real Relayer SDK)
      let eip712: EIP712Type;
      let signature: string;

      if (instance.createEIP712) {
        // Real Relayer SDK mode: Use proper EIP-712 structure from SDK
        eip712 = instance.createEIP712(
          publicKey,
          contractAddresses,
          startTimestamp,
          durationDays
        );

        // Sign with EIP-712
        signature = await signer.signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message
        );
      } else {
        // Mock mode: Create simplified EIP-712 structure
        console.log("Mock mode: Using simplified EIP-712 structure for testing");
        
        // Get chainId from provider
        const chainId = await signer.provider.getNetwork().then(n => n.chainId);
        
        eip712 = {
          domain: {
            chainId: Number(chainId),
            name: "FHEVM",
            verifyingContract: contractAddresses[0] as `0x${string}`,
            version: "1",
          },
          message: {
            publicKey,
            contractAddresses,
            startTimestamp,
            durationDays,
          },
          primaryType: "UserDecryptRequestVerification",
          types: {
            EIP712Domain: [
              { name: "name", type: "string" },
              { name: "version", type: "string" },
              { name: "chainId", type: "uint256" },
              { name: "verifyingContract", type: "address" },
            ],
            UserDecryptRequestVerification: [
              { name: "publicKey", type: "bytes" },
              { name: "contractAddresses", type: "address[]" },
              { name: "startTimestamp", type: "uint256" },
              { name: "durationDays", type: "uint256" },
            ],
          },
        };

        // Sign with EIP-712
        signature = await signer.signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message
        );
      }

      return new FhevmDecryptionSignature({
        publicKey,
        privateKey,
        contractAddresses: contractAddresses as `0x${string}`[],
        startTimestamp,
        durationDays,
        signature,
        eip712: eip712 as EIP712Type,
        userAddress,
      });
    } catch (error) {
      console.error("Failed to create decryption signature:", error);
      return null;
    }
  }

  /**
   * Load from storage or generate new signature
   */
  static async loadOrSign(
    instance: FhevmInstance,
    contractAddresses: `0x${string}`[],
    signer: ethers.JsonRpcSigner,
    storage: GenericStringStorage,
    keyPair?: { publicKey: string; privateKey: string }
  ): Promise<FhevmDecryptionSignature | null> {
    const userAddress = await signer.getAddress();
    const storageKey = `fhevm_decryption_sig_${userAddress}_${contractAddresses.sort().join(",")}`;

    // Try to load from storage
    const cached = await storage.get(storageKey);
    if (cached) {
      try {
        const parsed: FhevmDecryptionSignatureType = JSON.parse(cached);
        // Check if signature is still valid
        const now = Math.floor(Date.now() / 1000);
        const expiry = parsed.startTimestamp + parsed.durationDays * 86400;
        if (now < expiry) {
          console.log("Using cached decryption signature");
          return new FhevmDecryptionSignature(parsed);
        } else {
          console.log("Cached signature expired, generating new one");
        }
      } catch (error) {
        console.warn("Failed to parse cached signature:", error);
      }
    }

    // Generate new signature
    console.log("Generating new decryption signature...");

    // Generate or use provided keypair
    let finalKeyPair: { publicKey: string; privateKey: string };
    
    if (keyPair) {
      finalKeyPair = keyPair;
    } else if (instance.generateKeypair) {
      // Real Relayer SDK: Use instance's generateKeypair
      try {
        finalKeyPair = await instance.generateKeypair();
        console.log("Generated new keypair for decryption (Real mode)");
      } catch (error) {
        console.error("Failed to generate keypair:", error);
        return null;
      }
    } else {
      // Mock mode: Generate simplified keypair
      console.log("Mock mode: Generating simplified keypair for testing");
      // For Mock mode, we can use the existing public key from the instance
      // and generate a dummy private key
      const publicKey = instance.getPublicKey();
      const privateKey = "0x" + "00".repeat(32); // Dummy private key for Mock
      finalKeyPair = { publicKey, privateKey };
      console.log("Generated simplified keypair for Mock mode");
    }

    // Create new signature with EIP-712
    const sig = await FhevmDecryptionSignature.new(
      instance,
      contractAddresses,
      finalKeyPair.publicKey,
      finalKeyPair.privateKey,
      signer
    );

    if (!sig) {
      return null;
    }

    // Save to storage
    try {
      await storage.set(storageKey, JSON.stringify(sig));
      console.log("Decryption signature saved to storage");
    } catch (error) {
      console.warn("Failed to save signature to storage:", error);
    }

    return sig;
  }

  /**
   * Check if signature is still valid
   */
  isValid(): boolean {
    const now = Math.floor(Date.now() / 1000);
    const expiry = this.startTimestamp + this.durationDays * 86400;
    return now < expiry;
  }

  /**
   * Get remaining validity duration in seconds
   */
  getRemainingValidity(): number {
    const now = Math.floor(Date.now() / 1000);
    const expiry = this.startTimestamp + this.durationDays * 86400;
    return Math.max(0, expiry - now);
  }
}
