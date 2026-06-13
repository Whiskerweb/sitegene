/**
 * Roue de la fortune de bienvenue — AUTORITÉ SERVEUR.
 * Le gain est tiré ICI (jamais côté client) : la roue ne fait qu'animer
 * jusqu'au segment renvoyé par l'API. Un seul spin par compte, garanti par
 * profiles.wheel_spun_at (claim atomique dans /api/wheel/spin).
 */

/** Segments affichés sur la roue (ordre = sens horaire depuis le haut). */
export const WHEEL_SEGMENTS = [8, 10, 12, 15, 20, 25] as const;

/**
 * Poids de tirage alignés sur WHEEL_SEGMENTS. Le jackpot 25 (et le 20) sont
 * rares ; le plancher est 8 (jamais frustrant). Moyenne ≈ 12,6 crédits.
 */
export const WHEEL_WEIGHTS = [3, 4, 4, 3, 1, 1];

/** Espérance de gain (pour vérif/test). */
export function wheelExpectedValue(): number {
  const total = WHEEL_WEIGHTS.reduce((a, b) => a + b, 0);
  const sum = WHEEL_SEGMENTS.reduce((acc, v, i) => acc + v * WHEEL_WEIGHTS[i], 0);
  return sum / total;
}

/**
 * Tire un gain pondéré. `rand` ∈ [0,1) injectable pour les tests.
 * Retourne toujours une valeur présente dans WHEEL_SEGMENTS.
 */
export function spinReward(rand: number = Math.random()): number {
  const total = WHEEL_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = rand * total;
  for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
    r -= WHEEL_WEIGHTS[i];
    if (r < 0) return WHEEL_SEGMENTS[i];
  }
  return WHEEL_SEGMENTS[WHEEL_SEGMENTS.length - 1];
}
