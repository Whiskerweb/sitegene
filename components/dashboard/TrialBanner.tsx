/**
 * Bandeau discret pendant l'essai : jours restants + annulation en un clic.
 * Server-friendly (pas de state) — le form POST suffit.
 */
export default function TrialBanner({
  siteId,
  trialEndsAt,
}: {
  siteId: string;
  trialEndsAt: string;
}) {
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000),
  );
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-300 bg-white/60 px-5 py-3.5">
      <p className="text-sm text-night">
        <span className="font-semibold">Essai gratuit</span> —{" "}
        {daysLeft <= 1 ? "dernier jour" : `${daysLeft} jours restants`}. Votre
        site est en ligne ; 50 € seront débités à la fin de l'essai.
      </p>
      <form method="post" action="/api/trial/cancel">
        <input type="hidden" name="siteId" value={siteId} />
        <button type="submit" className="text-sm font-semibold text-mist hover:text-night">
          Annuler l'essai
        </button>
      </form>
    </div>
  );
}
