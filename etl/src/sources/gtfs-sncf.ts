// Commande `pnpm etl gtfs_sncf` (docs/04-traitement-donnees.md § 4.2, D036) : horaires SNCF des
// trains qui touchent la région, sur la fenêtre [aujourd'hui à Paris, + fenetreJoursHoraires].
import { dateDuJour, trouverSource } from '@tourisme/commun';
import type pg from 'pg';
import { executerSource } from '../chargement/execution';
import { chargerGtfs } from '../chargement/gtfs';
import { depuisZip } from '../chargement/gtfs-brut';
import type { Suivi } from '../chargement/rapport';
import { lireConfig, parametres, resoudreDossierDonnees } from '../config';
import { creerPool } from '../db';
import { estInchange, obtenirFichier } from './base';

/**
 * La fenêtre avance chaque jour : un fichier inchangé doit quand même être rechargé le lendemain.
 * `IGNORE` seulement si même empreinte ET déjà chargé aujourd'hui (à Paris) ; `--force` recharge.
 */
export function estAJour(etat: {
  empreinte: string;
  empreinteConnue: string | null;
  dateDernierChargement: string | null;
  dateDuJour: string;
  force: boolean;
}): boolean {
  return (
    estInchange(etat.empreinte, etat.empreinteConnue, etat.force) &&
    etat.dateDernierChargement === etat.dateDuJour
  );
}

async function lireDernierChargement(
  pool: pg.Pool,
): Promise<{ empreinte: string | null; date: string | null }> {
  const { rows } = await pool.query<{ empreinte: string | null; date: string | null }>(
    `SELECT empreinte, to_char(date_telechargement AT TIME ZONE $1, 'YYYY-MM-DD') AS date
     FROM source_donnees WHERE code = 'gtfs_sncf'`,
    [parametres.fuseau],
  );
  const ligne = rows[0];
  if (!ligne)
    throw new Error('Source « gtfs_sncf » absente de source_donnees : lancez pnpm etl sources');
  return ligne;
}

async function chargerHoraires(
  pool: pg.Pool,
  dossierDonnees: string,
  options: { force: boolean; horsLigne: boolean },
  suivi: Suivi,
): Promise<'SUCCES' | 'IGNORE'> {
  const fichier = await obtenirFichier(trouverSource('gtfs_sncf'), {
    dossierDonnees,
    nomFichier: 'gtfs.zip',
    horsLigne: options.horsLigne,
  });
  suivi.fichier = { nom: 'gtfs.zip', ...fichier };

  const aujourdhui = dateDuJour();
  const dernier = await lireDernierChargement(pool);
  const etat = {
    empreinte: fichier.empreinte,
    empreinteConnue: dernier.empreinte,
    dateDernierChargement: dernier.date,
    dateDuJour: aujourdhui,
    force: options.force,
  };
  if (estAJour(etat)) return 'IGNORE';

  const fenetre = { debut: aujourdhui, jours: parametres.fenetreJoursHoraires };
  const bilan = await chargerGtfs(pool, depuisZip(fichier.chemin), fenetre, fichier.empreinte);

  suivi.chargees = bilan.passages;
  suivi.controles = bilan.controles;
  const brut = Object.entries(bilan.lignesBrutes)
    .map(([nom, n]) => `${nom} ${n === null ? 'absent' : n.toLocaleString('fr-FR')}`)
    .join(' · ');
  suivi.remarques.push(
    `Lignes lues : ${brut}`,
    `Chargé : ${bilan.trajets.toLocaleString('fr-FR')} trajets, ` +
      `${bilan.passages.toLocaleString('fr-FR')} passages, ` +
      `${bilan.joursService.toLocaleString('fr-FR')} jours de circulation`,
    ...bilan.constats,
  );
  return 'SUCCES';
}

export async function traiterGtfsSncf(options: {
  force: boolean;
  horsLigne: boolean;
}): Promise<void> {
  const config = lireConfig();
  const dossierDonnees = resoudreDossierDonnees(config.DOSSIER_DONNEES);
  const pool = creerPool(config.BDD_URL_ETL);
  try {
    await executerSource({ pool, dossierDonnees }, 'gtfs_sncf', (suivi) =>
      chargerHoraires(pool, dossierDonnees, options, suivi),
    );
  } finally {
    await pool.end();
  }
}
