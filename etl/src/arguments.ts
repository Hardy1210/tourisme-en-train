// Lecture des arguments de `pnpm etl <source|all> [--force] [--hors-ligne]` (fonction pure, testée).
import { parseArgs } from 'node:util';

/** Sources et calculs dans l'ordre du pipeline `all` (docs/04-traitement-donnees.md § 3). */
export const SOURCES = [
  'sources',
  'gares',
  'gtfs_sncf',
  'liaisons',
  'regles',
  'datatourisme',
  'osm',
  'lieux_culturels',
  'festivals',
  'rattachements',
  'transport_local',
  'lignes',
  'cyclable',
] as const;

export type Source = (typeof SOURCES)[number];

export type Commande =
  | { type: 'aide' }
  | { type: 'execution'; cibles: readonly Source[]; force: boolean; horsLigne: boolean }
  | { type: 'erreur'; message: string };

export const AIDE = `Traitement des données — tourisme-en-train

Utilisation : pnpm etl <source|all> [--force] [--hors-ligne]

  <source>       une source ou un calcul : ${SOURCES.join(', ')}
  all            tout le pipeline, dans l'ordre ci-dessus
  --force        retraite même si le fichier téléchargé n'a pas changé
  --hors-ligne   n'essaie pas de télécharger : utilise les fichiers de data/brut/
  --help         affiche cette aide

Code retour : 0 = succès ou ignoré ; autre = échec.
`;

function estSource(valeur: string): valeur is Source {
  return (SOURCES as readonly string[]).includes(valeur);
}

export function lireArguments(argv: readonly string[]): Commande {
  let lu;
  try {
    lu = parseArgs({
      args: [...argv],
      allowPositionals: true,
      options: {
        force: { type: 'boolean', default: false },
        'hors-ligne': { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
      },
    });
  } catch (erreur) {
    return { type: 'erreur', message: erreur instanceof Error ? erreur.message : String(erreur) };
  }

  if (lu.values.help) return { type: 'aide' };

  const [cible, ...enTrop] = lu.positionals;
  if (cible === undefined) return { type: 'erreur', message: 'Indiquez une source ou « all ».' };
  if (enTrop.length > 0) {
    return {
      type: 'erreur',
      message: `Une seule source à la fois (reçu : ${lu.positionals.join(', ')}).`,
    };
  }
  if (cible !== 'all' && !estSource(cible)) {
    return { type: 'erreur', message: `Source inconnue : « ${cible} ».` };
  }

  return {
    type: 'execution',
    cibles: cible === 'all' ? SOURCES : [cible],
    force: lu.values.force,
    horsLigne: lu.values['hors-ligne'],
  };
}
