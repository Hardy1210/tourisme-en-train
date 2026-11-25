// Textes de « L'âme du produit », tirés de docs/equipe/pitch.md (brouillon, fiche E13, D075).
// Une section sans texte validé n'existe pas ici : rien n'est inventé pour remplir la page.
import { parametres } from '@/config/parametres';
import { formaterKg } from '@/features/destinations/presentation';

export type ChiffreSource = {
  valeur: string;
  texte: string;
  sources: readonly { libelle: string; url: string }[];
  /** Vérifié sur la page source : un chiffre non confirmé n'est jamais affiché (choix de Hardy). */
  confirme: boolean;
};

const COMMUNIQUE_ADEME =
  'https://www.ademe.fr/presse/communique-national/journee-mondiale-du-tourisme-bilan-des-emissions-de-ges-du-secteur-du-tourisme-en-france/';

// Communiqué de l'ADEME (pitch.md). Ne jamais y joindre les 11 % : ils portent sur les 46 Mt émises
// sur le territoire, un autre périmètre que ces 97 Mt.
const CHIFFRES_DU_BILAN: readonly ChiffreSource[] = [
  {
    valeur: '97 Mt CO₂e',
    texte: 'Empreinte carbone du tourisme en France en 2022.',
    sources: [{ libelle: 'ADEME', url: COMMUNIQUE_ADEME }],
    confirme: true,
  },
  {
    valeur: '69 %',
    texte: 'de cette empreinte vient du transport.',
    sources: [{ libelle: 'ADEME', url: COMMUNIQUE_ADEME }],
    confirme: true,
  },
];

/** Voiture contre TER, calculés depuis les facteurs de l'application ; rien sans facteur TER. */
export function comparaisonVoitureTer(
  facteurs: { VOITURE: number; TER: number | null } = parametres.impact.facteursCo2GParKm,
): ChiffreSource | null {
  if (facteurs.TER === null) return null;
  const voiture = Math.round(facteurs.VOITURE / 10);
  return {
    valeur: `${voiture} kg contre ${formaterKg(facteurs.TER / 10)} kg`,
    texte:
      'de CO₂e pour 100 km, par personne : voiture thermique moyenne (diesel), une personne à bord, contre TER.',
    sources: [
      { libelle: 'ADEME, Impact CO2 (transport)', url: 'https://impactco2.fr/outils/transport' },
      { libelle: 'ADEME, Impact CO2 (TER)', url: 'https://impactco2.fr/outils/transport/ter' },
    ],
    confirme: true,
  };
}

export const seulementConfirmes = (liste: readonly ChiffreSource[]): ChiffreSource[] =>
  liste.filter((chiffre) => chiffre.confirme);

/**
 * « Ce que ça change » : la dernière phrase reprend les facteurs de l'application (jamais écrits en dur),
 * et disparaît sans facteur TER, comme la carte des chiffres.
 */
export function ceQueCaChange(
  facteurs: { VOITURE: number; TER: number | null } = parametres.impact.facteursCo2GParKm,
): string[] {
  const base = [
    "Une seule application au lieu de plusieurs sites à croiser : horaires, gares, lieux à visiter, bus à l'arrivée.",
    "Des sorties à un seul train de chez soi, qu'on ne connaissait pas, deviennent visibles.",
  ];
  if (facteurs.TER === null) return base;
  return [
    ...base,
    `Et chaque destination montre le CO₂ économisé face à la voiture : pour 100 km, environ ${formaterKg(facteurs.TER / 10)} kg en TER, contre ${Math.round(facteurs.VOITURE / 10)} kg en voiture seul.`,
  ];
}

export function chiffresAffiches(): ChiffreSource[] {
  const comparaison = comparaisonVoitureTer();
  return seulementConfirmes(comparaison ? [...CHIFFRES_DU_BILAN, comparaison] : CHIFFRES_DU_BILAN);
}

export const TEXTES_A_PROPOS = {
  titrePage: 'À propos',
  accroche: 'Trouver une sortie en 30 secondes, et y aller en train.',
  constat: {
    titre: 'Le constat',
    paragraphes: [
      "Organiser une sortie, un week-end ou des vacances sans voiture oblige aujourd'hui à passer d'un site à l'autre : un pour les châteaux, un pour les aires de jeux, un pour la nature, un pour les horaires de train, un pour les bus sur place. Chaque site ne répond qu'à une question. Et surtout, on ne sait pas ce qui existe, ni près de chez soi, ni ailleurs.",
      'Résultat : du stress, et souvent on reprend la voiture.',
    ],
  },
  importance: {
    titre: "Pourquoi c'est important",
    limite:
      "L'avantage du train dépend du remplissage de la voiture : l'application montre donc aussi la voiture partagée.",
  },
  solution: {
    titre: 'La solution',
    introduction: "L'application répond à deux questions :",
    questions: [
      "Qu'est-ce que je peux faire autour de moi ?",
      "Où puis-je aller aujourd'hui en train direct, et qu'y a-t-il à voir ?",
    ],
    transports:
      "Ordre d'importance des transports : le train, puis les transports en ville à l'arrivée, puis la marche depuis la gare.",
  },
  source: 'Source :',
  ouvrir: "Ouvrir l'application",
  // Les 3 étapes, « Pour qui » et « Ce que ça change » : textes validés par Hardy le 25/11 (pitch.md).
  etapes: {
    titre: 'Comment ça marche',
    liste: [
      {
        titre: 'Ouvrez',
        texte:
          "L'application trouve votre gare et vous montre ce qu'il y a à faire autour de vous.",
        capture: {
          src: '/a-propos/etape-1-ouvrez.webp',
          alt: 'Explorer : votre gare et les lieux près de vous, sur la carte et dans la liste',
        },
      },
      {
        titre: 'Choisissez une sortie',
        texte:
          "Toutes les destinations en train direct depuis votre gare, la plus proche d'abord, avec leurs lieux à visiter.",
        capture: {
          src: '/a-propos/etape-2-choisissez.webp',
          alt: 'La page Lieux : une rangée de lieux à visiter par gare, avec le temps de train',
        },
      },
      {
        titre: 'Partez',
        texte:
          'La fiche donne le train aller et retour, les lieux à pied depuis la gare, le bus, le tram ou le vélo sur place, et le prix estimé.',
        capture: {
          src: '/a-propos/etape-3-partez.webp',
          alt: 'La fiche de Beaune : trains directs, lieux à pied et transports sur place',
        },
      },
    ],
  },
  pourQui: {
    titre: 'Pour qui',
    introduction: 'Tous ceux qui veulent sortir sans voiture.',
    profils: [
      { titre: 'En famille', texte: 'une sortie du week-end avec les enfants.' },
      { titre: 'À deux ou entre amis', texte: 'une idée de sortie rapide, depuis sa gare.' },
      {
        titre: 'Habitants de la région',
        texte: "découvrir les environs sans passer une soirée à s'organiser.",
      },
      { titre: 'En visite dans la région', texte: 'que faire ici, aujourd’hui ?' },
      { titre: 'Préparer un séjour', texte: "repérer une destination et ses trains à l'avance." },
    ],
  },
  change: { titre: 'Ce que ça change' },
} as const;
