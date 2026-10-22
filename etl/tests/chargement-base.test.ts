import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { lireCsv, versLigneCsv } from '../src/chargement/base';
import { echecsBloquants, ErreurControles } from '../src/controles/base';

describe('versLigneCsv', () => {
  it('met les textes entre guillemets et double les guillemets internes', () => {
    expect(versLigneCsv(['Dijon', 'Le "Petit" train'])).toBe('"Dijon","Le ""Petit"" train"\n');
  });
  it('null → champ vide (NULL) ; texte vide → "" (gardé)', () => {
    expect(versLigneCsv([null, ''])).toBe(',""\n');
  });
  it('nombres et booléens tels quels', () => {
    expect(versLigneCsv([5.04, true])).toBe('5.04,true\n');
  });
  it('tableau → tableau PostgreSQL entre guillemets', () => {
    expect(versLigneCsv([['87713040', '87713041']])).toBe('"{""87713040"",""87713041""}"\n');
  });
});

describe('lireCsv', () => {
  const schema = z.object({ nom: z.string().min(1), uic: z.string().regex(/^\d{8}$/) });

  async function lire(contenu: string) {
    const dossier = await mkdtemp(path.join(tmpdir(), 'etl-csv-'));
    try {
      const chemin = path.join(dossier, 'essai.csv');
      await writeFile(chemin, contenu);
      const { lignes, bilan } = lireCsv(chemin, schema, { delimiteur: ';' });
      const valides = [];
      for await (const ligne of lignes) valides.push(ligne);
      return { valides, bilan };
    } finally {
      await rm(dossier, { recursive: true, force: true });
    }
  }

  it('retire le BOM et lit les colonnes par leur nom', async () => {
    const { valides } = await lire('﻿nom;uic\nDijon-Ville;87713040\n');
    expect(valides).toEqual([{ nom: 'Dijon-Ville', uic: '87713040' }]);
  });

  it('écarte une ligne invalide en notant sa ligne et sa raison', async () => {
    const { valides, bilan } = await lire('nom;uic\nDijon-Ville;87713040\nBeaune;12345\n');
    expect(valides).toHaveLength(1);
    expect(bilan.lues).toBe(2);
    expect(bilan.rejets).toEqual([{ ligne: 3, raison: expect.stringMatching(/^uic : /) }]);
  });
});

describe('contrôles', () => {
  const resultats = [
    { nom: 'gares France', bloquant: true, reussi: false, detail: '12 (minimum 2500)' },
    { nom: 'avertissement', bloquant: false, reussi: false, detail: '0' },
    { nom: 'gares région', bloquant: true, reussi: true, detail: '196 (minimum 100)' },
  ];

  it('seul un contrôle bloquant en échec compte comme échec bloquant', () => {
    expect(echecsBloquants(resultats).map((r) => r.nom)).toEqual(['gares France']);
  });

  it("l'erreur nomme le contrôle en échec et garde tous les résultats", () => {
    const erreur = new ErreurControles(resultats);
    expect(erreur.message).toContain('gares France (12 (minimum 2500))');
    expect(erreur.resultats).toHaveLength(3);
  });
});
