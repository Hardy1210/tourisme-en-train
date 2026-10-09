// Journal JSON unique (docs/07-contrat-infra.md § 1) : une ligne par événement sur la sortie standard.
// Utilisé par l'application (serveur) et par le traitement des données (D031).
// Jamais de position utilisateur, de clé API ni de valeur de variable d'environnement dans `contexte`.

export type NiveauJournal = 'info' | 'avertissement' | 'erreur';

export function journaliser(
  niveau: NiveauJournal,
  message: string,
  contexte?: Record<string, unknown>,
): void {
  const ligne = {
    niveau,
    message,
    // Horodatage technique de l'événement (UTC), pas une date métier : il n'entre dans aucun calcul.
    horodatage: new Date().toISOString(),
    contexte: contexte ?? {},
  };
  process.stdout.write(`${JSON.stringify(ligne)}\n`);
}

export const journal = {
  info: (message: string, contexte?: Record<string, unknown>) =>
    journaliser('info', message, contexte),
  avertissement: (message: string, contexte?: Record<string, unknown>) =>
    journaliser('avertissement', message, contexte),
  erreur: (message: string, contexte?: Record<string, unknown>) =>
    journaliser('erreur', message, contexte),
};
