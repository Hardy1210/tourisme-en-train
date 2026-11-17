// Commande `pnpm etl photos` (docs/04-traitement-donnees.md § 4.6 bis, D100, D101) : une photo par lieu,
// Wikimedia d'abord (fichier OSM, image de l'article Wikipédia, image Wikidata), DATAtourisme sinon.
// Après `rattachements` : la photo d'un doublon sert au lieu qu'il double. Réponses de Wikimedia et photos
// DATAtourisme gardées dans data/brut/ : `--hors-ligne` rejoue sans réseau (données figées, E16).
import { createInterface } from 'node:readline';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { dateDuJour, journal, trouverSource } from '@tourisme/commun';
import { executerSource } from '../chargement/execution';
import { chargerPhotosDans, lireLieuxPourPhotos, type PhotoACharger } from '../chargement/photos';
import { lirePhotosExclues } from '../chargement/photos-exclues';
import { lireConfig, parametres, resoudreDossierDonnees } from '../config';
import { auMoins, echecsBloquants, ErreurControles, executerControles } from '../controles/base';
import { creerPool, enTransaction } from '../db';
import { lireMediasDatatourisme } from '../transformations/datatourisme-photos';
import {
  choisirPhoto,
  fichierCommons,
  LIBELLES_ECART_PHOTO,
  titreWikipediaFr,
  type Candidat,
  type MediaDatatourisme,
  type MetaCommons,
  type RaisonEcartPhoto,
} from '../transformations/photos';
import { cheminFichierBrut, empreinteFichier, telechargerAvecReprise } from './base';
import {
  chercherImagesPages,
  chercherMetasCommons,
  chercherP18,
  creerClientWikimedia,
  userAgentWikimedia,
} from './wikimedia';
import { listerZip, ouvrirDansZip } from './zip';

const SOURCE_DT = 'datatourisme_photos';
const FICHIER_DT = 'datatourisme.nt.zip';

interface ReponsesWikimedia {
  p18: Record<string, string>;
  pages: Record<string, string>;
  commons: Record<string, MetaCommons>;
}

async function lireJson<T>(chemin: string): Promise<T | null> {
  const texte = await readFile(chemin, 'utf8').catch(() => null);
  return texte === null ? null : (JSON.parse(texte) as T);
}

async function ecrireJson(chemin: string, valeur: unknown): Promise<void> {
  await mkdir(path.dirname(chemin), { recursive: true });
  await writeFile(chemin, JSON.stringify(valeur));
}

/** Interroge Wikimedia (ou relit les réponses gardées en `--hors-ligne`). */
async function reponsesWikimedia(
  dossier: string,
  demandes: { qids: string[]; titres: string[]; fichiersOsm: string[] },
  horsLigne: boolean,
  contact: string | undefined,
): Promise<ReponsesWikimedia> {
  const chemin = cheminFichierBrut(dossier, 'wikimedia', 'reponses.json');
  if (horsLigne) {
    const gardees = await lireJson<ReponsesWikimedia>(chemin);
    if (!gardees)
      throw new Error(`Mode hors ligne : ${chemin} absent. Lancez une fois sans --hors-ligne.`);
    return gardees;
  }
  if (!contact) {
    throw new Error(
      "URL_CONTACT manquante : l'adresse du site, envoyée à Wikimedia dans le User-Agent (voir .env.example).",
    );
  }
  const { api: reglesApi, largeurPetitePx, largeurGrandePx } = parametres.photos;
  const appeler = creerClientWikimedia({
    userAgent: userAgentWikimedia(contact),
    pauseMs: reglesApi.pauseMs,
    tentatives: reglesApi.tentatives,
  });
  const apiDe = (code: string) => {
    const api = trouverSource(code).api;
    if (!api) throw new Error(`Adresse d'API absente de config/sources.json (${code})`);
    return api;
  };
  const p18 = await chercherP18(appeler, apiDe('wikidata'), demandes.qids, reglesApi.taillePaquet);
  journal.info('Wikidata lu', { fiches: demandes.qids.length, avecImage: p18.size });
  const pages = await chercherImagesPages(
    appeler,
    apiDe('wikipedia'),
    demandes.titres,
    reglesApi.taillePaquet,
  );
  journal.info('Wikipédia lu', { articles: demandes.titres.length, avecImage: pages.size });
  const fichiers = [...new Set([...demandes.fichiersOsm, ...pages.values(), ...p18.values()])];
  const commons = await chercherMetasCommons(appeler, apiDe('wikimedia_commons'), fichiers, {
    taille: reglesApi.taillePaquet,
    largeurPetitePx,
    largeurGrandePx,
  });
  journal.info('Commons lu', { fichiers: fichiers.length, trouves: commons.size });
  const reponses: ReponsesWikimedia = {
    p18: Object.fromEntries(p18),
    pages: Object.fromEntries(pages),
    commons: Object.fromEntries(commons),
  };
  await ecrireJson(chemin, reponses);
  return reponses;
}

