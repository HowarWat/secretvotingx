/**
 * PublicKeyStorage - Cache for FHE public keys
 * Uses in-memory cache with sessionStorage fallback to avoid quota issues
 */

type PublicKeyData = {
  publicKey: string;
  publicParams: string;
};

const STORAGE_KEY_PREFIX = "fhevm_public_key_";

// In-memory cache as primary storage (to avoid sessionStorage quota issues)
const memoryCache = new Map<string, PublicKeyData>();

export async function publicKeyStorageGet(
  aclAddress: string
): Promise<PublicKeyData> {
  const key = STORAGE_KEY_PREFIX + aclAddress.toLowerCase();
  
  // Try in-memory cache first
  const cached = memoryCache.get(key);
  if (cached && cached.publicKey && cached.publicParams) {
    console.log("[PublicKeyStorage] Retrieved from memory cache");
    return cached;
  }
  
  // Fallback to sessionStorage
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const stored = window.sessionStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as PublicKeyData;
        // Only use cached data if both publicKey and publicParams are present
        // Otherwise, let the SDK regenerate them
        if (parsed.publicKey && parsed.publicParams) {
          // Restore to memory cache
          memoryCache.set(key, parsed);
          console.log("[PublicKeyStorage] Retrieved from sessionStorage and cached");
          return parsed;
        } else {
          console.log("[PublicKeyStorage] Cached data incomplete, will regenerate");
        }
      }
    } catch (e) {
      console.warn("[PublicKeyStorage] Failed to read from sessionStorage:", e);
    }
  }

  // Return empty keys if not found (SDK will generate new ones)
  return {
    publicKey: "",
    publicParams: "",
  };
}

export async function publicKeyStorageSet(
  aclAddress: string,
  publicKey: string,
  publicParams: string
): Promise<void> {
  const key = STORAGE_KEY_PREFIX + aclAddress.toLowerCase();
  const data: PublicKeyData = { publicKey, publicParams };
  
  // Always store in memory cache with complete data
  memoryCache.set(key, data);
  console.log("[PublicKeyStorage] Stored in memory cache");
  
  // Try to store in sessionStorage, but don't fail if quota exceeded
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      // Store complete data (both publicKey and publicParams)
      // This is necessary for Relayer SDK to work correctly
      window.sessionStorage.setItem(key, JSON.stringify(data));
      console.log("[PublicKeyStorage] Stored in sessionStorage");
    } catch (e) {
      // QuotaExceededError or other storage errors
      console.warn("[PublicKeyStorage] Failed to store in sessionStorage, using memory cache only:", e);
      
      // Try to clear old entries to make space
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const storageKey = window.sessionStorage.key(i);
          if (storageKey && storageKey.startsWith(STORAGE_KEY_PREFIX)) {
            keysToRemove.push(storageKey);
          }
        }
        // Remove old FHEVM keys (except current one)
        keysToRemove.filter(k => k !== key).forEach(k => window.sessionStorage.removeItem(k));
        console.log("[PublicKeyStorage] Cleared old sessionStorage entries");
        
        // Retry with complete data
        try {
          window.sessionStorage.setItem(key, JSON.stringify(data));
          console.log("[PublicKeyStorage] Successfully stored after cleanup");
        } catch (retryError) {
          console.warn("[PublicKeyStorage] Storage still failed after cleanup, continuing with memory cache only");
        }
      } catch (cleanupError) {
        console.warn("[PublicKeyStorage] Storage cleanup failed, continuing with memory cache only");
      }
    }
  }
}

/**
 * Clear all cached public keys (useful for testing)
 */
export function publicKeyStorageClear(): void {
  memoryCache.clear();
  if (typeof window !== "undefined" && window.sessionStorage) {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => window.sessionStorage.removeItem(k));
  }
  console.log("[PublicKeyStorage] Cleared all caches");
}


