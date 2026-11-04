// Adresse de la fiche d'un lieu, depuis l'écran Explorer ou une fiche destination.

export type ContexteTrajet = { depuis: string; date: string | null };

/** Avec un contexte de trajet, la fiche propose « Y aller en train » ; aucune position n'y figure (D058). */
export function lienLieu(cle: string, trajet?: ContexteTrajet): string {
  const chemin = `/lieux/${encodeURIComponent(cle)}`;
  if (!trajet) return chemin;
  const suite = new URLSearchParams({ depuis: trajet.depuis });
  if (trajet.date !== null) suite.set('date', trajet.date);
  return `${chemin}?${suite.toString()}`;
}
