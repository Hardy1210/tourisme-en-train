// Point d'entrée : pnpm etl <source|all> [--force] [--hors-ligne]
// (dans Docker : docker compose run --rm etl <source|all>). Code retour 0 = succès ou ignoré.
import { journal } from '@tourisme/commun';
import { AIDE, lireArguments, type Source } from './arguments';
import { lireConfig } from './config';

type Traitement = (options: { force: boolean; horsLigne: boolean }) => Promise<void>;

// Rempli au fil des étapes : E02 (sources, gares), E03 (gtfs_sncf), E04 (liaisons)…
const TRAITEMENTS: Partial<Record<Source, Traitement>> = {};

async function executer(argv: readonly string[]): Promise<number> {
  const commande = lireArguments(argv);

  if (commande.type === 'aide') {
    process.stdout.write(AIDE);
    return 0;
  }
  if (commande.type === 'erreur') {
    journal.erreur(commande.message, { aide: 'pnpm etl --help' });
    return 1;
  }

  lireConfig();
  for (const cible of commande.cibles) {
    const traitement = TRAITEMENTS[cible];
    if (!traitement) {
      // Un traitement absent est un échec : un succès silencieux tromperait la planification des SR.
      journal.erreur('Traitement pas encore disponible', { source: cible });
      return 1;
    }
    journal.info('Début du traitement', { source: cible });
    await traitement({ force: commande.force, horsLigne: commande.horsLigne });
    journal.info('Fin du traitement', { source: cible });
  }
  return 0;
}

try {
  process.exitCode = await executer(process.argv.slice(2));
} catch (erreur) {
  journal.erreur(erreur instanceof Error ? erreur.message : 'Erreur inattendue');
  process.exitCode = 1;
}
