// Descriptions des lieux en base (D105) : lecture de celles d'une source, puis remplacement des seules
// fiches dont la description change, dans la transaction de l'étape `descriptions`.
import type pg from 'pg';

export interface DescriptionEnBase {
  id: number;
  idSource: string;
  cle: string;
  nom: string;
  description: string | null;
}

export async function lireDescriptionsActuelles(
  client: pg.Pool | pg.ClientBase,
  source: string,
): Promise<DescriptionEnBase[]> {
  const { rows } = await client.query<{
    id: string;
    id_source: string;
    cle: string;
    nom: string;
    description: string | null;
  }>('SELECT id, id_source, cle, nom, description FROM lieu WHERE source = $1 ORDER BY id', [
    source,
  ]);
  return rows.map((r) => ({
    id: Number(r.id),
    idSource: r.id_source,
    cle: r.cle,
    nom: r.nom,
    description: r.description,
  }));
}

/** Remplace la description des lieux donnés ; renvoie le nombre de lignes modifiées. */
export async function mettreAJourDescriptions(
  client: pg.ClientBase,
  changements: readonly { id: number; description: string }[],
): Promise<number> {
  if (changements.length === 0) return 0;
  const { rowCount } = await client.query(
    `UPDATE lieu AS l SET description = c.description
     FROM unnest($1::bigint[], $2::text[]) AS c (id, description)
     WHERE l.id = c.id`,
    [changements.map((c) => c.id), changements.map((c) => c.description)],
  );
  return rowCount ?? 0;
}
