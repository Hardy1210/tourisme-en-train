// Chargement de `photo_lieu` (docs/03-base-de-donnees.md § 3.6 ter, D100) : la table est entièrement
// remplacée à chaque `pnpm etl photos`, dans la transaction de l'étape. Les contraintes de la table (crédit
// non vide, dates de droits cohérentes) sont le dernier garde-fou après les règles de choix.
import type pg from 'pg';
import type { PhotoChoisie } from '../transformations/photos';

export type PhotoACharger = PhotoChoisie & { lieuId: number };

/** Lieux en base dont on cherche la photo : non doublons, avec les candidats de leurs doublons. */
export interface LieuPourPhoto {
  id: number;
  source: string;
  idSource: string;
  doublonDe: number | null;
  imageUrl: string | null;
  wikipedia: string | null;
  wikidata: string | null;
}

export async function lireLieuxPourPhotos(
  client: pg.Pool | pg.ClientBase,
): Promise<LieuPourPhoto[]> {
  const { rows } = await client.query<{
    id: string;
    source: string;
    id_source: string;
    doublon_de: string | null;
    image_url: string | null;
    wikipedia: string | null;
    wikidata: string | null;
  }>(
    `SELECT id, source, id_source, doublon_de, image_url, wikipedia, wikidata FROM lieu ORDER BY id`,
  );
  return rows.map((r) => ({
    id: Number(r.id),
    source: r.source,
    idSource: r.id_source,
    doublonDe: r.doublon_de === null ? null : Number(r.doublon_de),
    imageUrl: r.image_url,
    wikipedia: r.wikipedia,
    wikidata: r.wikidata,
  }));
}

const PAQUET = 1000;

/** Remplace toutes les photos ; renvoie le nombre de lignes chargées. */
export async function chargerPhotosDans(
  client: pg.ClientBase,
  photos: readonly PhotoACharger[],
): Promise<number> {
  await client.query('DELETE FROM photo_lieu');
  for (let i = 0; i < photos.length; i += PAQUET) {
    const paquet = photos.slice(i, i + PAQUET);
    const colonne = <K extends keyof PhotoACharger>(cle: K) => paquet.map((p) => p[cle]);
    await client.query(
      `INSERT INTO photo_lieu (lieu_id, source, origine, fichier, url_petite, url_grande, auteur, licence,
         licence_url, page, droits_debut, droits_fin)
       SELECT * FROM unnest($1::bigint[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[],
         $7::text[], $8::text[], $9::text[], $10::text[], $11::date[], $12::date[])`,
      [
        colonne('lieuId'),
        colonne('source'),
        colonne('origine'),
        colonne('fichier'),
        colonne('urlPetite'),
        colonne('urlGrande'),
        colonne('auteur'),
        colonne('licence'),
        colonne('licenceUrl'),
        colonne('page'),
        colonne('droitsDebut'),
        colonne('droitsFin'),
      ],
    );
  }
  const { rows } = await client.query<{ n: string }>('SELECT count(*) AS n FROM photo_lieu');
  return Number(rows[0]?.n ?? 0);
}
