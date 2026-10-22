import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { indexerCommunes, lireCommunes, type LigneCommune } from '../src/sources/communes';

const ligne = (TYPECOM: LigneCommune['TYPECOM'], COM: string, LIBELLE: string, COMPARENT = '') => ({
  TYPECOM,
  COM,
  LIBELLE,
  COMPARENT,
});

describe('indexerCommunes', () => {
  it('commune : son propre nom', () => {
    expect(indexerCommunes([ligne('COM', '21231', 'Dijon')]).get('21231')).toBe('Dijon');
  });

  it('arrondissement municipal : nom de la commune parente', () => {
    const index = indexerCommunes([
      ligne('ARM', '75113', 'Paris 13e Arrondissement', '75056'),
      ligne('COM', '75056', 'Paris'),
    ]);
    expect(index.get('75113')).toBe('Paris');
  });

  it('commune déléguée au même code : la commune l’emporte, quel que soit l’ordre', () => {
    const index = indexerCommunes([
      ligne('COMD', '01015', 'Arbignieu', '01015'),
      ligne('COM', '01015', 'Arboys en Bugey'),
    ]);
    expect(index.get('01015')).toBe('Arboys en Bugey');
  });

  it('commune déléguée à son propre code : nom de la commune de rattachement', () => {
    const index = indexerCommunes([
      ligne('COM', '01015', 'Arboys en Bugey'),
      ligne('COMD', '01340', 'Saint-Bois', '01015'),
    ]);
    expect(index.get('01340')).toBe('Arboys en Bugey');
  });

  it('code absent du COG (commune fusionnée) : pas de nom', () => {
    expect(indexerCommunes([ligne('COM', '21231', 'Dijon')]).has('21999')).toBe(false);
  });
});

describe('lireCommunes', () => {
  it('lit le CSV du COG (virgules, guillemets) et écarte une ligne invalide', async () => {
    const dossier = await mkdtemp(path.join(tmpdir(), 'etl-cog-'));
    try {
      const chemin = path.join(dossier, 'v_commune.csv');
      await writeFile(
        chemin,
        '"TYPECOM","COM","REG","LIBELLE","COMPARENT"\n' +
          '"COM","21231","27","Dijon",""\n' +
          '"COM","2761","32","Code tronqué par Excel",""\n',
      );
      const { communes, bilan } = await lireCommunes(chemin);
      expect(communes.get('21231')).toBe('Dijon');
      expect(bilan).toMatchObject({ lues: 2, rejets: [{ ligne: 3 }] });
    } finally {
      await rm(dossier, { recursive: true, force: true });
    }
  });
});
