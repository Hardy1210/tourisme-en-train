// Descriptions longues DATAtourisme lues dans l'export national RDF (D105) : seulement nos fiches, seulement
// le français, la plus longue si plusieurs ; puis choix entre l'export et le CSV. Extrait au format de
// l'export du 17/11 (fiche → core:hasDescription → nœud → dc:description « …@fr »).
import { describe, expect, it } from 'vitest';
import { lireLitteral } from '../src/transformations/datatourisme-photos';
import {
  descriptionRetenue,
  lireDescriptionsDatatourisme,
} from '../src/transformations/datatourisme-descriptions';
import { nettoyerDescription } from '../src/transformations/lieux';

const CORE = 'https://www.datatourisme.fr/ontology/core#';
const DC = 'http://purl.org/dc/elements/1.1/description';
const D = 'https://data.datatourisme.fr/';
const t = (s: string, p: string, o: string) => `<${s}> <${p}> ${o} .`;
const uri = (x: string) => `<${x}>`;

// A (la nôtre) : deux nœuds en français, le plus long gagne ; une version anglaise plus longue, ignorée.
// B (pas dans notre base) : jamais lue. C (la nôtre) : anglais seulement. E (la nôtre) : résumé seul.
const LIGNES = [
  t(`${D}6/A`, `${CORE}hasDescription`, uri(`${D}descA1`)),
  t(`${D}6/A`, `${CORE}hasDescription`, uri(`${D}descA2`)),
  t(`${D}6/B`, `${CORE}hasDescription`, uri(`${D}descB`)),
  t(`${D}6/C`, `${CORE}hasDescription`, uri(`${D}descC`)),
  t(`${D}6/E`, `${CORE}hasDescription`, uri(`${D}descE`)),
  t(`${D}descA1`, DC, '"Court."@fr'),
  t(`${D}descA2`, DC, '"Mus\\u00E9e d\\u2019art.\\n\\nDeux salles \\"Renaissance\\"."@fr'),
  t(`${D}descA2`, DC, '"Art museum with a very long English text that is longer."@en'),
  t(`${D}descB`, DC, '"Pas à nous."@fr'),
  t(`${D}descC`, DC, '"English only."@en'),
  t(`${D}descE`, `${CORE}shortDescription`, '"Résumé seul."@fr'),
];
const ouvrir = async function* () {
  yield* LIGNES;
};
const NOS_FICHES = new Set([`${D}6/A`, `${D}6/C`, `${D}6/E`]);

describe('lireLitteral : échappements N-Triples', () => {
  it('décode \\n, \\t, \\", \\\\ et \\uXXXX', () => {
    expect(lireLitteral('"Ligne\\nsuite \\"cit\\u00E9\\" \\\\ fin\\tok"@fr')).toBe(
      'Ligne\nsuite "cité" \\ fin\tok',
    );
  });
  it('limite : un objet qui n’est pas un littéral → null', () => {
    expect(lireLitteral('<https://data.datatourisme.fr/x>')).toBeNull();
  });
});

describe('lireDescriptionsDatatourisme', () => {
  it('nos fiches seulement, en français seulement, la plus longue', async () => {
    const descriptions = await lireDescriptionsDatatourisme(ouvrir, NOS_FICHES);
    expect([...descriptions.keys()]).toEqual([`${D}6/A`]);
    expect(descriptions.get(`${D}6/A`)).toBe('Musée d’art.\n\nDeux salles "Renaissance".');
  });
  it('limite : anglais seul ou résumé seul → rien (le CSV reste)', async () => {
    const descriptions = await lireDescriptionsDatatourisme(ouvrir, NOS_FICHES);
    expect(descriptions.has(`${D}6/C`)).toBe(false);
    expect(descriptions.has(`${D}6/E`)).toBe(false);
  });
});

describe('chaîne complète : N-Triples, puis entités HTML, puis paragraphes', () => {
  it('« caf&eacute; » échappé en N-Triples, avec des lignes vides, devient un texte propre', () => {
    const brut = lireLitteral('"Caf\\u00E9 &amp; caf&eacute;\\n\\n\\n\\nBar  ouvert"@fr');
    expect(nettoyerDescription(brut, 2000)).toBe('Café & café\n\nBar ouvert');
  });
});

describe('descriptionRetenue : l’export seulement s’il est plus long', () => {
  it('l’export plus long remplace le CSV (une fois nettoyé)', () => {
    expect(descriptionRetenue('Résumé.', '<p>Résumé.</p><p>Et bien plus encore.</p>', 2000)).toBe(
      'Résumé.\n\nEt bien plus encore.',
    );
  });
  it('limite : un export plus court ou de même longueur laisse le CSV', () => {
    expect(descriptionRetenue('Un résumé assez long.', 'Court.', 2000)).toBe(
      'Un résumé assez long.',
    );
    expect(descriptionRetenue('Même texte.', 'Même texte.', 2000)).toBe('Même texte.');
  });
  it('sans export, le CSV ; sans rien, null ; sans CSV, l’export', () => {
    expect(descriptionRetenue('Résumé.', null, 2000)).toBe('Résumé.');
    expect(descriptionRetenue(null, null, 2000)).toBeNull();
    expect(descriptionRetenue(null, 'Texte de l’export.', 2000)).toBe('Texte de l’export.');
  });
});
