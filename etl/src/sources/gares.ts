// Commande `pnpm etl gares` (docs/04-traitement-donnees.md § 4.1) : toutes les gares de France,
// `dans_region` pour la région pilote, reliées à `commune` par le code INSEE (D038 : `pnpm etl communes` avant).
import { trouverSource } from '@tourisme/commun';
import { z } from 'zod';
import { charger, lireCsv } from '../chargement/base';
import { CONTROLES, TABLE_TEMPORAIRE, fusionnerGares, type BilanFusion } from '../chargement/gares';
import { executerSource } from '../chargement/execution';
import type { Suivi } from '../chargement/rapport';
import { lireConfig, parametres, resoudreDossierDonnees } from '../config';
import { creerPool } from '../db';
import { departementDe, estDansRegion, lireCodesUic, lirePosition } from '../transformations/gares';
import { estInchange, lireEmpreinteConnue, obtenirFichier } from './base';

/** Une ligne du fichier SNCF, validée et transformée (colonnes réelles : `02` § 2.1). */
export const schemaGare = z
  .object({
    nom: z.string().trim().min(1),
    position_geographique: z.string(),
    codeinsee: z.string(),
    codes_uic: z.string(),
  })
  .transform((ligne, ctx) => {
    const codes = lireCodesUic(ligne.codes_uic);
    const position = lirePosition(ligne.position_geographique);
    const departement = departementDe(ligne.codeinsee);
    if (!codes)
      ctx.addIssue({
        code: 'custom',
        path: ['codes_uic'],
        message: 'aucun code UIC français valide',
      });
    if (!position)
      ctx.addIssue({
        code: 'custom',
        path: ['position_geographique'],
        message: 'position illisible',
      });
    if (!departement)
      ctx.addIssue({ code: 'custom', path: ['codeinsee'], message: 'code INSEE invalide' });
    if (!codes || !position || !departement) return z.NEVER;
    return {
      ...codes,
      nom: ligne.nom,
      codeInsee: ligne.codeinsee,
      dansRegion: estDansRegion(departement, parametres.region.departements),
      ...position,
    };
  });

export type GareLue = z.output<typeof schemaGare>;

export async function traiterGares(options: { force: boolean; horsLigne: boolean }): Promise<void> {
  const config = lireConfig();
  const dossierDonnees = resoudreDossierDonnees(config.DOSSIER_DONNEES);
  const pool = creerPool(config.BDD_URL_ETL);
  try {
    await executerSource({ pool, dossierDonnees }, 'gares', (suivi) =>
      chargerGares(pool, dossierDonnees, options, suivi),
    );
  } finally {
    await pool.end();
  }
}

async function chargerGares(
  pool: ReturnType<typeof creerPool>,
  dossierDonnees: string,
  options: { force: boolean; horsLigne: boolean },
  suivi: Suivi,
): Promise<'SUCCES' | 'IGNORE'> {
  const gares = await obtenirFichier(trouverSource('gares'), {
    dossierDonnees,
    nomFichier: 'gares.csv',
    horsLigne: options.horsLigne,
  });
  suivi.fichier = { nom: 'gares.csv', ...gares };

  const client = await pool.connect();
  const connue = await lireEmpreinteConnue(client, 'gares').finally(() => client.release());
  if (estInchange(gares.empreinte, connue, options.force)) return 'IGNORE';

  const { lignes, bilan } = lireCsv(gares.chemin, schemaGare, { delimiteur: ';' });
  suivi.lecture = bilan;
  let fusion: BilanFusion = {
    chargees: 0,
    ajoutees: 0,
    supprimees: 0,
    gardees: [],
    sansCommune: [],
  };

  const resultat = await charger(
    pool,
    {
      source: 'gares',
      tableTemporaire: TABLE_TEMPORAIRE,
      lignes,
      versValeurs: (g: GareLue) => [
        g.uic,
        g.codesUic,
        g.nom,
        g.codeInsee,
        g.dansRegion,
        g.lon,
        g.lat,
      ],
      controles: CONTROLES,
      fusionner: async (c) => {
        fusion = await fusionnerGares(c);
        return fusion.chargees;
      },
    },
    gares.empreinte,
  );

  suivi.chargees = resultat.chargees;
  suivi.controles = resultat.controles;
  if (fusion.sansCommune.length > 0) {
    suivi.remarques.push(
      `${fusion.sansCommune.length} gare(s) sans commune (code absent de la table commune) : ${fusion.sansCommune.join(', ')}`,
    );
  }
  if (fusion.ajoutees > 0) suivi.remarques.push(`${fusion.ajoutees} gare(s) nouvelle(s)`);
  if (fusion.supprimees > 0)
    suivi.remarques.push(`${fusion.supprimees} gare(s) absente(s) du fichier, supprimée(s)`);
  if (fusion.gardees.length > 0) {
    suivi.remarques.push(
      `${fusion.gardees.length} gare(s) absente(s) du fichier mais gardée(s), car référencée(s) : ${fusion.gardees.join(', ')}`,
    );
  }
  return 'SUCCES';
}