/**
 * Photos DATAtourisme de nos fiches : l'export national est lu seulement s'il a changé (empreinte), sinon
 * les photos gardées dans data/brut/ servent. Sans l'export (1,9 Go) en `--hors-ligne`, elles suffisent.
 */
async function mediasDatatourisme(
  dossier: string,
  fiches: ReadonlySet<string>,
  options: { horsLigne: boolean; force: boolean },
): Promise<Map<string, MediaDatatourisme[]>> {
  const { horsLigne } = options;
  const cheminGardees = cheminFichierBrut(dossier, SOURCE_DT, 'photos.json');
  const gardees = await lireJson<{
    empreinte: string;
    medias: Record<string, MediaDatatourisme[]>;
  }>(cheminGardees);
  const cheminZip = cheminFichierBrut(dossier, SOURCE_DT, FICHIER_DT);
  const zipPresent = (await stat(cheminZip).catch(() => null)) !== null;
  if (horsLigne && !zipPresent) {
    if (!gardees) throw new Error(`Mode hors ligne : ni ${cheminZip} ni ${cheminGardees}.`);
    return new Map(Object.entries(gardees.medias));
  }
  const adresse = trouverSource(SOURCE_DT).telechargement;
  if (!horsLigne && !adresse) {
    throw new Error(`Adresse de téléchargement absente de config/sources.json (${SOURCE_DT})`);
  }
  const fichier = {
    chemin: cheminZip,
    empreinte:
      horsLigne || !adresse
        ? await empreinteFichier(cheminZip)
        : (await telechargerAvecReprise(adresse, cheminZip, { tentatives: 8 })).empreinte,
  };
  if (gardees && gardees.empreinte === fichier.empreinte && !options.force) {
    journal.info('Export DATAtourisme inchangé : photos gardées réutilisées');
    // Les fiches ont pu changer depuis : on ne garde que les nôtres.
    return new Map(Object.entries(gardees.medias).filter(([fiche]) => fiches.has(fiche)));
  }
  const entree = (await listerZip(fichier.chemin)).find((nom) => nom.endsWith('.nt'));
  if (!entree) throw new Error(`Aucun fichier .nt dans ${fichier.chemin}`);
  const ouvrir = async function* (): AsyncGenerator<string> {
    const flux = await ouvrirDansZip(fichier.chemin, entree);
    if (!flux) throw new Error(`${entree} illisible dans ${fichier.chemin}`);
    yield* createInterface({ input: flux, crlfDelay: Infinity });
  };
  const medias = await lireMediasDatatourisme(ouvrir, fiches);
  await ecrireJson(cheminGardees, {
    empreinte: fichier.empreinte,
    medias: Object.fromEntries(medias),
  });
  return medias;
}

const champ = (texte: string | null): string => `"${(texte ?? '').replaceAll('"', '""')}"`;

async function ecrireRapport(
  dossier: string,
  nom: string,
  lignes: readonly string[],
): Promise<string> {
  const chemin = path.join(dossier, 'traite', 'rapports', `${nom}.csv`);
  await mkdir(path.dirname(chemin), { recursive: true });
  await writeFile(chemin, lignes.join('\n') + '\n');
  return chemin;
}

