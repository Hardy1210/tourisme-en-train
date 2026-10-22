import { Readable } from 'node:stream';
import { text } from 'node:stream/consumers';
import { describe, expect, it } from 'vitest';
import { separerEntete, tableBrute } from '../src/chargement/gtfs-brut';

const flux = (...morceaux: (string | Buffer)[]) =>
  Readable.from(morceaux.map((m) => (typeof m === 'string' ? Buffer.from(m) : m)));

describe('separerEntete', () => {
  it('lit l’en-tête et rend le reste intact', async () => {
    const { entete, reste } = await separerEntete(flux('a,b\n1,2\n3,4\n'));
    expect(entete).toEqual(['a', 'b']);
    expect(await text(reste)).toBe('1,2\n3,4\n');
  });

  it('retire le BOM, les guillemets et le \\r (fichier Windows)', async () => {
    const { entete, reste } = await separerEntete(flux('﻿"stop_id","stop_name"\r\nX,Y\r\n'));
    expect(entete).toEqual(['stop_id', 'stop_name']);
    expect(await text(reste)).toBe('X,Y\r\n');
  });

  it('en-tête coupé entre plusieurs morceaux', async () => {
    const { entete, reste } = await separerEntete(flux('trip', '_id,ser', 'vice_id\nT1,S1\n'));
    expect(entete).toEqual(['trip_id', 'service_id']);
    expect(await text(reste)).toBe('T1,S1\n');
  });

  it('caractère accentué coupé entre deux morceaux : pas abîmé', async () => {
    const octets = Buffer.from('nom\nBesançon\n');
    const coupure = octets.indexOf(Buffer.from('ç')) + 1; // au milieu des 2 octets de « ç »
    const { reste } = await separerEntete(
      flux(octets.subarray(0, coupure), octets.subarray(coupure)),
    );
    expect(await text(reste)).toBe('Besançon\n');
  });

  it('fichier réduit à son en-tête : reste vide', async () => {
    const { entete, reste } = await separerEntete(flux('a,b\n'));
    expect(entete).toEqual(['a', 'b']);
    expect(await text(reste)).toBe('');
  });
});

describe('tableBrute', () => {
  it('stop_times.txt → gtfs_stop_times', () => {
    expect(tableBrute('stop_times.txt')).toBe('gtfs_stop_times');
  });
});
