// Déroulé commun des sources de lieux (docs/04-traitement-donnees.md § 4.4, D041) : règles lues en
// base → lecture et classement de la source → chargement → rapport et valeurs non classées.
import { createHash } from 'node:crypto';
import { parametres } from '../config';
import { charger } from '../chargement/base';
import {
  compter,
  controlesLieux,
  ecrireNonClassees,
  fusionnerLieux,
  nouveauCompte,
  TABLE_TEMPORAIRE,
  trouverCommunes,
  versValeurs,
  type BilanFusionLieux,
} from '../chargement/lieux';
import type { Suivi } from '../chargement/rapport';
import { lireRegles, type SOURCES_LIEUX } from '../chargement/regles';
import type { creerPool } from '../db';
import {
  indexerRegles,
  type IndexRegles,
  type RegleCategorie,
} from '../transformations/categories';
import type { ResultatLigne } from '../transformations/datatourisme';
import {
  categoriesSecondaires,
  type RegleSecondaire,
} from '../transformations/categories-secondaires';
import { LIBELLES_ECART, type LieuMasquable } from '../transformations/lieux';
import { motifQuiExclut, type MotifExclu } from '../transformations/noms-exclus';
import { lireReglesSecondaires } from '../chargement/categories-secondaires';
import { lireCorrections } from '../chargement/corrections';
import {
  corrigerLieu,
  inclusionsDe,
  masqueParSousCategorie,
  type CorrectionLieu,
  type Inclusion,
} from '../transformations/corrections';
import { ecrireLieuxExclus, lireNomsExclus, type LieuExclu } from '../chargement/noms-exclus';
import { estInchange, lireEmpreinteConnue, type FichierBrut } from './base';

const nombre = (n: number): string => n.toLocaleString('fr-FR');

/**
 * Empreinte du fichier, des règles, des noms exclus ET des catégories secondaires : une règle modifiée doit reclasser la
 * source, même quand son fichier n'a pas changé.
 */
export function empreinteLieux(
  fichier: string,
  regles: readonly RegleCategorie[],
  nomsExclus: readonly MotifExclu[] = [],
  secondaires: readonly RegleSecondaire[] = [],
  corrections: readonly CorrectionLieu[] = [],
  sousCategoriesMasquees: readonly string[] = [],
): string {
  return (
    createHash('sha256')
      .update(fichier)
      .update(JSON.stringify(regles))
      .update(JSON.stringify(nomsExclus))
      .update(JSON.stringify(secondaires))
      .update(JSON.stringify(corrections))
      // Changer la liste des sous-catégories masquées doit recharger la source (D093).
      .update(JSON.stringify(sousCategoriesMasquees))
      .digest('hex')
  );
}