export async function traiterPhotos(options: {
  force: boolean;
  horsLigne: boolean;
}): Promise<void> {
  const config = lireConfig();
  const dossier = resoudreDossierDonnees(config.DOSSIER_DONNEES);
  const pool = creerPool(config.BDD_URL_ETL);
  try {
    await executerSource({ pool, dossierDonnees: dossier }, 'photos', async (suivi) => {
      const lieux = await lireLieuxPourPhotos(pool);
      // Groupe de chaque lieu gardé : lui-même d'abord, puis ses doublons.
      const groupes = new Map<number, typeof lieux>();
      for (const l of lieux) if (l.doublonDe === null) groupes.set(l.id, [l]);
      for (const l of lieux) if (l.doublonDe !== null) groupes.get(l.doublonDe)?.push(l);

      const tous = [...groupes.values()].flat();
      const fichiersOsm = tous.map((l) => fichierCommons(l.imageUrl)).filter((f) => f !== null);
      const titres = tous.map((l) => titreWikipediaFr(l.wikipedia)).filter((t) => t !== null);
      const qids = tous.map((l) => l.wikidata).filter((q) => q !== null);
      const fiches = new Set(
        tous.filter((l) => l.source === 'datatourisme').map((l) => l.idSource),
      );

      const wikimedia = await reponsesWikimedia(
        dossier,
        { qids, titres, fichiersOsm },
        options.horsLigne,
        config.URL_CONTACT,
      );
      const medias = await mediasDatatourisme(dossier, fiches, options);
      const exclues = await lirePhotosExclues();
      const contexte = {
        metas: new Map(Object.entries(wikimedia.commons)),
        regles: parametres.photos,
        exclues,
        dateDuJour: dateDuJour(),
      };

      const photos: PhotoACharger[] = [];
      const ecarts: { lieuId: number; fichier: string; raison: RaisonEcartPhoto }[] = [];
      for (const [lieuId, groupe] of groupes) {
        const fichierDe = (cle: string, table: Record<string, string>) => table[cle];
        const candidats: Candidat[] = [
          ...groupe.flatMap((l) => {
            const f = fichierCommons(l.imageUrl);
            return f ? [{ origine: 'osm' as const, fichier: f }] : [];
          }),
          ...groupe.flatMap((l) => {
            const titre = titreWikipediaFr(l.wikipedia);
            const f = titre ? fichierDe(titre, wikimedia.pages) : undefined;
            return f ? [{ origine: 'wikipedia' as const, fichier: f }] : [];
          }),
          ...groupe.flatMap((l) => {
            const f = l.wikidata ? fichierDe(l.wikidata, wikimedia.p18) : undefined;
            return f ? [{ origine: 'wikidata' as const, fichier: f }] : [];
          }),
          ...groupe.flatMap((l) =>
            l.source === 'datatourisme'
              ? (medias.get(l.idSource) ?? []).map((media) => ({
                  origine: 'datatourisme' as const,
                  media,
                }))
              : [],
          ),
        ];
        const choix = choisirPhoto(candidats, contexte);
        if (choix.photo) photos.push({ ...choix.photo, lieuId });
        for (const e of choix.ecarts) ecarts.push({ ...e, lieuId });
      }

      const { chargees, controles } = await enTransaction(pool, async (client) => {
        const n = await chargerPhotosDans(client, photos);
        const resultats = await executerControles(client, [
          auMoins(
            `au moins ${parametres.controles.photosMin} lieux avec une photo`,
            'SELECT count(*)::int AS n FROM photo_lieu',
            parametres.controles.photosMin,
          ),
        ]);
        if (echecsBloquants(resultats).length > 0) throw new ErreurControles(resultats);
        return { chargees: n, controles: resultats };
      });
      suivi.chargees = chargees;
      suivi.controles = controles;

      const noms = new Map(
        (
          await pool.query<{ id: string; cle: string; nom: string }>(
            'SELECT id, cle, nom FROM lieu',
          )
        ).rows.map((r) => [Number(r.id), r]),
      );
      const retenues = await ecrireRapport(dossier, 'photos_retenues', [
        'cle;nom;origine;photo;auteur;licence;droits_fin',
        ...photos.map((p) =>
          [
            noms.get(p.lieuId)?.cle,
            champ(noms.get(p.lieuId)?.nom ?? ''),
            p.origine,
            champ(p.fichier),
            champ(p.auteur),
            champ(p.licence),
            p.droitsFin ?? '',
          ].join(';'),
        ),
      ]);
      const ecartees = await ecrireRapport(dossier, 'photos_ecartees', [
        'cle;nom;photo;raison',
        ...ecarts.map((e) =>
          [
            noms.get(e.lieuId)?.cle,
            champ(noms.get(e.lieuId)?.nom ?? ''),
            champ(e.fichier),
            LIBELLES_ECART_PHOTO[e.raison],
          ].join(';'),
        ),
      ]);
      const parOrigine = new Map<string, number>();
      for (const p of photos) parOrigine.set(p.origine, (parOrigine.get(p.origine) ?? 0) + 1);
      const parRaison = new Map<string, number>();
      for (const e of ecarts) parRaison.set(e.raison, (parRaison.get(e.raison) ?? 0) + 1);
      suivi.remarques.push(
        `Lieux gardés : ${groupes.size} ; avec une photo : ${photos.length}`,
        `Par origine : ${[...parOrigine].map(([o, n]) => `${o} ${n}`).join(', ')}`,
        `Photos écartées (une même photo peut l'être pour plusieurs lieux) : ${[...parRaison]
          .map(([r, n]) => `${LIBELLES_ECART_PHOTO[r as RaisonEcartPhoto]} ${n}`)
          .join(', ')}`,
        `Photos à relire : ${path.relative(dossier, retenues)} ; écartées : ${path.relative(dossier, ecartees)}`,
      );
      return 'SUCCES';
    });
  } finally {
    await pool.end();
  }
}
