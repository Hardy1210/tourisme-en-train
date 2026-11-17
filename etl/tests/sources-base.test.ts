import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { SourceDonnees } from '@tourisme/commun';
import { resoudreDossierDonnees } from '../src/config';
import {
  avecReessais,
  cheminFichierBrut,
  ErreurTelechargement,
  empreinteFichier,
  estInchange,
  obtenirFichier,
  telecharger,
  telechargerAvecReprise,
} from '../src/sources/base';

// SHA-256 de « abc » (vecteur de test officiel FIPS 180-2).
const EMPREINTE_ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

let dossier: string;
beforeEach(async () => {
  dossier = await mkdtemp(path.join(tmpdir(), 'etl-base-'));
  return () => rm(dossier, { recursive: true, force: true });
});

// Petit serveur local : aucun accès au réseau pendant les tests.
const CONTENU = 'abcdefghij';
const appels: { url: string | undefined; range: string | null }[] = [];
let serveur: Server;
let adresse: string;
beforeAll(async () => {
  serveur = createServer((requete, reponse) => {
    if (requete.url === '/abc.csv') reponse.end('abc');
    else if (requete.url === '/coupe.bin' || requete.url === '/sans-reprise.bin') {
      // Comme l'export national du 17/11 : la connexion se coupe en plein envoi. `/coupe.bin` accepte la
      // reprise (Range) ; `/sans-reprise.bin` renvoie toujours tout le fichier.
      appels.push({ url: requete.url, range: requete.headers.range ?? null });
      const plage = /^bytes=(\d+)-$/.exec(requete.headers.range ?? '');
      if (plage && requete.url === '/coupe.bin') {
        const debut = Number(plage[1]);
        reponse.writeHead(206, {
          'Content-Length': String(CONTENU.length - debut),
          'Content-Range': `bytes ${debut}-${CONTENU.length - 1}/${CONTENU.length}`,
        });
        reponse.end(CONTENU.slice(debut));
      } else if (appels.filter((a) => a.url === requete.url).length === 1) {
        reponse.writeHead(200, { 'Content-Length': String(CONTENU.length) });
        // Le temps que le client reçoive ces 4 octets, puis la coupure.
        reponse.write(CONTENU.slice(0, 4), () => setTimeout(() => reponse.destroy(), 100));
      } else {
        reponse.writeHead(200, { 'Content-Length': String(CONTENU.length) });
        reponse.end(CONTENU);
      }
    } else reponse.writeHead(404).end();
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
    groupe: 'trains',
    mode: 'base',
    page: 'https://exemple.fr/',
    telechargement,
    licence: 'Licence Ouverte',
    attribution: 'Test',
    verifie: true,
    affichee: true,
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

describe('telechargerAvecReprise (gros fichiers : export DATAtourisme, 1,9 Go)', () => {
  const sansAttente = { tentatives: 3, attendre: async () => {} };

  it('connexion coupée : reprend là où elle s’est arrêtée (Range), le fichier est complet', async () => {
    appels.length = 0;
    const chemin = path.join(dossier, 'coupe.bin');
    const resultat = await telechargerAvecReprise(`${adresse}/coupe.bin`, chemin, sansAttente);
    expect(await readFile(chemin, 'utf8')).toBe(CONTENU);
    expect(resultat.taille).toBe(CONTENU.length);
    expect(appels.map((a) => a.range)).toEqual([null, 'bytes=4-']);
  });

  it('limite : serveur sans reprise → recommence au début, sans doubler le début du fichier', async () => {
    appels.length = 0;
    const chemin = path.join(dossier, 'sans-reprise.bin');
    await telechargerAvecReprise(`${adresse}/sans-reprise.bin`, chemin, sansAttente);
    expect(await readFile(chemin, 'utf8')).toBe(CONTENU);
  });

  it('limite : coupé à chaque tentative → erreur, le fichier précédent est conservé', async () => {
    const chemin = path.join(dossier, 'precedent.bin');
    await writeFile(chemin, 'ancien');
    await expect(
      telechargerAvecReprise(`${adresse}/absent.bin`, chemin, sansAttente),
    ).rejects.toThrow(/HTTP 404/);
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

describe('avecReessais', () => {
  /** Action qui échoue avec les statuts donnés, puis réussit. */
  function action(statuts: number[]): () => Promise<string> {
    const restants = [...statuts];
    return async () => {
      const statut = restants.shift();
      if (statut !== undefined) throw new ErreurTelechargement(statut, 'http://exemple');
      return 'ok';
    };
  }

  it('serveur saturé (502) : réessaie en doublant l’attente, puis réussit', async () => {
    const attentes: number[] = [];
    const resultat = await avecReessais(action([502, 429]), {
      tentatives: 3,
      premiereAttenteMs: 1000,
      attendre: async (ms) => {
        attentes.push(ms);
      },
    });
    expect(resultat).toBe('ok');
    expect(attentes).toEqual([1000, 2000]);
  });

  it('abandonne après la dernière tentative', async () => {
    await expect(
      avecReessais(action([503, 503, 503]), {
        tentatives: 3,
        premiereAttenteMs: 1,
        attendre: async () => {},
      }),
    ).rejects.toMatchObject({ statut: 503 });
  });

  it('ne réessaie pas une erreur définitive (404)', async () => {
    let appels = 0;
    const echec = async () => {
      appels += 1;
      throw new ErreurTelechargement(404, 'http://exemple');
    };
    await expect(
      avecReessais(echec, { tentatives: 5, premiereAttenteMs: 1, attendre: async () => {} }),
    ).rejects.toMatchObject({ statut: 404 });
    expect(appels).toBe(1);
  });
});
