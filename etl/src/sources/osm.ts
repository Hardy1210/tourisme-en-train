// Commande `pnpm etl osm` (docs/02-sources-donnees.md § 2.4, D041) : une requête Overpass par règle
// OSM de `categories.csv`, réunies dans `overpass.json` → lieux classés de la région.
// Après `regles` et `contours`.
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { journal, trouverSource } from '@tourisme/commun';
import type { Rejet } from '../chargement/base';
import { executerSource } from '../chargement/execution';
import { lireRegles } from '../chargement/regles';
import { lireConfig, parametres, resoudreDossierDonnees } from '../config';
import { creerPool } from '../db';
import {
  lireElementOsm,
  requetesOverpass,
  schemaElementOsm,
  schemaReponseOverpass,
} from '../transformations/osm';
import {
  avecReessais,
  cheminFichierBrut,
  empreinteFichier,
  obtenirFichier,
  telecharger,
  type FichierBrut,
} from './base';
import { chargerLieux } from './lieux';

/**
 * Délai d'une requête côté serveur (secondes). Sous les 300 s pendant lesquelles Node attend le début
 * d'une réponse : au-delà, Overpass répond par une erreur lisible plutôt que la connexion coupée.
 */
const DELAI_OVERPASS_S = 180;
/** Serveur saturé ou requête interrompue : 6 tentatives, attentes de 30 s à 8 min. */
const REESSAIS = { tentatives: 6, premiereAttenteMs: 30_000 };

/** Réponse interrompue par le serveur (délai, mémoire) : à refaire, jamais à charger telle quelle. */
class ReponseIncomplete extends Error {}

/** Télécharge chaque requête (avec nouvelles tentatives), puis réunit les éléments sans doublon. */
async function telechargerOsm(
  dossierDonnees: string,
  requetes: readonly { filtre: string; requete: string }[],
): Promise<FichierBrut> {
  const url = trouverSource('osm').telechargement;
  if (!url) throw new Error('Adresse de téléchargement absente de config/sources.json (osm)');
  const chemin = cheminFichierBrut(dossierDonnees, 'osm', 'overpass.json');
  const dossierParties = path.join(path.dirname(chemin), 'parties');
  await mkdir(dossierParties, { recursive: true });

  const elements = new Map<string, unknown>();
  for (const [i, { filtre, requete }] of requetes.entries()) {
    const partie = path.join(dossierParties, `${i}.json`);
    const lus = await avecReessais(
      async () => {
        await telecharger(url, partie, {
          method: 'POST',
          body: new URLSearchParams({ data: requete }),
          // Règles d'usage d'Overpass : nommer l'outil et donner un moyen de joindre ses auteurs.
          headers: {
            'User-Agent':
              'tourisme-en-train (ETL, défi data.gouv.fr ; https://github.com/Hardy1210/tourisme-en-train)',
          },
          signal: AbortSignal.timeout((DELAI_OVERPASS_S + 60) * 1000),
        });
        const reponse = schemaReponseOverpass.parse(JSON.parse(await readFile(partie, 'utf8')));
        if (reponse.remark) throw new ReponseIncomplete(`${filtre} : ${reponse.remark}`);
        return reponse.elements;
      },
      {
        ...REESSAIS,
        passagere: (erreur) => erreur instanceof ReponseIncomplete,
        signaler: (tentative, attenteMs) =>
          journal.info('Overpass saturé, nouvelle tentative', {
            filtre,
            tentative,
            attenteS: attenteMs / 1000,
          }),
      },
    );
    for (const brut of lus) {
      const element = schemaElementOsm.safeParse(brut);
      elements.set(
        element.success ? `${element.data.type}/${element.data.id}` : `?${i}/${elements.size}`,
        brut,
      );
    }
    journal.info('Requête Overpass', {
      filtre,
      elements: lus.length,
      partie: `${i + 1}/${requetes.length}`,
    });
  }

  await writeFile(chemin, JSON.stringify({ elements: [...elements.values()] }));
  await rm(dossierParties, { recursive: true, force: true });
  const { size } = await stat(chemin);
  return { chemin, empreinte: await empreinteFichier(chemin), taille: size, telecharge: true };
}

export async function traiterOsm(options: { force: boolean; horsLigne: boolean }): Promise<void> {
  const config = lireConfig();
  const dossierDonnees = resoudreDossierDonnees(config.DOSSIER_DONNEES);
  const pool = creerPool(config.BDD_URL_ETL);
  try {
    await executerSource({ pool, dossierDonnees }, 'osm', async (suivi) => {
      const client = await pool.connect();
      const regles = await lireRegles(client, 'osm').finally(() => client.release());
      const fichier = options.horsLigne
        ? await obtenirFichier(trouverSource('osm'), {
            dossierDonnees,
            nomFichier: 'overpass.json',
            horsLigne: true,
          })
        : await telechargerOsm(
            dossierDonnees,
            requetesOverpass(regles, parametres.region.codeInsee, DELAI_OVERPASS_S),
          );
      suivi.fichier = { nom: 'overpass.json', ...fichier };
      return chargerLieux({
        pool,
        dossierDonnees,
        source: 'osm',
        fichier,
        force: options.force,
        suivi,
        async *lire(index, descriptionMax) {
          const { elements } = schemaReponseOverpass.parse(
            JSON.parse(await readFile(fichier.chemin, 'utf8')),
          );
          const rejets: Rejet[] = [];
          suivi.lecture = { lues: elements.length, rejets };
          for (const [i, brut] of elements.entries()) {
            const element = schemaElementOsm.safeParse(brut);
            if (element.success) yield lireElementOsm(element.data, index, descriptionMax);
            else rejets.push({ ligne: i + 1, raison: 'élément Overpass illisible' });
          }
        },
      });
    });
  } finally {
    await pool.end();
  }
}
