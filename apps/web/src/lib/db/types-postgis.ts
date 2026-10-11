// Types PostGIS pour Drizzle, déclarés une seule fois (docs/03-base-de-donnees.md § 1).
// Sans `import 'server-only'` : lu aussi par drizzle-kit, hors de Next.js (D031).
import { sql } from 'drizzle-orm';
import { customType } from 'drizzle-orm/pg-core';

/** Coordonnées WGS 84 (glossaire : point géographique). */
export type PointGeo = { lon: number; lat: number };

const TYPE_POINT = 1;
const DRAPEAU_SRID = 0x20000000;
const DRAPEAUX_Z_M = 0xc0000000;

/**
 * Lit un point au format EWKB hexadécimal, tel que PostgreSQL renvoie une colonne `geography`.
 * Refuse tout ce qui n'est pas un point 2D : une erreur claire vaut mieux qu'une coordonnée fausse.
 */
export function lirePointEwkb(hex: string): PointGeo {
  if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error('Point géographique illisible : hexadécimal attendu.');
  }
  const octets = Buffer.from(hex, 'hex');
  if (octets.length < 21) throw new Error('Point géographique illisible : trop court.');
  const petitBoutiste = octets.readUInt8(0) === 1;
  const lireEntier = (decalage: number) =>
    petitBoutiste ? octets.readUInt32LE(decalage) : octets.readUInt32BE(decalage);
  const lireReel = (decalage: number) =>
    petitBoutiste ? octets.readDoubleLE(decalage) : octets.readDoubleBE(decalage);

  const type = lireEntier(1);
  if ((type & DRAPEAUX_Z_M) !== 0 || (type & 0xffff) !== TYPE_POINT) {
    throw new Error('Point géographique illisible : seul un point 2D est accepté.');
  }
  const debut = (type & DRAPEAU_SRID) !== 0 ? 9 : 5;
  if (octets.length !== debut + 16) throw new Error('Point géographique illisible : longueur.');
  const lon = lireReel(debut);
  const lat = lireReel(debut + 8);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    throw new Error('Point géographique illisible : point vide.');
  }
  return { lon, lat };
}

/** Colonne `geography(Point, 4326)` : distances directement en mètres. */
export const geographyPoint = customType<{ data: PointGeo; driverData: string }>({
  // drizzle-kit 0.31 met ce type entre guillemets ; `pnpm db:generer` les retire (D033).
  dataType: () => 'geography(Point, 4326)',
  toDriver: ({ lon, lat }) => sql`ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography`,
  fromDriver: lirePointEwkb,
});
