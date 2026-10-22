import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { SourceDonnees } from '@tourisme/commun';
import { resoudreDossierDonnees } from '../src/config';
import {
  cheminFichierBrut,
  empreinteFichier,
  estInchange,
  obtenirFichier,
  telecharger,
} from '../src/sources/base';

// SHA-256 de « abc » (vecteur de test officiel FIPS 180-2).
const EMPREINTE_ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

let dossier: string;
beforeEach(async () => {
  dossier = await mkdtemp(path.join(tmpdir(), 'etl-base-'));
  return () => rm(dossier, { recursive: true, force: true });
});

// Petit serveur local : aucun accès au réseau pendant les tests.
let serveur: Server;
let adresse: string;
beforeAll(async () => {
  serveur = createServer((requete, reponse) => {
    if (requete.url === '/abc.csv') reponse.end('abc');
    else reponse.writeHead(404).end();
  });
  await new Promise<void>((pret) => serveur.listen(0, '127.0.0.1', pret));
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((fini) => serveur.close(() => fini())));

function source(telechargement: string | null): SourceDonnees {
  return {
    code: 'essai',
    nom: 'Essai',
    producteur: 'Test',
    mode: 'base',
    page: 'https://exemple.fr/',
    telechargement,
    licence: 'Licence Ouverte',
    attribution: 'Test',
    verifie: true,
  };
}

describe('estInchange', () => {
  it('même empreinte que le dernier chargement → inchangé', () => {
    expect(estInchange('a1', 'a1', false)).toBe(true);
  });
  it('empreinte différente → changé', () => {
    expect(estInchange('a1', 'b2', false)).toBe(false);
  });
  it('jamais chargée → changé', () => {
    expect(estInchange('a1', null, false)).toBe(false);
  });
  it('--force → toujours retraité', () => {
    expect(estInchange('a1', 'a1', true)).toBe(false);
  });
});

describe('chemins', () => {
  it('range le fichier dans brut/<source>/', () => {
    expect(cheminFichierBrut('/data', 'gares', 'gares.csv')).toBe('/data/brut/gares/gares.csv');
  });
  it('lit un dossier relatif depuis la racine du dépôt', () => {
    expect(resoudreDossierDonnees('./data', '/depot')).toBe('/depot/data');
  });
  it('garde un dossier absolu (Docker) tel quel', () => {
    expect(resoudreDossierDonnees('/data', '/depot')).toBe('/data');
  });
});

describe('empreinteFichier', () => {
  it('calcule le SHA-256 du contenu', async () => {
    const chemin = path.join(dossier, 'abc.txt');
    await writeFile(chemin, 'abc');
    expect(await empreinteFichier(chemin)).toBe(EMPREINTE_ABC);
  });
});

describe('telecharger', () => {
  it('écrit le fichier et calcule son empreinte au passage', async () => {
    const chemin = path.join(dossier, 'brut', 'essai', 'abc.csv');
    expect(await telecharger(`${adresse}/abc.csv`, chemin)).toEqual({
      empreinte: EMPREINTE_ABC,
      taille: 3,
    });
    expect(await readFile(chemin, 'utf8')).toBe('abc');
  });

  it('échec HTTP → erreur, et le fichier précédent est conservé', async () => {
    const chemin = path.join(dossier, 'precedent.csv');
    await writeFile(chemin, 'ancien');
    await expect(telecharger(`${adresse}/absent.csv`, chemin)).rejects.toThrow(/HTTP 404/);
    expect(await readFile(chemin, 'utf8')).toBe('ancien');
  });
});

describe('obtenirFichier', () => {
  const options = { nomFichier: 'abc.csv', horsLigne: false };

  it('télécharge depuis l’adresse de config/sources.json', async () => {
    const fichier = await obtenirFichier(source(`${adresse}/abc.csv`), {
      ...options,
      dossierDonnees: dossier,
    });
    expect(fichier).toMatchObject({ empreinte: EMPREINTE_ABC, taille: 3, telecharge: true });
  });

  it('hors ligne : réutilise le fichier présent sans télécharger', async () => {
    const chemin = cheminFichierBrut(dossier, 'essai', 'abc.csv');
    await mkdir(path.dirname(chemin), { recursive: true });
    await writeFile(chemin, 'abc');
    // Adresse injoignable : prouve qu'aucun téléchargement n'est tenté.
    const fichier = await obtenirFichier(source(`${adresse}/absent.csv`), {
      ...options,
      dossierDonnees: dossier,
      horsLigne: true,
    });
    expect(fichier).toEqual({ chemin, empreinte: EMPREINTE_ABC, taille: 3, telecharge: false });
  });

  it('hors ligne sans fichier présent → erreur explicite', async () => {
    await expect(
      obtenirFichier(source(null), { ...options, dossierDonnees: dossier, horsLigne: true }),
    ).rejects.toThrow(/Mode hors ligne : fichier absent/);
  });

  it('adresse absente de config/sources.json → erreur explicite', async () => {
    await expect(
      obtenirFichier(source(null), { ...options, dossierDonnees: dossier }),
    ).rejects.toThrow(/Adresse de téléchargement absente/);
  });
});
