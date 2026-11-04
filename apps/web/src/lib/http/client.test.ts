import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ErreurClient, fautReessayer, lireApi } from './client';

const schema = z.object({ ok: z.boolean() });
const repondre = (corps: unknown, status = 200) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(corps), { status })),
  );

afterEach(() => vi.unstubAllGlobals());

describe('lireApi', () => {
  it('renvoie la réponse validée', async () => {
    repondre({ ok: true });
    await expect(lireApi('/api/test', schema)).resolves.toEqual({ ok: true });
  });

  it('refuse une réponse qui ne suit pas le contrat', async () => {
    repondre({ autre: 1 });
    await expect(lireApi('/api/test', schema)).rejects.toThrow();
  });

  it('transmet le message d’erreur de l’API et son statut', async () => {
    repondre({ erreur: { code: 'INTROUVABLE', message: 'Cette gare est inconnue.' } }, 404);
    await expect(lireApi('/api/test', schema)).rejects.toMatchObject({
      message: 'Cette gare est inconnue.',
      statut: 404,
    });
  });

  it('garde un message lisible si l’erreur n’a pas le format attendu', async () => {
    repondre({ detail: 'trace technique' }, 500);
    await expect(lireApi('/api/test', schema)).rejects.toMatchObject({
      message: expect.not.stringContaining('trace'),
      statut: 500,
    });
  });
});

describe('fautReessayer', () => {
  it('réessaie une panne du serveur, deux fois au plus', () => {
    expect(fautReessayer(1, new ErreurClient('panne', 503))).toBe(true);
    expect(fautReessayer(2, new ErreurClient('panne', 503))).toBe(false);
  });

  it('ne réessaie jamais une erreur de la demande', () => {
    expect(fautReessayer(0, new ErreurClient('inconnue', 404))).toBe(false);
  });
});
