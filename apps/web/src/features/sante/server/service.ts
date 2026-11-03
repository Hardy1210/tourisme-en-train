// État de l'application et des données (docs/05-api.md § 3.1, docs/07-contrat-infra.md).
import 'server-only';
import { dateDuJour } from '@tourisme/commun';

import { journal } from '@/lib/journal';

import paquet from '../../../../package.json' with { type: 'json' };
import type { Sante } from '../schemas';

import { dernierChargementHoraires } from './requetes';

export async function etatSante(): Promise<Sante> {
  let fin: Date | null;
  try {
    fin = await dernierChargementHoraires();
  } catch (erreur) {
    journal.erreur('Santé : base inaccessible', {
      erreur: erreur instanceof Error ? erreur.message : String(erreur),
    });
    return { statut: 'degrade', base: 'erreur', dateDonnees: null, version: paquet.version };
  }
  // Date du chargement à Paris (un chargement à 0 h 30 heure de Paris est encore la veille en UTC).
  const dateDonnees = fin === null ? null : dateDuJour(fin);
  return {
    statut: dateDonnees === null ? 'degrade' : 'ok',
    base: 'ok',
    dateDonnees,
    version: paquet.version,
  };
}
