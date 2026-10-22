// Commande `pnpm etl gares` (docs/04-traitement-donnees.md § 4.1) : toutes les gares de France,
// `dans_region` pour la région pilote, nom de commune tiré du COG INSEE (source `communes`).
import { trouverSource } from '@tourisme/commun';
import { z } from 'zod';
import { charger, lireCsv } from '../chargement/base';
import { CONTROLES, TABLE_TEMPORAIRE, fusionnerGares, type BilanFusion } from '../chargement/gares';
import { executerSource } from '../chargement/execution';
import { taille, type Suivi } from '../chargement/rapport';
import { lireConfig, parametres, resoudreDossierDonnees } from '../config';
import { creerPool } from '../db';
import { departementDe, estDansRegion, lireCodesUic, lirePosition } from '../transformations/gares';
import { estInchange, lireEmpreinteConnue, obtenirFichier } from './base';
import { lireCommunes } from './communes';

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
      departement,
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
  const horsLigne = options.horsLigne;
  const gares = await obtenirFichier(trouverSource('gares'), {
    dossierDonnees,
    nomFichier: 'gares.csv',
    horsLigne,
  });
  suivi.fichier = { nom: 'gares.csv', ...gares };
  const cog = await obtenirFichier(trouverSource('communes'), {
    dossierDonnees,
    nomFichier: 'v_commune.csv',
    horsLigne,
  });
  suivi.remarques.push(
    `Communes : v_commune.csv, empreinte \`${cog.empreinte.slice(0, 12)}\`, ${taille(cog.taille)}`,
  );

  // Les deux fichiers comptent : une nouvelle année du COG change des noms de commune.
  const client = await pool.connect();
  const connues = await Promise.all([
    lireEmpreinteConnue(client, 'gares'),
    lireEmpreinteConnue(client, 'communes'),
  ]).finally(() => client.release());
  if (
    estInchange(gares.empreinte, connues[0], options.force) &&
    estInchange(cog.empreinte, connues[1], options.force)
  ) {
    return 'IGNORE';
  }

  const { communes, bilan: bilanCog } = await lireCommunes(cog.chemin);
  if (bilanCog.rejets.length > 0)
    suivi.remarques.push(`Communes : ${bilanCog.rejets.length} ligne(s) du COG écartée(s)`);

  const { lignes, bilan } = lireCsv(gares.chemin, schemaGare, { delimiteur: ';' });
  suivi.lecture = bilan;
  const sansCommune: string[] = [];
  let fusion: BilanFusion = { chargees: 0, supprimees: 0, gardees: [] };

  const resultat = await charger(
    pool,
    {
      source: 'gares',
      tableTemporaire: TABLE_TEMPORAIRE,
      lignes,
      versValeurs: (g: GareLue) => {
        const commune = communes.get(g.codeInsee) ?? null;
        if (commune === null)
          sansCommune.push(`${g.nom} (${g.codeInsee}${g.dansRegion ? ', RÉGION' : ''})`);
        return [
          g.uic,
          g.codesUic,
          g.nom,
          commune,
          g.codeInsee,
          g.departement,
          g.dansRegion,
          g.lon,
          g.lat,
        ];
      },
      controles: CONTROLES,
      fusionner: async (c) => {
        fusion = await fusionnerGares(c);
        await c.query(
          `UPDATE source_donnees SET empreinte = $1, date_telechargement = now(), nb_lignes = $2 WHERE code = 'communes'`,
          [cog.empreinte, communes.size],
        );
        return fusion.chargees;
      },
    },
    gares.empreinte,
  );

  suivi.chargees = resultat.chargees;
  suivi.controles = resultat.controles;
  if (sansCommune.length > 0) {
    suivi.remarques.push(
      `${sansCommune.length} gare(s) sans nom de commune (code absent du COG) : ${sansCommune.join(', ')}`,
    );
  }
  if (fusion.supprimees > 0)
    suivi.remarques.push(`${fusion.supprimees} gare(s) absente(s) du fichier, supprimée(s)`);
  if (fusion.gardees.length > 0) {
    suivi.remarques.push(
      `${fusion.gardees.length} gare(s) absente(s) du fichier mais gardée(s), car référencée(s) : ${fusion.gardees.join(', ')}`,
    );
  }
  return 'SUCCES';
}
