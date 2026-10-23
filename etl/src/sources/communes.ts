// Commande `pnpm etl communes` (docs/04-traitement-donnees.md § 4.0, D038) : Code officiel
// géographique de l'INSEE (`02` § 2.1 bis) → table `commune`. À lancer avant `gares`.
import { trouverSource } from '@tourisme/commun';
import { z } from 'zod';
import { charger, lireCsv, type BilanLecture } from '../chargement/base';
import {
  CONTROLES,
  TABLE_TEMPORAIRE,
  fusionnerCommunes,
  type BilanFusion,
} from '../chargement/communes';
import { executerSource } from '../chargement/execution';
import type { Suivi } from '../chargement/rapport';
import { lireConfig, resoudreDossierDonnees } from '../config';
import { creerPool } from '../db';
import { estInchange, lireEmpreinteConnue, obtenirFichier } from './base';

const schemaCommune = z
  .object({
    /** COM commune · ARM arrondissement municipal · COMD commune déléguée · COMA commune associée. */
    TYPECOM: z.enum(['COM', 'ARM', 'COMD', 'COMA']),
    COM: z.string().regex(/^(\d{5}|2[AB]\d{3})$/),
    LIBELLE: z.string().min(1),
    /** Département : rempli pour COM et ARM, vide pour COMD et COMA (pris sur la commune parente). */
    DEP: z.string().regex(/^(\d{2,3}|2[AB])?$/),
    /** Commune de rattachement d'un ARM/COMD/COMA ; vide pour une COM. */
    COMPARENT: z.string(),
  })
  .refine((l) => l.TYPECOM !== 'COM' || l.DEP !== '', {
    path: ['DEP'],
    message: 'commune sans département',
  });

export type LigneCommune = z.infer<typeof schemaCommune>;

export interface Commune {
  nom: string;
  departement: string;
}

/**
 * Index « code INSEE → commune ». Un ARM, une COMD ou une COMA prend le nom et le département de
 * sa commune de rattachement (Paris 13ᵉ → Paris, 75). Une COM l'emporte toujours : 584 communes
 * déléguées partagent le code de leur commune (COG 2026).
 */
export function indexerCommunes(lignes: Iterable<LigneCommune>): Map<string, Commune> {
  const communes = new Map<string, Commune>();
  const rattachees: LigneCommune[] = [];
  for (const ligne of lignes) {
    if (ligne.TYPECOM === 'COM')
      communes.set(ligne.COM, { nom: ligne.LIBELLE, departement: ligne.DEP });
    else rattachees.push(ligne);
  }
  for (const { COM, COMPARENT } of rattachees) {
    const parent = communes.get(COMPARENT);
    if (!communes.has(COM) && parent) communes.set(COM, parent);
  }
  return communes;
}

/** Lit le fichier du COG (~37 500 lignes) et renvoie l'index, avec le bilan de lecture. */
export async function lireCommunes(
  chemin: string,
): Promise<{ communes: Map<string, Commune>; bilan: BilanLecture }> {
  const { lignes, bilan } = lireCsv(chemin, schemaCommune, { delimiteur: ',' });
  const toutes: LigneCommune[] = [];
  for await (const ligne of lignes) toutes.push(ligne);
  return { communes: indexerCommunes(toutes), bilan };
}

export async function traiterCommunes(options: {
  force: boolean;
  horsLigne: boolean;
}): Promise<void> {
  const config = lireConfig();
  const dossierDonnees = resoudreDossierDonnees(config.DOSSIER_DONNEES);
  const pool = creerPool(config.BDD_URL_ETL);
  try {
    await executerSource({ pool, dossierDonnees }, 'communes', (suivi) =>
      chargerCommunes(pool, dossierDonnees, options, suivi),
    );
  } finally {
    await pool.end();
  }
}

async function chargerCommunes(
  pool: ReturnType<typeof creerPool>,
  dossierDonnees: string,
  options: { force: boolean; horsLigne: boolean },
  suivi: Suivi,
): Promise<'SUCCES' | 'IGNORE'> {
  const cog = await obtenirFichier(trouverSource('communes'), {
    dossierDonnees,
    nomFichier: 'v_commune.csv',
    horsLigne: options.horsLigne,
  });
  suivi.fichier = { nom: 'v_commune.csv', ...cog };

  const client = await pool.connect();
  const connue = await lireEmpreinteConnue(client, 'communes').finally(() => client.release());
  if (estInchange(cog.empreinte, connue, options.force)) return 'IGNORE';

  // Le fichier entier est lu avant le chargement : une COMD peut précéder sa commune parente.
  const { communes, bilan } = await lireCommunes(cog.chemin);
  suivi.lecture = bilan;
  let fusion: BilanFusion = { chargees: 0, supprimees: 0, gardees: [] };

  const resultat = await charger(
    pool,
    {
      source: 'communes',
      tableTemporaire: TABLE_TEMPORAIRE,
      lignes: (async function* () {
        yield* communes.entries();
      })(),
      versValeurs: ([code, c]: [string, Commune]) => [code, c.nom, c.departement],
      controles: CONTROLES,
      fusionner: async (c) => {
        fusion = await fusionnerCommunes(c);
        return fusion.chargees;
      },
    },
    cog.empreinte,
  );

  suivi.chargees = resultat.chargees;
  suivi.controles = resultat.controles;
  if (fusion.supprimees > 0)
    suivi.remarques.push(`${fusion.supprimees} code(s) absent(s) du COG, supprimé(s)`);
  if (fusion.gardees.length > 0) {
    suivi.remarques.push(
      `${fusion.gardees.length} code(s) absent(s) du COG mais gardé(s), car référencé(s) : ${fusion.gardees.join(', ')}`,
    );
  }
  return 'SUCCES';
}
