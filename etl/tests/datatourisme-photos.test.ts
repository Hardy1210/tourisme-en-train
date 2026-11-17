// Photos DATAtourisme lues dans l'export national RDF (D100, D101) : seulement nos fiches, en plusieurs
// passages sur le flux (le fichier fait 14 Go : jamais en mémoire). Extrait au format de l'export du 10/11.
import { describe, expect, it } from 'vitest';
import { lireMediasDatatourisme } from '../src/transformations/datatourisme-photos';

const CORE = 'https://www.datatourisme.fr/ontology/core#';
const EBU = 'http://www.ebu.ch/metadata/ontologies/ebucore/ebucore#';
const XSD = 'http://www.w3.org/2001/XMLSchema#';
const D = 'https://data.datatourisme.fr/';

const t = (s: string, p: string, o: string) => `<${s}> <${p}> ${o} .`;
const uri = (x: string) => `<${x}>`;

// Fiche A (la nôtre) : photo principale avec crédit et droits datés, deuxième photo sans dates.
// Fiche B (pas dans notre base) : jamais lue. Fiche C (la nôtre) : document PDF et photo sans crédit.
const LIGNES = [
  t(`${D}6/A`, `${CORE}hasMainRepresentation`, uri(`${D}repA1`)),
  t(`${D}6/A`, `${CORE}hasRepresentation`, uri(`${D}repA1`)),
  t(`${D}6/A`, `${CORE}hasRepresentation`, uri(`${D}repA2`)),
  t(`${D}6/A`, `${CORE}hasDescription`, uri(`${D}descA`)),
  t(`${D}6/B`, `${CORE}hasMainRepresentation`, uri(`${D}repB1`)),
  t(`${D}6/C`, `${CORE}hasRepresentation`, uri(`${D}repC1`)),
  t(`${D}6/C`, `${CORE}hasRepresentation`, uri(`${D}repC2`)),
  t(`${D}repA1`, `${EBU}hasAnnotation`, uri(`${D}annA1`)),
  t(`${D}repA1`, `${EBU}hasRelatedResource`, uri(`${D}resA1`)),
  t(`${D}repA2`, `${EBU}hasAnnotation`, uri(`${D}annA2`)),
  t(`${D}repA2`, `${EBU}hasRelatedResource`, uri(`${D}resA2`)),
  t(`${D}repB1`, `${EBU}hasRelatedResource`, uri(`${D}resB1`)),
  t(`${D}repC1`, `${EBU}hasRelatedResource`, uri(`${D}resC1`)),
  t(`${D}repC2`, `${EBU}hasAnnotation`, uri(`${D}annC2`)),
  t(`${D}repC2`, `${EBU}hasRelatedResource`, uri(`${D}resC2`)),
  t(`${D}annA1`, `${CORE}credits`, '"Mus\\u00E9e de l\'Avallonnais"'),
  t(`${D}annA1`, `${CORE}rightsStartDate`, `"2023-04-01"^^<${XSD}date>`),
  t(`${D}annA1`, `${CORE}rightsEndDate`, `"2027-12-31"^^<${XSD}date>`),
  t(`${D}annA1`, `${EBU}title`, '"Salle"@fr'),
  t(`${D}annA2`, `${CORE}credits`, '"OT \\"Avallon\\""'),
  t(
    `${D}resA1`,
    `${EBU}locator`,
    `"https://x.media.tourinsoft.eu/upload/Salle.jpg"^^<${XSD}anyURI>`,
  ),
  t(
    `${D}resA2`,
    `${EBU}locator`,
    `"https://x.media.tourinsoft.eu/upload/Cour.JPG"^^<${XSD}anyURI>`,
  ),
  t(`${D}resB1`, `${EBU}locator`, `"https://x.media.tourinsoft.eu/upload/B.jpg"^^<${XSD}anyURI>`),
  t(
    `${D}resC1`,
    `${EBU}locator`,
    `"https://x.media.tourinsoft.eu/upload/Plan.pdf"^^<${XSD}anyURI>`,
  ),
  t(`${D}resC2`, `${EBU}locator`, `"https://x.media.tourinsoft.eu/upload/C.jpg"^^<${XSD}anyURI>`),
];

/** Un passage = une nouvelle lecture du flux ; on compte les passages. */
function source(lignes: readonly string[]) {
  let passages = 0;
  return {
    ouvrir: async function* () {
      passages += 1;
      yield* lignes;
    },
    passages: () => passages,
  };
}

describe('lireMediasDatatourisme', () => {
  it('nos fiches seulement, photo principale d’abord, crédit et dates de droits lus', async () => {
    const flux = source(LIGNES);
    const medias = await lireMediasDatatourisme(flux.ouvrir, new Set([`${D}6/A`, `${D}6/C`]));
    expect(medias.get(`${D}6/A`)).toEqual([
      {
        url: 'https://x.media.tourinsoft.eu/upload/Salle.jpg',
        credits: "Musée de l'Avallonnais",
        debut: '2023-04-01',
        fin: '2027-12-31',
      },
      {
        url: 'https://x.media.tourinsoft.eu/upload/Cour.JPG',
        credits: 'OT "Avallon"',
        debut: null,
        fin: null,
      },
    ]);
    expect(medias.has(`${D}6/B`)).toBe(false);
    expect(flux.passages()).toBe(3);
  });

  it('limite : un média sans crédit est lu tel quel (crédit null) ; c’est la règle de choix qui l’écarte', async () => {
    const medias = await lireMediasDatatourisme(source(LIGNES).ouvrir, new Set([`${D}6/C`]));
    expect(medias.get(`${D}6/C`)).toEqual([
      {
        url: 'https://x.media.tourinsoft.eu/upload/Plan.pdf',
        credits: null,
        debut: null,
        fin: null,
      },
      { url: 'https://x.media.tourinsoft.eu/upload/C.jpg', credits: null, debut: null, fin: null },
    ]);
  });

  it('limite : aucune de nos fiches dans l’export → rien, en un seul passage', async () => {
    const flux = source(LIGNES);
    expect((await lireMediasDatatourisme(flux.ouvrir, new Set([`${D}6/Z`]))).size).toBe(0);
    expect(flux.passages()).toBe(1);
  });
});
