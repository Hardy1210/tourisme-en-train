import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PHOTOS_ACCUEIL } from './photos-accueil';

const publicDir = path.join(import.meta.dirname, '../../../public');

describe('photos de l’accueil', () => {
  it.each(PHOTOS_ACCUEIL.map((p) => [p.photo.grande, p]))(
    '%s : fichier présent',
    (_, { photo }) => {
      expect(existsSync(path.join(publicDir, photo.grande))).toBe(true);
      expect(existsSync(path.join(publicDir, photo.petite))).toBe(true);
    },
  );
  it('chacune a son auteur et sa licence (règle 8)', () => {
    for (const { photo } of PHOTOS_ACCUEIL) {
      expect(photo.auteur.trim()).not.toBe('');
      expect(photo.licence.trim()).not.toBe('');
    }
  });
  it('un fichier absent serait vu', () => {
    expect(existsSync(path.join(publicDir, '/accueil/absente.webp'))).toBe(false);
  });
});
