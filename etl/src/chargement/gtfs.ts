// Chargement du GTFS SNCF (docs/04-traitement-donnees.md § 4.2) dans UNE transaction :
// fichiers bruts → transformations SQL (transformations/gtfs.sql) → contrôles → remplacement de
// `trajet`, `passage`, `service_jour` → constats. Un contrôle bloquant en échec annule tout.
import type pg from 'pg';
import { ErreurControles, echecsBloquants, executerControles } from '../controles/base';
import type { ResultatControle } from '../controles/base';
import { enTransaction } from '../db';
import { parametresSql } from '../regles/types-train';
import { lireSections, preparer } from '../transformations/sql';
import { chargerGtfsBrut, type OuvrirFichier } from './gtfs-brut';
import { constatsGtfs, controlesGtfs, type Fenetre } from './gtfs-controles';

const PREPARATION = [
  'fonction_secondes',
  'gare_uic',
  'passage',
  'index_passage',
  'service_jour',
  'index_service_jour',
  'trajet',
  'trajet_retenu',
  'index_trajet_retenu',
  'analyser',
] as const;

const REMPLACEMENT = [
  'vider',
  'vider_service_jour',
  'inserer_trajet',
  'inserer_passage',
  'inserer_service_jour',
] as const;

export interface BilanGtfs {
  lignesBrutes: Record<string, number | null>;
  trajets: number;
  passages: number;
  joursService: number;
  controles: ResultatControle[];
  constats: string[];
}

type Valeurs = Record<string, unknown>;

async function valeursSql(
  fenetre: Fenetre,
): Promise<{ sections: Map<string, string>; valeurs: Valeurs }> {
  const modes = parametresSql();
  return {
    sections: await lireSections(new URL('../transformations/gtfs.sql', import.meta.url)),
    valeurs: {
      debut: fenetre.debut,
      jours: fenetre.jours,
      modes_ter: modes.modesTer,
      modes_tgv: modes.modesTgv,
      modes_intercites: modes.modesIntercites,
      modes_exclus: modes.modesExclus,
    },
  };
}

/**
 * Fichiers bruts puis tables temporaires de préparation (`tmp_passage`, `tmp_service_jour`,
 * `tmp_trajet_retenu`…), sans rien modifier en base. Renvoie de quoi exécuter les sections suivantes.
 */
export async function preparerGtfs(
  client: pg.PoolClient,
  ouvrir: OuvrirFichier,
  fenetre: Fenetre,
): Promise<{
  lignesBrutes: Record<string, number | null>;
  executer: (nom: string) => Promise<number>;
}> {
  const { sections, valeurs } = await valeursSql(fenetre);
  async function executer(nom: string): Promise<number> {
    const sql = sections.get(nom);
    if (sql === undefined) throw new Error(`Section « ${nom} » absente de gtfs.sql`);
    const { texte, valeurs: liste } = preparer(sql, valeurs);
    return (await client.query(texte, liste)).rowCount ?? 0;
  }
  const lignesBrutes = await chargerGtfsBrut(client, ouvrir);
  for (const nom of PREPARATION) await executer(nom);
  return { lignesBrutes, executer };
}

/**
 * Tout le chargement, dans la transaction de `client`. `empreinte` : enregistrée dans
 * `source_donnees` (code `gtfs_sncf`) avec la date du chargement ; null dans les tests.
 */
export async function chargerGtfsDans(
  client: pg.PoolClient,
  ouvrir: OuvrirFichier,
  fenetre: Fenetre,
  empreinte: string | null,
): Promise<BilanGtfs> {
  const { lignesBrutes, executer } = await preparerGtfs(client, ouvrir, fenetre);

  const controles = await executerControles(client, controlesGtfs(fenetre));
  if (echecsBloquants(controles).length > 0) throw new ErreurControles(controles);

  const lignes: Record<string, number> = {};
  for (const nom of REMPLACEMENT) lignes[nom] = await executer(nom);
  const constats = await constatsGtfs(client, fenetre);

  if (empreinte !== null) {
    await client.query(
      `UPDATE source_donnees SET empreinte = $1, date_telechargement = now(), nb_lignes = $2
       WHERE code = 'gtfs_sncf'`,
      [empreinte, lignes.inserer_passage],
    );
  }
  return {
    lignesBrutes,
    trajets: lignes.inserer_trajet ?? 0,
    passages: lignes.inserer_passage ?? 0,
    joursService: lignes.inserer_service_jour ?? 0,
    controles,
    constats,
  };
}

/** Chargement dans sa propre transaction : un contrôle bloquant en échec annule tout. */
export function chargerGtfs(
  pool: pg.Pool,
  ouvrir: OuvrirFichier,
  fenetre: Fenetre,
  empreinte: string | null,
): Promise<BilanGtfs> {
  return enTransaction(pool, (client) => chargerGtfsDans(client, ouvrir, fenetre, empreinte));
}
