// Commande `pnpm etl descriptions_wikipedia` (docs/04-traitement-donnees.md § 4.6 quater, D123) :
// l'introduction de l'article Wikipédia en français que le lieu (ou l'un de ses doublons) désigne par son tag
// OSM, jamais trouvé par son nom, et seulement si l'article parle bien de ce lieu. Après `rattachements`.
// Réponses gardées dans data/brut/ : `--hors-ligne` rejoue sans réseau (données figées, E16).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { journal, trouverSource } from '@tourisme/commun';
import {
  chargerTextesWikipediaDans,
  lireLieuxPourTextes,
  type LieuPourTexte,
  type TexteACharger,
} from '../chargement/descriptions-wikipedia';
import { executerSource } from '../chargement/execution';
import { lireConfig, parametres, resoudreDossierDonnees } from '../config';
import { auMoins, echecsBloquants, ErreurControles, executerControles } from '../controles/base';
import { creerPool, enTransaction } from '../db';
import { titreWikipediaFr } from '../transformations/photos';
import {
  choisirTexte,
  LIBELLES_ECART_TEXTE,
  type ArticleWikipedia,
  type CandidatTexte,
  type RaisonEcartTexte,
} from '../transformations/wikipedia-textes';
import { cheminFichierBrut } from './base';
import { chercherArticles, creerClientWikimedia, userAgentWikimedia } from './wikimedia';

/** Longueur du début de texte écrit dans le rapport, pour juger d'un coup d'œil. */
const DEBUT_RAPPORT = 160;

