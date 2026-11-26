// Chargement des textes Wikipédia dans `description_lieu` (docs/03-base-de-donnees.md § 3.6 quater, D123) :
// seules les lignes `origine = 'wikipedia'` sont remplacées ; nos propres textes (`wagoo`) restent. Les
// contraintes de la table (texte et crédit non vides) sont le dernier garde-fou après les contrôles.
import type pg from 'pg';

export interface TexteACharger {
  lieuId: number;
  texte: string;
  lien: string | null;
}

/** Lieux en base dont on cherche le texte, avec la commune qui sert au contrôle « article de la commune ». */
export interface LieuPourTexte {
  id: number;
  doublonDe: number | null;
  wikipedia: string | null;
  wikidata: string | null;
  commune: string | null;
}

export async function lireLieuxPourTextes(
  client: pg.Pool | pg.ClientBase,
): Promise<LieuPourTexte[]> {
  const { rows } = await client.query<{
    id: string;
    doublon_de: string | null;
    wikipedia: string | null;
    wikidata: string | null;
    commune: string | null;
  }>(
    `SELECT l.id, l.doublon_de, l.wikipedia, l.wikidata, c.nom AS commune
     FROM lieu l LEFT JOIN commune c ON c.code_insee = l.code_insee
     ORDER BY l.id`,
  );
  return rows.map((r) => ({
    id: Number(r.id),
    doublonDe: r.doublon_de === null ? null : Number(r.doublon_de),
    wikipedia: r.wikipedia,
    wikidata: r.wikidata,
    commune: r.commune,
  }));
}

export const CREDIT_WIKIPEDIA = 'Wikipédia';
export const LICENCE_WIKIPEDIA = 'CC BY-SA 4.0';
const PAQUET = 1000;

/** Remplace les textes Wikipédia ; renvoie le nombre de lignes `wikipedia` chargées. */
export async function chargerTextesWikipediaDans(
  client: pg.ClientBase,
  textes: readonly TexteACharger[],
): Promise<number> {
  await client.query("DELETE FROM description_lieu WHERE origine = 'wikipedia'");
  for (let i = 0; i < textes.length; i += PAQUET) {
    const paquet = textes.slice(i, i + PAQUET);
    await client.query(
      `INSERT INTO description_lieu (lieu_id, origine, texte, credit, licence, lien)
       SELECT lieu_id, 'wikipedia', texte, $4, $5, lien
       FROM unnest($1::bigint[], $2::text[], $3::text[]) AS t(lieu_id, texte, lien)`,
      [
        paquet.map((t) => t.lieuId),
        paquet.map((t) => t.texte),
        paquet.map((t) => t.lien),
        CREDIT_WIKIPEDIA,
        LICENCE_WIKIPEDIA,
      ],
    );
  }
  const { rows } = await client.query<{ n: string }>(
    "SELECT count(*) AS n FROM description_lieu WHERE origine = 'wikipedia'",
  );
  return Number(rows[0]?.n ?? 0);
}
