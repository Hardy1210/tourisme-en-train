import { afterEach, describe, expect, it, vi } from 'vitest';

import { Introuvable, ParametreInvalide, ServiceExterneIndisponible } from './erreurs';
import { gererRoute, repondre } from './reponse';

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
    gererRoute('test', () => Promise.reject(erreur))(new Request('http://localhost/api/test'));

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
    expect(await (await route(new Request('http://localhost/api/test'))).json()).toEqual({
      ok: true,
    });
  });
});
