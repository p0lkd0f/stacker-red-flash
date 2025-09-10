import { LN } from "@getalby/sdk";

const NWC_STORAGE_KEY = "nwc_credentials";

export function getNwcCredentials(): string | null {
  try {
    return localStorage.getItem(NWC_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setNwcCredentials(uri: string) {
  try {
    localStorage.setItem(NWC_STORAGE_KEY, uri);
  } catch {}
}

export function getLNClient(): LN | null {
  const creds = getNwcCredentials();
  if (!creds) return null;
  try {
    return new LN(creds);
  } catch {
    return null;
  }
}
