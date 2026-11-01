// Commande `pnpm etl contours` (docs/04-traitement-donnees.md § 4.0 bis, D041) : contours des
// communes de la région (`02` § 2.1 ter) → `commune.contour`. Après `communes`, avant les lieux.
import { readFile } from 'node:fs/promises';
import { trouverSource } from '@tourisme/commun';
import { charger } from '../chargement/base';
import {
  CONTROLES,
  fusionnerContours,
  schemaContours,
  TABLE_TEMPORAIRE,
} from '../chargement/contours';
import { executerSource } from '../chargement/execution';
import { lireConfig, resoudreDossierDonnees } from '../config';
import { creerPool } from '../db';
import { estInchange, lireEmpreinteConnue, obtenirFichier } from './base';

export async function traiterContours(options: {
  force: boolean;
  horsLigne: boolean;
}): Promise<void> {
  const config = lireConfig();
  const dossierDonnees = resoudreDossierDonnees(config.DOSSIER_DONNEES);
  const pool = creerPool(config.BDD_URL_ETL);
  try {
    await executerSource({ pool, dossierDonnees }, 'contours', async (suivi) => {
      const fichier = await obtenirFichier(trouverSource('contours'), {
        dossierDonnees,
        nomFichier: 'communes.geojson',
        horsLigne: options.horsLigne,
      });
      suivi.fichier = { nom: 'communes.geojson', ...fichier };

      const client = await pool.connect();
      const connue = await lireEmpreinteConnue(client, 'contours').finally(() => client.release());
      if (estInchange(fichier.empreinte, connue, options.force)) return 'IGNORE';

      // ≈ 24 Mo : lu d'un bloc (un GeoJSON ne se lit pas ligne à ligne).
      const { features } = schemaContours.parse(JSON.parse(await readFile(fichier.chemin, 'utf8')));
      suivi.lecture = { lues: features.length, rejets: [] };
      let retires = 0;
      const resultat = await charger(
        pool,
        {
          source: 'contours',
          tableTemporaire: TABLE_TEMPORAIRE,
          lignes: (async function* () {
            yield* features;
          })(),
          versValeurs: (f) => [f.properties.code, f.properties.nom, JSON.stringify(f.geometry)],
          controles: CONTROLES,
          fusionner: async (c) => {
            const bilan = await fusionnerContours(c);
            retires = bilan.retires;
            return bilan.chargees;
          },
        },
        fichier.empreinte,
      );
      suivi.chargees = resultat.chargees;
      suivi.controles = resultat.controles;
      if (retires > 0) suivi.remarques.push(`${retires} commune(s) ont perdu leur contour`);
      return 'SUCCES';
    });
  } finally {
    await pool.end();
  }
}
