// Commande `pnpm etl transport_local` (docs/04-traitement-donnees.md § 4.7, D046) : réseaux de
// config/sources.json (bus, tram, cars Mobigo, vélos) → arrêts à pied des gares de la région.
// Un réseau sans licence reconnue n'est pas chargé. `--hors-ligne` relit data/brut/<réseau>/.
import { stat } from 'node:fs/promises';
import { LICENCES_RESEAU, journal, reseaux } from '@tourisme/commun';
import { chargerTransportLocal, lireGbfs, lireGtfs } from '../chargement/transport-local';
import { executerSource } from '../chargement/execution';
import { lireConfig, resoudreDossierDonnees } from '../config';
import { creerPool } from '../db';
import type { ArretNormalise } from '../transformations/transport-local';
import { avecReessais, cheminFichierBrut, telecharger } from './base';

const nombre = (n: number): string => n.toLocaleString('fr-FR');
export const licenceReconnue = (licence: string): boolean =>
  (LICENCES_RESEAU as readonly string[]).includes(licence);

/** Chemin local du i-ème fichier d'un réseau, téléchargé sauf en mode hors ligne. */
async function fichierLocal(
  dossierDonnees: string,
  code: string,
  url: string,
  i: number,
  extension: string,
  horsLigne: boolean,
): Promise<string> {
  const chemin = cheminFichierBrut(dossierDonnees, code, `${i}.${extension}`);
  if (horsLigne) {
    if (!(await stat(chemin).catch(() => null))) {
      throw new Error(
        `Mode hors ligne : fichier absent (${chemin}). Lancez une fois sans --hors-ligne.`,
      );
    }
    return chemin;
  }
  await avecReessais(() => telecharger(url, chemin), {
    tentatives: 3,
    premiereAttenteMs: 5_000,
    signaler: (tentative) =>
      journal.info('Téléchargement, nouvelle tentative', { code, tentative }),
  });
  return chemin;
}

export async function traiterTransportLocal(options: { horsLigne: boolean }): Promise<void> {
  const config = lireConfig();
  const dossierDonnees = resoudreDossierDonnees(config.DOSSIER_DONNEES);
  const pool = creerPool(config.BDD_URL_ETL);
  try {
    await executerSource({ pool, dossierDonnees }, 'transport_local', async (suivi) => {
      const arrets = new Map<string, ArretNormalise[]>();
      for (const source of reseaux()) {
        if (!licenceReconnue(source.licence)) {
          suivi.remarques.push(
            `Non chargé, licence non reconnue (« ${source.licence} ») : ${source.nom}`,
          );
          continue;
        }
        const { format, fichiers, typeParDefaut } = source.reseau;
        const liste: ArretNormalise[] = [];
        for (const [i, url] of fichiers.entries()) {
          const chemin = await fichierLocal(
            dossierDonnees,
            source.code,
            url,
            i,
            format === 'gtfs' ? 'zip' : 'json',
            options.horsLigne,
          );
          liste.push(
            ...(format === 'gtfs' ? await lireGtfs(chemin, typeParDefaut) : await lireGbfs(chemin)),
          );
        }
        arrets.set(source.code, liste);
      }
      const bilan = await chargerTransportLocal(pool, arrets);
      suivi.chargees = bilan.lignes;
      suivi.controles = bilan.controles;
      suivi.remarques.push(
        `Couples arrêt-gare : ${nombre(bilan.lignes)}`,
        ...bilan.parReseau.map(
          (r) => `${r.source} : ${nombre(r.arrets)} arrêts ou stations, ${nombre(r.gares)} gares`,
        ),
      );
      return 'SUCCES';
    });
  } finally {
    await pool.end();
  }
}
