// Commande `pnpm etl datatourisme` (docs/02-sources-donnees.md § 2.3, D041) : CSV régional
// DATAtourisme, lu en flux → lieux classés de la région. Après `regles` et `contours`.
import { trouverSource } from '@tourisme/commun';
import { z } from 'zod';
import { lireCsv } from '../chargement/base';
import { executerSource } from '../chargement/execution';
import { lireConfig, resoudreDossierDonnees } from '../config';
import { creerPool } from '../db';
import { lireLigneDatatourisme } from '../transformations/datatourisme';
import { obtenirFichier } from './base';
import { chargerLieux } from './lieux';

const texte = z.string().default('');

export const schemaLigneDatatourisme = z.object({
  Nom_du_POI: texte,
  Categories_de_POI: z.string().min(1),
  Latitude: z.coerce.number().min(-90).max(90),
  Longitude: z.coerce.number().min(-180).max(180),
  Adresse_postale: texte,
  Contacts_du_POI: texte,
  Classements_du_POI: texte,
  Description: texte,
  URI_ID_du_POI: z.url(),
});

export async function traiterDatatourisme(options: {
  force: boolean;
  horsLigne: boolean;
}): Promise<void> {
  const config = lireConfig();
  const dossierDonnees = resoudreDossierDonnees(config.DOSSIER_DONNEES);
  const pool = creerPool(config.BDD_URL_ETL);
  try {
    await executerSource({ pool, dossierDonnees }, 'datatourisme', async (suivi) => {
      const fichier = await obtenirFichier(trouverSource('datatourisme'), {
        dossierDonnees,
        nomFichier: 'datatourisme-region.csv',
        horsLigne: options.horsLigne,
      });
      suivi.fichier = { nom: 'datatourisme-region.csv', ...fichier };
      return chargerLieux({
        pool,
        dossierDonnees,
        source: 'datatourisme',
        fichier,
        force: options.force,
        suivi,
        async *lire(index, descriptionMax) {
          const { lignes, bilan } = lireCsv(fichier.chemin, schemaLigneDatatourisme, {
            delimiteur: ',',
          });
          suivi.lecture = bilan;
          for await (const ligne of lignes)
            yield lireLigneDatatourisme(ligne, index, descriptionMax);
        },
      });
    });
  } finally {
    await pool.end();
  }
}
