/**
 * Helpers du changement d'adresse email. Pas d'I/O ici : génération/validation
 * de token et validation d'email, réutilisables côté routes + tests.
 */
import { createHash, randomBytes } from "crypto";

/** Durée de validité d'un lien de confirmation. */
export const EMAIL_CHANGE_TTL_MS = 60 * 60 * 1000; // 1 heure
/** Anti-spam : délai minimal entre deux demandes pour un même compte. */
export const EMAIL_CHANGE_RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

// Validation volontairement simple (la vraie preuve d'existence = le clic dans
// l'email). On borne juste le format et la longueur RFC.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(s: string): boolean {
  return EMAIL_RE.test(s) && s.length <= 254;
}

export function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

/** SHA-256 hex d'un token — ce qui est stocké en base (jamais le token en clair). */
export function hashEmailChangeToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Nouveau token à usage unique : `raw` part dans l'email, `hash` va en base. */
export function newEmailChangeToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashEmailChangeToken(raw) };
}

export type EmailChangeState = "valid" | "invalid" | "expired" | "used";

/**
 * Classe l'état d'une demande (hors composant : la lecture de l'heure courante
 * n'est pas permise pendant le render d'un Server Component).
 */
export function classifyEmailChangeRequest(
  req: { expires_at: string; used_at: string | null } | null | undefined,
): EmailChangeState {
  if (!req) return "invalid";
  if (req.used_at) return "used";
  if (new Date(req.expires_at).getTime() < Date.now()) return "expired";
  return "valid";
}
