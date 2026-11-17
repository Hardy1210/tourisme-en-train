// regles/photos_exclues.csv (D101) : une photo écartée à la main, désignée par son fichier (Commons) ou
// son adresse (DATAtourisme, dont les noms de fichiers ne sont pas uniques). Le lieu n'est jamais touché.
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { lirePhotosExclues } from '../src/chargement/photos-exclues';

async function fichier(contenu: string): Promise<string> {
  const chemin = path.join(await mkdtemp(path.join(tmpdir(), 'photos-exclues-')), 'photos.csv');
  await writeFile(chemin, contenu);
  return chemin;
}

describe('lirePhotosExclues', () => {
  it('le fichier du dépôt contient les photos 12, 26 et 41 de la planche du 17/11', async () => {
    const exclues = await lirePhotosExclues();
    expect(exclues).toEqual(
      new Set([
        'https://decibelles-data.media.tourinsoft.eu/upload/IMG-1953.jpg',
        'Bouligney8.jpg',
        'https://decibelles-data.media.tourinsoft.eu/upload/20230819-212811.jpg',
      ]),
    );
  });

  it('seules les lignes décidées « oui » comptent', async () => {
    const chemin = await fichier(
      [
        'photo;raison;decision',
        'A.jpg;mauvais cadrage;oui',
        'B.jpg;à voir;',
        'C.jpg;non retenu;non',
      ].join('\n'),
    );
    expect(await lirePhotosExclues(chemin)).toEqual(new Set(['A.jpg']));
  });

  it('limite : une ligne illisible est une erreur (elle changerait les photos en silence)', async () => {
    const chemin = await fichier(['photo;raison;decision', ';sans photo;oui'].join('\n'));
    await expect(lirePhotosExclues(chemin)).rejects.toThrow(/photos_exclues\.csv/);
  });
});
