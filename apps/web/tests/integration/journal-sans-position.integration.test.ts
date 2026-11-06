// Règle 5 : une vraie requête en échec ne laisse pas la position dans le journal (E17, D076).
import { sql } from 'drizzle-orm';
import { afterEach, describe, expect, it, vi } from 'vitest';

import './outils-api';

afterEach(() => vi.restoreAllMocks());

describe('journal d’une requête en échec', () => {
  it('garde la requête, retire les paramètres', async () => {
    const { db } = await import('@/lib/db/client');
    const { repondreErreur } = await import('@/lib/http/reponse');
    const sortie = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    const erreur = await db
      .execute(sql`SELECT * FROM table_absente WHERE lat = ${47.3233} AND lon = ${5.0272}`)
      .catch((e: unknown) => e);
    const reponse = repondreErreur(erreur, 'essai');

    expect(reponse.status).toBe(500);
    const ligne = sortie.mock.calls.map((appel) => String(appel[0])).join('');
    expect(ligne).toContain('table_absente');
    expect(ligne).not.toContain('47.3233');
    expect(ligne).not.toContain('5.0272');
  });

  it('une connexion perdue donne une ligne JSON, sans erreur non gérée ni détail de connexion', async () => {
    const { db } = await import('@/lib/db/client');
    const sortie = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    const perdue = Object.assign(new Error('terminating connection'), { code: '57P01' });
    expect(() => db.$client.emit('error', perdue)).not.toThrow();

    const ligne = JSON.parse(String(sortie.mock.calls[0]?.[0]));
    expect(ligne).toMatchObject({ niveau: 'avertissement', contexte: { code: '57P01' } });
    expect(JSON.stringify(ligne)).not.toContain('terminating');
  });
});
