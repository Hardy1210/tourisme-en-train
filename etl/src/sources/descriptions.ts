// Commande `pnpm etl descriptions` (docs/04-traitement-donnees.md § 4.4 bis, D105) : la description longue en
// français de nos fiches DATAtourisme, lue dans l'export national que `pnpm etl photos` vient de télécharger
// (cette étape ne télécharge rien). Une fiche ne change que si la description de l'export est plus longue.
// Réponse gardée dans data/brut/ : relue tant que l'export n'a pas changé ; `--hors-ligne` rejoue sans réseau.
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { journal } from '@tourisme/commun';
import { lireDescriptionsActuelles, mettreAJourDescriptions } from '../chargement/descriptions';
import { executerSource } from '../chargement/execution';
import { lireConfig, parametres, resoudreDossierDonnees } from '../config';
import { auMoins, echecsBloquants, ErreurControles, executerControles } from '../controles/base';
import { creerPool, enTransaction } from '../db';
import {
  descriptionRetenue,
  lireDescriptionsDatatourisme,
} from '../transformations/datatourisme-descriptions';
import { entitesInconnues, nettoyerDescription } from '../transformations/description';
import { cheminFichierBrut, empreinteFichier } from './base';
import { listerZip, ouvrirDansZip } from './zip';

/** Même export que les photos (D100, D101) : même dossier de data/brut/. */
const SOURCE_EXPORT = 'datatourisme_photos';
const FICHIER_EXPORT = 'datatourisme.nt.zip';
const FICHIER_GARDE = 'descriptions.json';

interface Gardees {
  empreinte: string;
  descriptions: Record<string, string>;
}

/** Fiche → description longue brute en français, depuis la réponse gardée ou l'export. */
async function descriptionsDeLExport(
  dossier: string,
  fiches: ReadonlySet<string>,
  force: boolean,
): Promise<Map<string, string>> {
  const cheminZip = cheminFichierBrut(dossier, SOURCE_EXPORT, FICHIER_EXPORT);
  const cheminGarde = cheminFichierBrut(dossier, SOURCE_EXPORT, FICHIER_GARDE);
  const texte = await readFile(cheminGarde, 'utf8').catch(() => null);
  const gardees = texte === null ? null : (JSON.parse(texte) as Gardees);
  const nos = (d: Record<string, string>) =>
    new Map(Object.entries(d).filter(([fiche]) => fiches.has(fiche)));

  if ((await stat(cheminZip).catch(() => null)) === null) {
    if (!gardees) {
      throw new Error(
        `Export DATAtourisme absent (${cheminZip}) et aucune réponse gardée : lancer d'abord « pnpm etl photos ».`,
      );
    }
    journal.info('Export DATAtourisme absent : descriptions gardées réutilisées');
    return nos(gardees.descriptions);
  }
  const empreinte = await empreinteFichier(cheminZip);
  if (gardees?.empreinte === empreinte && !force) {
    journal.info('Export DATAtourisme inchangé : descriptions gardées réutilisées');
    return nos(gardees.descriptions);
  }
  const entree = (await listerZip(cheminZip)).find((nom) => nom.endsWith('.nt'));
  if (!entree) throw new Error(`Aucun fichier .nt dans ${cheminZip}`);
  const ouvrir = async function* (): AsyncGenerator<string> {
    const flux = await ouvrirDansZip(cheminZip, entree);
    if (!flux) throw new Error(`${entree} illisible dans ${cheminZip}`);
    yield* createInterface({ input: flux, crlfDelay: Infinity });
  };
  const descriptions = await lireDescriptionsDatatourisme(ouvrir, fiches);
  await mkdir(path.dirname(cheminGarde), { recursive: true });
  await writeFile(
    cheminGarde,
    JSON.stringify({ empreinte, descriptions: Object.fromEntries(descriptions) } satisfies Gardees),
  );
  return descriptions;
}

const champ = (texte: string) => `"${texte.replaceAll('"', '""')}"`;

export async function traiterDescriptions(options: {
  force: boolean;
  horsLigne: boolean;
}): Promise<void> {
  const config = lireConfig();
  const dossier = resoudreDossierDonnees(config.DOSSIER_DONNEES);
  const pool = creerPool(config.BDD_URL_ETL);
  const max = parametres.lieux.descriptionMaxCaracteres;
  try {
    await executerSource({ pool, dossierDonnees: dossier }, 'descriptions', async (suivi) => {
      const lieux = await lireDescriptionsActuelles(pool, 'datatourisme');
      const exportees = await descriptionsDeLExport(
        dossier,
        new Set(lieux.map((l) => l.idSource)),
        options.force,
      );

      const changements: { id: number; description: string }[] = [];
      const lignesRapport = ['cle;nom;longueur_avant;longueur_apres;coupee'];
      const compte = { nouvelles: 0, allongees: 0, coupees: 0, inchangees: 0, sansExport: 0 };
      const inconnues = new Map<string, number>();
      for (const lieu of lieux) {
        const brute = exportees.get(lieu.idSource) ?? null;
        if (brute === null) {
          compte.sansExport++;
          continue;
        }
        for (const e of entitesInconnues(brute)) inconnues.set(e, (inconnues.get(e) ?? 0) + 1);
        const retenue = descriptionRetenue(lieu.description, brute, max);
        if (retenue === null || retenue === lieu.description) {
          compte.inchangees++;
          continue;
        }
        const coupee = (nettoyerDescription(brute, Number.POSITIVE_INFINITY)?.length ?? 0) > max;
        if (coupee) compte.coupees++;
        if (lieu.description === null) compte.nouvelles++;
        else compte.allongees++;
        changements.push({ id: lieu.id, description: retenue });
        lignesRapport.push(
          [lieu.cle, champ(lieu.nom), lieu.description?.length ?? 0, retenue.length, coupee].join(
            ';',
          ),
        );
      }

      const { chargees, controles } = await enTransaction(pool, async (client) => {
        const n = await mettreAJourDescriptions(client, changements);
        const resultats = await executerControles(client, [
          auMoins(
            `au moins ${parametres.controles.descriptionsMin} lieux DATAtourisme avec une description`,
            "SELECT count(*)::int AS n FROM lieu WHERE source = 'datatourisme' AND description IS NOT NULL",
            parametres.controles.descriptionsMin,
          ),
        ]);
        if (echecsBloquants(resultats).length > 0) throw new ErreurControles(resultats);
        return { chargees: n, controles: resultats };
      });
      suivi.chargees = chargees;
      suivi.controles = controles;

      const rapport = path.join(dossier, 'traite', 'rapports', 'descriptions_remplacees.csv');
      await mkdir(path.dirname(rapport), { recursive: true });
      await writeFile(rapport, lignesRapport.join('\n') + '\n');
      suivi.remarques.push(
        `Fiches DATAtourisme : ${lieux.length} ; avec une description longue en français : ${exportees.size}`,
        `Remplacées : ${chargees} (nouvelles ${compte.nouvelles}, plus longues ${compte.allongees}, dont coupées à ${max} caractères ${compte.coupees}) ; inchangées ${compte.inchangees} ; sans description dans l'export ${compte.sansExport}`,
        `Entités HTML inconnues, laissées telles quelles : ${
          inconnues.size === 0
            ? 'aucune'
            : [...inconnues]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([e, n]) => `${e} ${n}`)
                .join(', ')
        }`,
        `Fiches à relire : ${path.relative(dossier, rapport)}`,
      );
      return 'SUCCES';
    });
  } finally {
    await pool.end();
  }
}
