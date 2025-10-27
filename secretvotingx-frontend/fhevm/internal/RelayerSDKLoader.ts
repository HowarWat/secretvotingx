import { FhevmRelayerSDKType, FhevmWindowType } from "./fhevmTypes";
import { SDK_CDN_URL } from "./constants";

type TraceType = (message?: unknown, ...optionalParams: unknown[]) => void;

/**
 * RelayerSDKLoader - Dynamically loads Relayer SDK from CDN
 * Implements the same pattern as the reference frontend
 */
export class RelayerSDKLoader {
  private _trace?: TraceType;

  constructor(options: { trace?: TraceType }) {
    this._trace = options.trace;
  }

  public isLoaded() {
    if (typeof window === "undefined") {
      throw new Error("RelayerSDKLoader: can only be used in the browser.");
    }
    return isFhevmWindowType(window, this._trace);
  }

  public load(): Promise<void> {
    this._trace?.("[RelayerSDKLoader] load...");
    
    if (typeof window === "undefined") {
      this._trace?.("[RelayerSDKLoader] window === undefined");
      return Promise.reject(
        new Error("RelayerSDKLoader: can only be used in the browser.")
      );
    }

    if ("relayerSDK" in window) {
      if (!isFhevmRelayerSDKType(window.relayerSDK, this._trace)) {
        this._trace?.("[RelayerSDKLoader] window.relayerSDK invalid");
        throw new Error("RelayerSDKLoader: Unable to load FHEVM Relayer SDK");
      }
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        `script[src="${SDK_CDN_URL}"]`
      );
      
      if (existingScript) {
        if (!isFhevmWindowType(window, this._trace)) {
          reject(
            new Error(
              "RelayerSDKLoader: window object does not contain a valid relayerSDK object."
            )
          );
        }
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = SDK_CDN_URL;
      script.type = "text/javascript";
      script.async = true;

      script.onload = () => {
        if (!isFhevmWindowType(window, this._trace)) {
          this._trace?.("[RelayerSDKLoader] script onload FAILED...");
          reject(
            new Error(
              `RelayerSDKLoader: Relayer SDK script loaded from ${SDK_CDN_URL}, but window.relayerSDK is invalid.`
            )
          );
        }
        resolve();
      };

      script.onerror = () => {
        this._trace?.("[RelayerSDKLoader] script onerror...");
        reject(
          new Error(
            `RelayerSDKLoader: Failed to load Relayer SDK from ${SDK_CDN_URL}`
          )
        );
      };

      this._trace?.("[RelayerSDKLoader] add script to DOM...");
      document.head.appendChild(script);
    });
  }
}

function isFhevmRelayerSDKType(
  o: unknown,
  trace?: TraceType
): o is FhevmRelayerSDKType {
  if (typeof o === "undefined" || o === null || typeof o !== "object") {
    trace?.("RelayerSDKLoader: relayerSDK is invalid");
    return false;
  }
  
  if (!objHasProperty(o, "initSDK", "function", trace)) {
    return false;
  }
  if (!objHasProperty(o, "createInstance", "function", trace)) {
    return false;
  }
  if (!objHasProperty(o, "SepoliaConfig", "object", trace)) {
    return false;
  }
  
  return true;
}

export function isFhevmWindowType(
  win: unknown,
  trace?: TraceType
): win is FhevmWindowType {
  if (typeof win === "undefined" || win === null || typeof win !== "object") {
    trace?.("RelayerSDKLoader: window object is invalid");
    return false;
  }
  if (!("relayerSDK" in win)) {
    trace?.("RelayerSDKLoader: window does not contain 'relayerSDK' property");
    return false;
  }
  return isFhevmRelayerSDKType(win.relayerSDK, trace);
}

function objHasProperty<T extends object, K extends PropertyKey, V extends string>(
  obj: T,
  propertyName: K,
  propertyType: V,
  trace?: TraceType
): obj is T & Record<K, V extends "function" ? (...args: any[]) => any : any> {
  if (!obj || typeof obj !== "object") {
    return false;
  }

  if (!(propertyName in obj)) {
    trace?.(`RelayerSDKLoader: missing ${String(propertyName)}.`);
    return false;
  }

  const value = (obj as Record<K, unknown>)[propertyName];

  if (value === null || value === undefined) {
    trace?.(`RelayerSDKLoader: ${String(propertyName)} is null or undefined.`);
    return false;
  }

  if (typeof value !== propertyType) {
    trace?.(
      `RelayerSDKLoader: ${String(propertyName)} is not a ${propertyType}.`
    );
    return false;
  }

  return true;
}


