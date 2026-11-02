// Transports sur place (docs/04-traitement-donnees.md § 4.7, D046) : arrêts d'un GTFS urbain ou
// régional avec leurs lignes, stations d'un GBFS. Fonctions pures, testées ; la proximité des gares
// et le regroupement des quais se font en SQL (transformations/transport-local.sql).
import { z } from 'zod';

export type TypeArret = 'BUS' | 'TRAM' | 'CAR' | 'VELO';

/** Un arrêt ou une station, avant le rattachement aux gares. */
export interface ArretNormalise {
  idSource: string;
  nom: string;
  type: TypeArret;
  /** Numéros de lignes (bus, tram, car) ; null pour une station de vélos. */
  lignes: string[] | null;
  lon: number;
  lat: number;
}

/** `route_type` GTFS : 0 = tram ; 715 = transport à la demande, exclu (D020) ; ≥ 1500 = taxi. */
export function typeDeLigne(routeType: string): 'TRAM' | 'BUS' | null {
  const n = Number(routeType);
  if (!Number.isInteger(n)) return null;
  if (n === 0 || n === 900) return 'TRAM';
  if (n === 715 || n >= 1500) return null;
  return 'BUS';
}

export interface LigneGtfs {
  route_id: string;
  route_short_name?: string;
  route_long_name?: string;
  route_type: string;
}

export interface ArretGtfs {
  stop_id: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
  location_type?: string;
}

/** Nom d'arrêt nettoyé : tiret seul en début ou en fin retiré (« Gare SNCF - » chez Mobigo). */
export function nettoyerNomArret(nom: string): string {
  return nom.replace(/^[\s\-–]+|[\s\-–]+$/g, '').replace(/\s+/g, ' ');
}

/** Tri « humain » des numéros de ligne : 2, 10, L3, T1 (et non 10, 2). */
const comparerLignes = new Intl.Collator('fr', { numeric: true }).compare;

/**
 * Arrêts desservis d'un GTFS : seuls les arrêts (pas les stations parentes) par lesquels passe au
 * moins une ligne gardée. Type : `TRAM` si une ligne de tram s'y arrête, sinon `typeParDefaut`
 * (`BUS` pour un réseau urbain, `CAR` pour Mobigo).
 */
export function arretsDesservis(
  arrets: readonly ArretGtfs[],
  lignes: readonly LigneGtfs[],
  lignesParArret: ReadonlyMap<string, ReadonlySet<string>>,
  typeParDefaut: 'BUS' | 'CAR',
): ArretNormalise[] {
  const parId = new Map(lignes.map((l) => [l.route_id, l]));
  const resultat: ArretNormalise[] = [];
  for (const a of arrets) {
    if (a.location_type && a.location_type !== '0') continue;
    const gardees = [...(lignesParArret.get(a.stop_id) ?? [])]
      .map((id) => parId.get(id))
      .filter((l): l is LigneGtfs => l !== undefined && typeDeLigne(l.route_type) !== null);
    const lon = Number(a.stop_lon);
    const lat = Number(a.stop_lat);
    if (gardees.length === 0 || !Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    const noms = [
      ...new Set(
        gardees.map((l) => (l.route_short_name || l.route_long_name || l.route_id).trim()),
      ),
    ].sort(comparerLignes);
    const tram = gardees.some((l) => typeDeLigne(l.route_type) === 'TRAM');
    resultat.push({
      idSource: a.stop_id,
      nom: nettoyerNomArret(a.stop_name),
      type: tram ? 'TRAM' : typeParDefaut,
      lignes: noms,
      lon,
      lat,
    });
  }
  return resultat;
}

const schemaNomGbfs = z.union([
  z.string(),
  z.array(z.object({ text: z.string(), language: z.string().optional() })).min(1),
]);

export const schemaStationsGbfs = z.object({
  data: z.object({
    stations: z.array(
      z.object({
        station_id: z.union([z.string(), z.number()]).transform(String),
        name: schemaNomGbfs,
        lat: z.number(),
        lon: z.number(),
      }),
    ),
  }),
});

/** Stations d'un `station_information.json` (GBFS 2 ou 3 : nom texte ou traduit). */
export function stationsGbfs(json: unknown): ArretNormalise[] {
  return schemaStationsGbfs.parse(json).data.stations.map((s) => ({
    idSource: s.station_id,
    nom: nettoyerNomArret(typeof s.name === 'string' ? s.name : (s.name[0]?.text ?? '')),
    type: 'VELO',
    lignes: null,
    lon: s.lon,
    lat: s.lat,
  }));
}
