import { text } from 'node:stream/consumers';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { listerZip, ouvrirDansZip } from '../src/sources/zip';

// mini.zip (versionné, généré une fois) : agency.txt (2 lignes), stops.txt (201 lignes, compressé),
// et un dossier vide `sous-dossier/`.
const MINI = path.join(import.meta.dirname, 'donnees', 'mini.zip');

describe('listerZip', () => {
  it('liste les fichiers, sans les dossiers', async () => {
    expect(await listerZip(MINI)).toEqual(['agency.txt', 'stops.txt']);
  });
});

describe('ouvrirDansZip', () => {
  it('lit un fichier en flux', async () => {
    const flux = await ouvrirDansZip(MINI, 'agency.txt');
    expect(await text(flux!)).toBe('agency_id,agency_timezone\n1,Europe/Paris\n');
  });

  it('décompresse un fichier compressé en entier', async () => {
    const contenu = await text((await ouvrirDansZip(MINI, 'stops.txt'))!);
    expect(contenu.split('\n')).toHaveLength(202);
  });

  it('fichier absent (ex. calendar.txt) → null', async () => {
    expect(await ouvrirDansZip(MINI, 'calendar.txt')).toBeNull();
  });

  it('ZIP illisible → erreur', async () => {
    await expect(ouvrirDansZip(import.meta.filename, 'agency.txt')).rejects.toThrow();
  });
});
