import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { indexerCommunes, lireCommunes, type LigneCommune } from '../src/sources/communes';

const ligne = (
  TYPECOM: LigneCommune['TYPECOM'],
  COM: string,
  LIBELLE: string,
  DEP: string,
  COMPARENT = '',
) => ({ TYPECOM, COM, LIBELLE, DEP, COMPARENT });

describe('indexerCommunes', () => {
  it('commune : son propre nom et son département', () => {
    expect(indexerCommunes([ligne('COM', '21231', 'Dijon', '21')]).get('21231')).toEqual({
      nom: 'Dijon',
      departement: '21',
    });
  });

  it('arrondissement municipal : nom et département de la commune parente', () => {
    const index = indexerCommunes([
      ligne('ARM', '75113', 'Paris 13e Arrondissement', '75', '75056'),
      ligne('COM', '75056', 'Paris', '75'),
    ]);
    expect(index.get('75113')).toEqual({ nom: 'Paris', departement: '75' });
  });

  it('commune déléguée au même code : la commune l’emporte, quel que soit l’ordre', () => {
    const index = indexerCommunes([
      ligne('COMD', '01015', 'Arbignieu', '', '01015'),
      ligne('COM', '01015', 'Arboys en Bugey', '01'),
    ]);
    expect(index.get('01015')).toEqual({ nom: 'Arboys en Bugey', departement: '01' });
  });

  it('commune déléguée à son propre code (sans département) : celui de la commune de rattachement', () => {
    const index = indexerCommunes([
      ligne('COM', '01015', 'Arboys en Bugey', '01'),
      ligne('COMD', '01340', 'Saint-Bois', '', '01015'),
    ]);
    expect(index.get('01340')).toEqual({ nom: 'Arboys en Bugey', departement: '01' });
  });

  it('code absent du COG (commune fusionnée) : pas de commune', () => {
    expect(indexerCommunes([ligne('COM', '21231', 'Dijon', '21')]).has('21999')).toBe(false);
  });
});

describe('lireCommunes', () => {
  it('lit le CSV du COG (virgules, guillemets) et écarte les lignes invalides', async () => {
    const dossier = await mkdtemp(path.join(tmpdir(), 'etl-cog-'));
    try {
      const chemin = path.join(dossier, 'v_commune.csv');
      await writeFile(
        chemin,
        '"TYPECOM","COM","REG","DEP","LIBELLE","COMPARENT"\n' +
          '"COM","21231","27","21","Dijon",""\n' +
          '"COM","2761","32","02","Code tronqué par Excel",""\n' +
          '"COM","21232","27","","Commune sans département",""\n' +
          '"COMD","01340","84","","Saint-Bois","01015"\n',
      );
      const { communes, bilan } = await lireCommunes(chemin);
      expect(communes.get('21231')).toEqual({ nom: 'Dijon', departement: '21' });
      expect(bilan).toMatchObject({ lues: 4, rejets: [{ ligne: 3 }, { ligne: 4 }] });
    } finally {
      await rm(dossier, { recursive: true, force: true });
    }
  });
});
