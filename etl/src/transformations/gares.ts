// Transformations des gares (docs/04-traitement-donnees.md § 4.1, D034) : fonctions pures,
// sans base ni réseau. Une valeur inutilisable renvoie null : l'appelant écarte la ligne et la compte.

/** Préfixe des codes UIC des gares françaises. */
const PREFIXE_UIC_FRANCE = '87';

/**
 * Code UIC sur 8 chiffres : `"0087713040"` → `"87713040"` (zéros de tête en trop retirés).
 * Toute autre longueur, ou un caractère non numérique, est refusé.
 */
export function normaliserUic(brut: string): string | null {
  let code = brut.trim();
  if (!/^\d+$/.test(code)) return null;
  while (code.length > 8 && code.startsWith('0')) code = code.slice(1);
  return code.length === 8 ? code : null;
}

/**
 * Liste `"87391011;87391003"` → `uic` = premier code français valide, `codesUic` = tous les codes
 * valides, sans doublon, dans l'ordre du fichier (`uic` compris). Aucun code français → null.
 */
export function lireCodesUic(brut: string): { uic: string; codesUic: string[] } | null {
  const codesUic = [
    ...new Set(
      brut
        .split(';')
        .map(normaliserUic)
        .filter((code) => code !== null),
    ),
  ];
  const uic = codesUic.find((code) => code.startsWith(PREFIXE_UIC_FRANCE));
  return uic ? { uic, codesUic } : null;
}

/** Code INSEE de commune : 5 chiffres, ou `2A`/`2B` + 3 chiffres pour la Corse. */
const CODE_INSEE = /^(\d{5}|2[AB]\d{3})$/;

/** Département d'une commune : `21231` → `21`, `2A004` → `2A`, `97411` → `974` (outre-mer). */
export function departementDe(codeInsee: string): string | null {
  if (!CODE_INSEE.test(codeInsee)) return null;
  return codeInsee.slice(0, codeInsee.startsWith('97') ? 3 : 2);
}

export function estDansRegion(departement: string, departementsRegion: readonly string[]): boolean {
  return departementsRegion.includes(departement);
}

/** Position du fichier SNCF, latitude d'abord : `"47.3233, 5.0272"` → `{ lat, lon }`. */
export function lirePosition(brut: string): { lat: number; lon: number } | null {
  const morceaux = brut.split(',').map((m) => m.trim());
  if (morceaux.length !== 2 || morceaux.some((m) => m === '')) return null;
  const [lat, lon] = morceaux.map(Number) as [number, number];
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}
