// Calculs de calendrier purs sur des dates AAAA-MM-JJ : l'horloge n'est jamais lue, et midi UTC
// évite qu'un changement d'heure fasse glisser le jour.
const versDate = (date: string): Date => {
  const [annee = NaN, mois = NaN, jour = NaN] = date.split('-').map(Number);
  return new Date(Date.UTC(annee, mois - 1, jour, 12));
};
const versTexte = (date: Date): string => date.toISOString().slice(0, 10);

export function decalerJours(date: string, jours: number): string {
  const resultat = versDate(date);
  resultat.setUTCDate(resultat.getUTCDate() + jours);
  return versTexte(resultat);
}

/** Premier jour du mois, décalé de `mois` mois. */
export function debutDeMois(date: string, mois = 0): string {
  const d = versDate(date);
  return versTexte(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + mois, 1, 12)));
}

/** Semaines du mois de `date`, du lundi au dimanche ; null hors du mois. */
export function grilleDuMois(date: string): (string | null)[] {
  const debut = versDate(debutDeMois(date));
  const avant = (debut.getUTCDay() + 6) % 7;
  const nbJours = new Date(
    Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  const jours = Array.from({ length: nbJours }, (_, i) => decalerJours(versTexte(debut), i));
  return [...Array.from({ length: avant }, () => null), ...jours];
}

const format = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', ...options });
const majuscule = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

/** « Mar. 17 nov. » ; le 1er du mois s'écrit « 1er ». */
export function libelleCourt(date: string): string {
  const d = versDate(date);
  const jourSemaine = format({ weekday: 'short' }).format(d);
  const mois = format({ month: 'short' }).format(d);
  const jour = d.getUTCDate() === 1 ? '1er' : String(d.getUTCDate());
  return majuscule(`${jourSemaine} ${jour} ${mois}`);
}

/** « Novembre 2026 ». */
export const libelleMois = (date: string): string =>
  majuscule(format({ month: 'long', year: 'numeric' }).format(versDate(date)));

/** « mardi 17 novembre 2026 », pour les lecteurs d'écran. */
export const libelleComplet = (date: string): string =>
  format({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
    versDate(date),
  );
