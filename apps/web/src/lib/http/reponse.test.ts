import { gunzipSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Introuvable, ParametreInvalide, ServiceExterneIndisponible } from './erreurs';
import { detailErreur, gererRoute, repondre, repondreCompresse } from './reponse';

afterEach(() => vi.restoreAllMocks());

describe('repondre', () => {
  it('cache public avec durée ; « aucun » → no-store', () => {
    expect(repondre({}, { publicMaxAgeS: 300 }).headers.get('Cache-Control')).toBe(
      'public, max-age=300',
    );
    expect(repondre({}, 'aucun').headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('gererRoute', () => {
  const appeler = (erreur: unknown) =>
    gererRoute('test', () => Promise.reject(erreur))(
      new Request('http://localhost/api/test'),
      undefined,
    );

  it('paramètre invalide → 400 au format unique', async () => {
    const reponse = await appeler(new ParametreInvalide('La date doit être au format AAAA-MM-JJ.'));
    expect(reponse.status).toBe(400);
    expect(await reponse.json()).toEqual({
      erreur: { code: 'PARAMETRE_INVALIDE', message: 'La date doit être au format AAAA-MM-JJ.' },
    });
  });

  it('introuvable → 404 ; service externe → 503 réessayable', async () => {
    expect((await appeler(new Introuvable('Gare inconnue.'))).status).toBe(404);
    const reponse = await appeler(new ServiceExterneIndisponible('Service indisponible.'));
    expect(reponse.status).toBe(503);
    expect((await reponse.json()).erreur.reessayable).toBe(true);
  });

  it('erreur inattendue → 500 sans détail technique, détail dans le journal', async () => {
    const sortie = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const reponse = await appeler(new Error('connexion refusée sur 127.0.0.1:5433'));
    expect(reponse.status).toBe(500);
    const corps = JSON.stringify(await reponse.json());
    expect(corps).toContain('ERREUR_INTERNE');
    expect(corps).not.toContain('127.0.0.1');
    expect(String(sortie.mock.calls[0]?.[0])).toContain('connexion refusée');
  });

  it('pas d’erreur → la réponse du traitement passe telle quelle', async () => {
    const route = gererRoute('test', () => Promise.resolve(repondre({ ok: true }, 'aucun')));
    expect(await (await route(new Request('http://localhost/api/test'), undefined)).json()).toEqual(
      {
        ok: true,
      },
    );
  });
});

describe('detailErreur', () => {
  it('retire les paramètres d’une requête en échec : ils peuvent contenir une position', () => {
    const erreur = new Error('Failed query: SELECT 1 WHERE x = $1\nparams: 5.0272,47.3233', {
      cause: new Error('relation « gare » absente'),
    });
    const detail = JSON.stringify(detailErreur(erreur));
    expect(detail).not.toContain('47.3233');
    expect(detail).not.toContain('5.0272');
    expect(detail).toContain('Failed query: SELECT 1');
    expect(detail).toContain('relation « gare » absente');
  });

  it('garde le message d’une erreur sans paramètres ; rien d’inconnu n’est écrit', () => {
    expect(detailErreur(new Error('connexion refusée'))).toMatchObject({
      message: 'connexion refusée',
    });
    expect(detailErreur('47.3233')).toBe('Erreur sans détail');
  });
});

describe('repondreCompresse', () => {
  const donnees = { lieux: [['a', 47.3, 5.0, 'patrimoine', []]] };

  it('compresse en gzip quand le navigateur l’accepte, et redonne les mêmes données', async () => {
    const reponse = repondreCompresse(
      new Request('http://x', { headers: { 'Accept-Encoding': 'gzip, br' } }),
      donnees,
      { publicMaxAgeS: 600 },
    );
    expect(reponse.headers.get('content-encoding')).toBe('gzip');
    const brut = gunzipSync(Buffer.from(await reponse.arrayBuffer())).toString();
    expect(JSON.parse(brut)).toEqual(donnees);
  });

  it('sans gzip accepté : JSON en clair', async () => {
    const reponse = repondreCompresse(new Request('http://x'), donnees, 'aucun');
    expect(reponse.headers.get('content-encoding')).toBeNull();
    expect(await reponse.json()).toEqual(donnees);
  });
});
