// Lecture d'une ligne du CSV régional DATAtourisme (docs/02-sources-donnees.md § 2.3, D041).
// Fonctions pures : la ligne arrive validée par Zod, les règles en paramètre.
import { classer, etiquettesNonClassees, type Etiquette, type IndexRegles } from './categories';
import {
  nettoyerDescription,
  normaliserNom,
  texteOuNull,
  urlValide,
  type LieuNormalise,
  type RaisonEcart,
} from './lieux';

export interface LigneDatatourisme {
  Nom_du_POI: string;
  Categories_de_POI: string;
  Latitude: number;
  Longitude: number;
  Adresse_postale: string;
  Contacts_du_POI: string;
  Classements_du_POI: string;
  Description: string;
  URI_ID_du_POI: string;
}

/** Clé des règles DATAtourisme dans `categories.csv`. */
export const CLE_DATATOURISME = 'categorie';

/** Classe calculée : le lieu est à la fois piscine et centre de balnéo. */
export const CLASSE_PISCINE_BIEN_ETRE = 'SwimmingPool+BalneotherapyCentre';

/** « …/core#Museum|http://schema.org/Product » → classes courtes, sans doublon (`Museum`, `Product`). */
export function classesDe(categories: string): Etiquette[] {
  const classes = new Set(
    categories
      .split('|')
      .map((c) => c.trim().replace(/^.*[#/]/, ''))
      .filter((c) => c !== ''),
  );
  // Une règle sur Balnéo seul ferait entrer spas d'hôtel et cabinets de massage : il faut les deux (D057).
  if (classes.has('SwimmingPool') && classes.has('BalneotherapyCentre')) {
    classes.add(CLASSE_PISCINE_BIEN_ETRE);
  }
  return [...classes].map((c) => [CLE_DATATOURISME, c] as const);
}

/** Réseaux sociaux et billetteries : gardés seulement s'il n'y a pas de site propre au lieu. */
const SITES_SECONDAIRES =
  /facebook\.|instagram\.|twitter\.|x\.com|youtube\.|linkedin\.|tripadvisor\.|billetweb\./i;

/**
 * Site web d'un lieu dans `Contacts_du_POI` (« téléphone#site<>autre site|… ») : la première adresse
 * qui n'est pas un réseau social, sinon la première adresse valide.
 */
export function siteDesContacts(contacts: string): string | null {
  const adresses = (contacts.match(/https?:\/\/[^\s<>|#]+/g) ?? [])
    .map((a) => urlValide(a))
    .filter((a): a is string => a !== null);
  return adresses.find((a) => !SITES_SECONDAIRES.test(a)) ?? adresses[0] ?? null;
}

export type ResultatLigne =
  | { type: 'lieu'; lieu: LieuNormalise; nonClassees: string[] }
  | { type: 'ecarte'; raison: RaisonEcart; nonClassees: string[] };

export function lireLigneDatatourisme(
  ligne: LigneDatatourisme,
  index: IndexRegles,
  descriptionMax: number,
): ResultatLigne {
  const etiquettes = classesDe(ligne.Categories_de_POI);
  const nonClassees = etiquettesNonClassees(index, etiquettes);
  const nom = normaliserNom(ligne.Nom_du_POI);
  const classement = classer(index, etiquettes, { aNom: nom !== '', notable: false });
  if (classement.type !== 'classe') return { type: 'ecarte', raison: classement.type, nonClassees };

  return {
    type: 'lieu',
    nonClassees,
    lieu: {
      idSource: ligne.URI_ID_du_POI,
      nom,
      categorie: classement.categorie,
      sousCategorie: classement.sousCategorie,
      description: nettoyerDescription(ligne.Description, descriptionMax),
      adresse: texteOuNull(ligne.Adresse_postale),
      url: siteDesContacts(ligne.Contacts_du_POI),
      imageUrl: null,
      horaires: null,
      qualiteTourisme: ligne.Classements_du_POI.includes('Qualité Tourisme'),
      trace: null,
      lon: ligne.Longitude,
      lat: ligne.Latitude,
    },
  };
}
