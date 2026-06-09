/**
 * Helpers « feuilles » de l'onboarding : ne dépendent que des types/config.
 *
 * Extraits de `lib/onboarding.ts` pour CASSER le cycle d'import circulaire :
 *   onboarding.ts → onboarding-sections.ts → onboarding-facts.ts (pas de retour)
 *
 * Ces trois fonctions sont re-exportées depuis `lib/onboarding.ts` pour ne pas
 * casser les importeurs existants.
 * SERVEUR uniquement.
 */
import type { Intake } from "@/lib/onboarding-config";
import { eventLabel } from "@/lib/onboarding-config";
import type { GenFacts } from "@/lib/design-system-gen";
import { PHOTO_PLACEHOLDER_URL } from "@/lib/intake-map";

/** Brief enrichi des réponses structurées, pour la réécriture IA du site final. */
export function briefFromIntake(intake: Intake & { categoryId?: string }): string {
  const parts = [
    intake.brief,
    intake.brand && `Nom de la marque : ${intake.brand}`,
    intake.eventTypes?.length &&
      `Spécialités : ${intake.eventTypes.map(eventLabel).join(", ")}`,
    intake.about && `À propos : ${intake.about}`,
    intake.techRider && `Fiche technique : ${intake.techRider}`,
    // [3.3] Champs étendus par catégorie — tout ce que le client a donné nourrit l'IA.
    intake.experienceYears && `Expérience : ${intake.experienceYears}`,
    intake.priceRange && `Tarifs : ${intake.priceRange}`,
    intake.city && `Ville : ${intake.city}`,
    intake.genre && `Genre musical : ${intake.genre}`,
    intake.socialLinks && `Réseaux : ${intake.socialLinks}`,
    intake.musicLinks && `Extraits musicaux : ${intake.musicLinks}`,
    intake.upcomingDates && `Prochaines dates : ${intake.upcomingDates}`,
    intake.trade && `Métier et spécialités : ${intake.trade}`,
    intake.area && `Zone d'intervention : ${intake.area}`,
    intake.certifications && `Certifications : ${intake.certifications}`,
    intake.reviewsLink && `Avis clients : ${intake.reviewsLink}`,
    intake.jobTitle && `Titre professionnel : ${intake.jobTitle}`,
    intake.skills && `Compétences : ${intake.skills}`,
    intake.projects && `Projets : ${intake.projects}`,
    intake.availability && `Disponibilité : ${intake.availability}`,
    intake.instagram && `Instagram : ${intake.instagram}`,
    intake.contactPhone && `Téléphone : ${intake.contactPhone}`,
    intake.contactEmail && `Email de contact : ${intake.contactEmail}`,
  ];
  return parts.filter(Boolean).join("\n");
}

/** Faits compacts (aucun contenu de démo) à partir de l'intake — pour la génération. */
export function buildGenFacts(intake: Intake): GenFacts {
  return {
    brand: intake.brand,
    activity: intake.about || intake.trade || intake.jobTitle || intake.genre,
    services: intake.services?.length ? intake.services : intake.eventTypes,
    priceRange: intake.priceRange,
    area: intake.area || intake.city,
    tone: intake.tone,
    contact: [intake.contactEmail, intake.contactPhone].filter(Boolean).join(" · ") || undefined,
    brief: intake.brief?.trim() || briefFromIntake(intake),
    extras: [
      intake.certifications && `Certifications : ${intake.certifications}`,
      intake.experienceYears && `Expérience : ${intake.experienceYears}`,
      intake.availability && `Disponibilité : ${intake.availability}`,
      intake.socialLinks && `Réseaux : ${intake.socialLinks}`,
    ].filter(Boolean) as string[],
  };
}

/** Photos du client, ou placeholder neutre si aucune (jamais d'<img src="">). */
export function photoUrlsForIntake(intake: Intake): string[] {
  return Array.isArray(intake.photoUrls) && intake.photoUrls.length
    ? intake.photoUrls
    : [PHOTO_PLACEHOLDER_URL];
}