export async function chargerLieux(options: {
  pool: ReturnType<typeof creerPool>;
  dossierDonnees: string;
  source: (typeof SOURCES_LIEUX)[number];
  fichier: FichierBrut;
  force: boolean;
  suivi: Suivi;
  /** Lit la source et renvoie chaque ligne classée ; remplit le bilan de lecture. */
  lire: (
    index: IndexRegles,
    descriptionMax: number,
    inclusion: Inclusion,
  ) => AsyncIterable<ResultatLigne>;
}): Promise<'SUCCES' | 'IGNORE'> {
  const { pool, source, suivi } = options;
  const client = await pool.connect();
  const [regles, connue] = await Promise.all([
    lireRegles(client, source),
    lireEmpreinteConnue(client, source),
  ]).finally(() => client.release());
  const nomsExclus = await lireNomsExclus();
  const secondaires = await lireReglesSecondaires();
  const toutesCorrections = await lireCorrections();
  const deLaSource = toutesCorrections.filter((c) => c.source === source);
  const corrections = new Map(deLaSource.map((c) => [c.idSource, c]));
  const inclusion = inclusionsDe(deLaSource);
  const empreinte = empreinteLieux(
    options.fichier.empreinte,
    regles,
    nomsExclus,
    secondaires,
    toutesCorrections,
    parametres.acces.sousCategoriesMasquees,
  );
  if (estInchange(empreinte, connue, options.force)) return 'IGNORE';

  const index = indexerRegles(regles);
  const compte = nouveauCompte();
  const lus = new Set<string>();
  const exclusParNom: LieuExclu[] = [];
  async function* lieux(): AsyncGenerator<LieuMasquable> {
    const descriptionMax = parametres.lieux.descriptionMaxCaracteres;
    for await (const resultat of options.lire(index, descriptionMax, inclusion)) {
      if (resultat.type === 'ecarte') {
        compter(compte, resultat.raison, resultat.nonClassees);
      } else if (lus.has(resultat.lieu.idSource)) {
        compter(compte, 'doublon', []);
      } else {
        const correction = corrections.get(resultat.lieu.idSource);
        // Une correction manuelle passe avant les règles automatiques (D091) : un lieu inclu ou reclassé
        // à la main n'est écarté ni par son nom, ni par sa sous-catégorie.
        const motif =
          correction && correction.action !== 'retirer'
            ? null
            : motifQuiExclut(resultat.lieu.nom, nomsExclus);
        if (motif) {
          const { idSource, nom } = resultat.lieu;
          exclusParNom.push({ idSource, nom, motif: motif.texte, raison: motif.raison });
          compter(compte, 'nom_exclu', resultat.nonClassees);
          continue;
        }
        lus.add(resultat.lieu.idSource);
        const lieu = {
          ...resultat.lieu,
          categoriesSecondaires: categoriesSecondaires(secondaires, {
            source,
            etiquettes: resultat.etiquettes,
            nom: resultat.lieu.nom,
            categorie: resultat.lieu.categorie,
          }),
        };
        const corrige = correction ? corrigerLieu(lieu, correction) : lieu;
        if (corrige === null) {
          compter(compte, 'correction', resultat.nonClassees);
          continue;
        }
        const { sousCategoriesMasquees } = parametres.acces;
        compter(compte, null, resultat.nonClassees);
        // Jamais écarté : un lieu masqué reste en base, caché des écrans (D093).
        yield {
          ...corrige,
          masque: masqueParSousCategorie(corrige.sousCategorie, sousCategoriesMasquees, correction),
        };
      }
    }
  }

  let bilan: BilanFusionLieux | null = null;
  const resultat = await charger(
    pool,
    {
      source,
      tableTemporaire: TABLE_TEMPORAIRE,
      lignes: lieux(),
      versValeurs,
      preparer: trouverCommunes,
      controles: controlesLieux(),
      fusionner: async (c) => {
        bilan = await fusionnerLieux(c, source);
        return bilan.chargees;
      },
    },
    empreinte,
  );
  suivi.chargees = resultat.chargees;
  suivi.controles = resultat.controles;

  for (const [raison, n] of compte.ecarts) {
    suivi.remarques.push(`Écartés, ${LIBELLES_ECART[raison]} : ${nombre(n)}`);
  }
  const fusion = bilan as BilanFusionLieux | null;
  if (fusion) {
    suivi.remarques.push(
      `Hors des contours de la région : ${nombre(fusion.horsRegion)} ; lieux supprimés (disparus de la source) : ${nombre(fusion.supprimees)}`,
      `Par catégorie : ${Object.entries(fusion.parCategorie)
        .map(([c, n]) => `${c} ${nombre(n)}`)
        .join(' · ')}`,
    );
  }
  const exclus = await ecrireLieuxExclus(options.dossierDonnees, source, exclusParNom);
  suivi.remarques.push(`Écartés par leur nom, liste à relire : ${exclus}`);
  const chemin = await ecrireNonClassees(options.dossierDonnees, source, compte.nonClassees);
  suivi.remarques.push(
    `Valeurs sans règle : ${nombre(compte.nonClassees.size)} (à relire : ${chemin})`,
  );
  return 'SUCCES';
}
