/**
 * Passage du brief de la home vers le tunnel /create.
 * Store client EN MÉMOIRE (singleton module) : les photos sont des `File[]`,
 * non sérialisables en URL/sessionStorage. La home remplit le store puis
 * navigue ; /create le consomme au montage. Rechargement direct de /create =
 * store vide → redirection home (acceptable).
 */
export type IntakePayload = {
  categoryId: string;
  brief: string;
  photos: File[];
  company: string; // honeypot
};

let current: IntakePayload | null = null;

export function setIntake(payload: IntakePayload): void {
  current = payload;
}

export function consumeIntake(): IntakePayload | null {
  return current;
}

export function clearIntake(): void {
  current = null;
}