/** Articles demandés à Wikipédia, ou relus depuis data/brut/ en `--hors-ligne`. */
async function articlesWikipedia(
  dossier: string,
  titres: readonly string[],
  horsLigne: boolean,
  contact: string | undefined,
): Promise<Map<string, ArticleWikipedia>> {
  const chemin = cheminFichierBrut(dossier, 'wikipedia_textes', 'reponses.json');
  if (horsLigne) {
    const texte = await readFile(chemin, 'utf8').catch(() => null);
    if (texte === null) {
      throw new Error(`Mode hors ligne : ${chemin} absent. Lancez une fois sans --hors-ligne.`);
    }
    return new Map(Object.entries(JSON.parse(texte) as Record<string, ArticleWikipedia>));
  }
  if (!contact) {
    throw new Error(
      "URL_CONTACT manquante : l'adresse du site, envoyée à Wikimedia dans le User-Agent (voir .env.example).",
    );
  }
  const api = trouverSource('wikipedia').api;
  if (!api) throw new Error("Adresse d'API absente de config/sources.json (wikipedia)");
  const appeler = creerClientWikimedia({
    userAgent: userAgentWikimedia(contact),
    pauseMs: parametres.photos.api.pauseMs,
    tentatives: parametres.photos.api.tentatives,
  });
  const articles = await chercherArticles(
    appeler,
    api,
    titres,
    parametres.wikipedia.textes.taillePaquet,
  );
  journal.info('Wikipédia lu', { articles: titres.length, trouves: articles.size });
  await mkdir(path.dirname(chemin), { recursive: true });
  await writeFile(chemin, JSON.stringify(Object.fromEntries(articles)));
  return articles;
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

/** Candidats d'un groupe (le lieu gardé, puis ses doublons) : ceux qui ont un article en français. */
function candidatsDe(groupe: readonly LieuPourTexte[]): CandidatTexte[] {
  return groupe.flatMap((l) => {
    const titre = titreWikipediaFr(l.wikipedia);
    return titre ? [{ titre, wikidata: l.wikidata, commune: l.commune }] : [];
  });
}

export async function traiterDescriptionsWikipedia(options: {
  force: boolean;
  horsLigne: boolean;
}): Promise<void> {
  const config = lireConfig();
  const dossier = resoudreDossierDonnees(config.DOSSIER_DONNEES);
  const pool = creerPool(config.BDD_URL_ETL);
  try {
    await executerSource(
      { pool, dossierDonnees: dossier },
      'descriptions_wikipedia',
      async (suivi) => {
        const lieux = await lireLieuxPourTextes(pool);
        const groupes = new Map<number, LieuPourTexte[]>();
        for (const l of lieux) if (l.doublonDe === null) groupes.set(l.id, [l]);
        for (const l of lieux) if (l.doublonDe !== null) groupes.get(l.doublonDe)?.push(l);

        const candidats = new Map([...groupes].map(([id, groupe]) => [id, candidatsDe(groupe)]));
        const titres = [...candidats.values()].flat().map((c) => c.titre);
        const articles = await articlesWikipedia(
          dossier,
          titres,
          options.horsLigne,
          config.URL_CONTACT,
        );

        const max = parametres.lieux.descriptionMaxCaracteres;
        const textes: (TexteACharger & { titre: string })[] = [];
        const ecarts: { lieuId: number; titre: string; raison: RaisonEcartTexte }[] = [];
        for (const [lieuId, liste] of candidats) {
          if (liste.length === 0) continue;
          const choix = choisirTexte(liste, articles, max);
          if (choix.retenu) textes.push({ lieuId, ...choix.retenu });
          for (const e of choix.ecarts) ecarts.push({ lieuId, ...e });
        }

        const { chargees, controles } = await enTransaction(pool, async (client) => {
          const n = await chargerTextesWikipediaDans(client, textes);
          const resultats = await executerControles(client, [
            auMoins(
              `au moins ${parametres.controles.descriptionsWikipediaMin} lieux avec un texte Wikipédia`,
              "SELECT count(*)::int AS n FROM description_lieu WHERE origine = 'wikipedia'",
              parametres.controles.descriptionsWikipediaMin,
            ),
          ]);
          if (echecsBloquants(resultats).length > 0) throw new ErreurControles(resultats);
          return { chargees: n, controles: resultats };
        });
        suivi.chargees = chargees;
        suivi.controles = controles;

        const infos = new Map(
          (
            await pool.query<{ id: string; cle: string; nom: string; sans_description: boolean }>(
              "SELECT id, cle, nom, coalesce(btrim(description), '') = '' AS sans_description FROM lieu",
            )
          ).rows.map((r) => [Number(r.id), r]),
        );
        const retenus = await ecrireRapport(dossier, 'textes_wikipedia_retenus', [
          'cle;nom;article;longueur;sans_autre_description;debut',
          ...textes.map((t) => {
            const lieu = infos.get(t.lieuId);
            return [
              lieu?.cle,
              champ(lieu?.nom ?? ''),
              champ(t.titre),
              t.texte.length,
              lieu?.sans_description ? 'oui' : 'non',
              champ(t.texte.slice(0, DEBUT_RAPPORT).replaceAll('\n', ' ')),
            ].join(';');
          }),
        ]);
        const ecartes = await ecrireRapport(dossier, 'textes_wikipedia_ecartes', [
          'cle;nom;article;raison',
          ...ecarts.map((e) =>
            [
              infos.get(e.lieuId)?.cle,
              champ(infos.get(e.lieuId)?.nom ?? ''),
              champ(e.titre),
              LIBELLES_ECART_TEXTE[e.raison],
            ].join(';'),
          ),
        ]);
        const parRaison = new Map<RaisonEcartTexte, number>();
        for (const e of ecarts) parRaison.set(e.raison, (parRaison.get(e.raison) ?? 0) + 1);
        const nouveaux = textes.filter((t) => infos.get(t.lieuId)?.sans_description).length;
        suivi.remarques.push(
          `Lieux gardés avec un article en français : ${[...candidats.values()].filter((c) => c.length > 0).length}`,
          `Textes retenus : ${textes.length}, dont ${nouveaux} pour des lieux sans autre description`,
          `Articles écartés : ${[...parRaison].map(([r, n]) => `${LIBELLES_ECART_TEXTE[r]} ${n}`).join(', ') || 'aucun'}`,
          `À relire : ${path.relative(dossier, retenus)} ; écartés : ${path.relative(dossier, ecartes)}`,
        );
        return 'SUCCES';
      },
    );
  } finally {
    await pool.end();
  }
}
