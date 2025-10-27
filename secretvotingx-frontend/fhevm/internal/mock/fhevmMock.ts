//////////////////////////////////////////////////////////////////////////
//
// WARNING!!
// ALWAYS USE DYNAMICALLY IMPORT THIS FILE TO AVOID INCLUDING THE ENTIRE 
// FHEVM MOCK LIB IN THE FINAL PRODUCTION BUNDLE!!
//
//////////////////////////////////////////////////////////////////////////

import { JsonRpcProvider } from "ethers";
import { MockFhevmInstance } from "@fhevm/mock-utils";
import type { FhevmInstance } from "../fhevmTypes";

/**
 * fhevmMockCreateInstance - Create mock FHEVM instance using @fhevm/mock-utils
 */
export async function fhevmMockCreateInstance(params: {
  rpcUrl: string;
  chainId: number;
  metadata: {
    ACLAddress: `0x${string}`;
    InputVerifierAddress: `0x${string}`;
    KMSVerifierAddress: `0x${string}`;
  };
}): Promise<FhevmInstance> {
  console.log("Creating MockFhevmInstance with params:", params);
  
  const provider = new JsonRpcProvider(params.rpcUrl);
  
  const instance = await MockFhevmInstance.create(provider, provider, {
    aclContractAddress: params.metadata.ACLAddress,
    chainId: params.chainId,
    gatewayChainId: 55815,
    inputVerifierContractAddress: params.metadata.InputVerifierAddress,
    kmsContractAddress: params.metadata.KMSVerifierAddress,
    verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
    verifyingContractAddressInputVerification: "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
  });
  
  console.log("MockFhevmInstance created successfully");
  
  return instance as unknown as FhevmInstance;
}

