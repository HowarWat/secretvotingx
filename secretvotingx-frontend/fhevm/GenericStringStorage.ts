/**
 * GenericStringStorage - Generic key-value storage interface
 */
export interface GenericStringStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}


