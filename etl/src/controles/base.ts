// Contrôles déclaratifs d'un chargement (docs/04-traitement-donnees.md § 5).
// Exécutés sur la table temporaire, dans la transaction : un contrôle bloquant en échec annule tout.
import type pg from 'pg';

export interface Controle {
  nom: string;
  /** true = un échec annule le chargement ; false = simple avertissement dans le rapport. */
  bloquant: boolean;
  verifier: (client: pg.ClientBase) => Promise<{ reussi: boolean; detail: string }>;
}

export interface ResultatControle {
  nom: string;
  bloquant: boolean;
  reussi: boolean;
  detail: string;
}

export async function executerControles(
  client: pg.ClientBase,
  controles: readonly Controle[],
): Promise<ResultatControle[]> {
  const resultats: ResultatControle[] = [];
  for (const { nom, bloquant, verifier } of controles) {
    resultats.push({ nom, bloquant, ...(await verifier(client)) });
  }
  return resultats;
}

export function echecsBloquants(resultats: readonly ResultatControle[]): ResultatControle[] {
  return resultats.filter((r) => r.bloquant && !r.reussi);
}

/** Levée quand un contrôle bloquant échoue : porte tous les résultats, pour le rapport. */
export class ErreurControles extends Error {
  constructor(readonly resultats: readonly ResultatControle[]) {
    const noms = echecsBloquants(resultats).map((r) => `${r.nom} (${r.detail})`);
    super(`Contrôle bloquant en échec : ${noms.join(' ; ')}`);
    this.name = 'ErreurControles';
  }
}

/** Contrôle « au moins `minimum` lignes » : le cas le plus fréquent (comptages de `04` § 4). */
export function auMoins(
  nom: string,
  requeteComptage: string,
  minimum: number,
  bloquant = true,
): Controle {
  return {
    nom,
    bloquant,
    async verifier(client) {
      const { rows } = await client.query<{ n: number }>(requeteComptage);
      const n = rows[0]?.n ?? 0;
      return { reussi: n >= minimum, detail: `${n} (minimum ${minimum})` };
    },
  };
}

/** Contrôle « la requête compte 0 ligne » (requête paramétrée : `$1`, `$2`…). */
export function aucune(
  nom: string,
  requete: string,
  valeurs: readonly unknown[] = [],
  bloquant = true,
): Controle {
  return {
    nom,
    bloquant,
    async verifier(client) {
      const { rows } = await client.query<{ n: number }>(requete, [...valeurs]);
      const n = rows[0]?.n ?? 0;
      return { reussi: n === 0, detail: n === 0 ? 'aucune' : `${n} trouvée(s)` };
    },
  };
}
