// Position du navigateur. Elle reste en mémoire : jamais enregistrée, jamais dans une URL (règle 5, D058).
export type EtatPosition =
  | { etat: 'attente' }
  | { etat: 'trouvee'; lat: number; lon: number }
  | { etat: 'refusee' }
  | { etat: 'indisponible' };

/** Code de `GeolocationPositionError` : 1 = refus de l'utilisateur ; le reste = position introuvable. */
export function etatDepuisErreur(code: number): EtatPosition {
  return code === 1 ? { etat: 'refusee' } : { etat: 'indisponible' };
}
