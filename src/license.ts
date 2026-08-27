const SLUG = 'care-dose-board';
const TOKEN_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${TOKEN_KEY}:verdict`;
const DAY = 86_400_000;

interface Verdict {
  valid: boolean;
  checkedAt: number;
  reason?: string;
}

export const checkoutUrl = `https://api.sociobot.in/api/v1/products/${SLUG}/checkout`;

export function captureLicenseFromUrl(): string | null {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return localStorage.getItem(TOKEN_KEY);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(VERDICT_KEY);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return token;
}

export function cachedLicenseIsValid(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  try {
    const verdict = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '') as Verdict;
    return verdict.valid;
  } catch {
    return false;
  }
}

export function saveLicense(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export function removeLicense(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VERDICT_KEY);
}

export async function verifyLicense(force = false): Promise<{ valid: boolean; reason?: string; skipped?: boolean }> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return { valid: false, reason: 'missing' };
  if (!force) {
    try {
      const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '') as Verdict;
      if (Date.now() - cached.checkedAt < DAY) return { ...cached, skipped: true };
    } catch { /* verify below */ }
  }
  const response = await fetch(`https://api.sociobot.in/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error('License verification is temporarily unavailable.');
  const result = await response.json() as { valid: boolean; reason?: string };
  const verdict: Verdict = { valid: result.valid, reason: result.reason, checkedAt: Date.now() };
  localStorage.setItem(VERDICT_KEY, JSON.stringify(verdict));
  return result;
}
