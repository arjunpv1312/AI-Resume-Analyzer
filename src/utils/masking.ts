/**
 * Security & API Key Masking Utility
 *
 * Ensures API keys and sensitive credentials are never displayed in plain text
 * in the UI, console logs, or exported data.
 */

export interface MaskOptions {
  visibleStart?: number;
  visibleEnd?: number;
  maskChar?: string;
  mode?: "partial" | "full" | "compact";
}

export interface KeySecuritySummary {
  isConfigured: boolean;
  source: string;
  masked: string;
  compactMasked: string;
  length: number;
  formatValid: boolean;
  provider: string;
}

/**
 * Mask an API key with configurable visible head/tail and bullet characters.
 * Example: "AIzaSyB31...89Xz" -> "AIzaSy••••••••••••••••••••••••••••89Xz"
 */
export function maskApiKey(
  key: string | null | undefined,
  options: MaskOptions = {}
): string {
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    return "••••••••••••••••••••••••";
  }

  const trimmed = key.trim();
  const {
    visibleStart = 6,
    visibleEnd = 4,
    maskChar = "•",
    mode = "partial",
  } = options;

  if (mode === "full") {
    return maskChar.repeat(Math.max(16, trimmed.length));
  }

  if (trimmed.length <= visibleStart + visibleEnd) {
    return maskChar.repeat(Math.max(8, trimmed.length));
  }

  if (mode === "compact") {
    const start = trimmed.slice(0, Math.min(visibleStart, 4));
    const end = trimmed.slice(-Math.min(visibleEnd, 4));
    return `${start}••••${end}`;
  }

  // Partial mode: show first N chars, last M chars, mask middle
  const head = trimmed.slice(0, visibleStart);
  const tail = trimmed.slice(-visibleEnd);
  const maskedLength = Math.max(8, trimmed.length - visibleStart - visibleEnd);
  const maskedMiddle = maskChar.repeat(maskedLength);

  return `${head}${maskedMiddle}${tail}`;
}

/**
 * Validates whether a given key matches Google/Gemini standard format
 */
export function isValidGeminiApiKeyFormat(key: string | null | undefined): boolean {
  if (!key || typeof key !== "string") return false;
  const trimmed = key.trim();
  // Google API keys typically start with AIza and are 39 chars long
  return /^AIza[0-9A-Za-z_-]{35}$/.test(trimmed);
}

/**
 * Returns security summary metadata for a key without exposing raw characters
 */
export function getKeySecuritySummary(
  key: string | null | undefined,
  source = "GEMINI_API_KEY"
): KeySecuritySummary {
  const isConfigured = Boolean(key && key.trim().length > 0);
  const trimmed = key ? key.trim() : "";
  const formatValid = isValidGeminiApiKeyFormat(trimmed);

  return {
    isConfigured,
    source,
    masked: isConfigured ? maskApiKey(trimmed, { mode: "partial" }) : "Not Configured",
    compactMasked: isConfigured ? maskApiKey(trimmed, { mode: "compact" }) : "Unset",
    length: isConfigured ? trimmed.length : 0,
    formatValid,
    provider: trimmed.startsWith("AIza") ? "Google AI Studio" : "Generic API Key",
  };
}

/**
 * Safely copies text to clipboard with optional security wipe callback
 */
export async function copySecretSafely(
  text: string,
  onCopied?: () => void
): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      if (onCopied) onCopied();
      return true;
    }
    // Fallback for environments where navigator.clipboard might be restricted
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    if (successful && onCopied) onCopied();
    return successful;
  } catch (err) {
    console.warn("Unable to copy securely:", err);
    return false;
  }
}
