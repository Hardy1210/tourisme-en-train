// Compilation JIT coupée pour l'application (D095) : sur la requête des lieux de la carte, elle coûtait
// 641 ms sur 727 (mesure du 16/11/2026) ; sans elle, la requête s'exécute en 58 ms.
import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

// Importé pour son effet : la base de test est choisie AVANT de charger le client.
import './outils-api';

describe("connexions de l'application", () => {
  it('ont la compilation JIT coupée', async () => {
    const { db } = await import('@/lib/db/client');
    const { rows } = await db.execute(sql`SHOW jit`);
    expect(rows[0]).toEqual({ jit: 'off' });
  });
});
