import { describe, expect, it } from 'vitest';

import { nomBase, urlAvecBase, verifierMotsDePasse } from './base';

describe('verifierMotsDePasse', () => {
  it('accepte des adresses cohérentes avec leurs variables', () => {
    expect(
      verifierMotsDePasse({
        BDD_URL_MIGRATIONS: 'postgres://proprietaire:abc@localhost:5433/tourisme',
        POSTGRES_PASSWORD: 'abc',
        BDD_URL_APP: 'postgres://app_lecture:x.y_z@localhost:5433/tourisme',
        MDP_APP_LECTURE: 'x.y_z',
      }),
    ).toEqual([]);
  });

  it('signale une adresse dont le mot de passe diffère, sans montrer les valeurs', () => {
    expect(
      verifierMotsDePasse({
        BDD_URL_MIGRATIONS: 'postgres://proprietaire:ancien@localhost:5433/tourisme',
        POSTGRES_PASSWORD: 'nouveau',
      }),
    ).toEqual(['BDD_URL_MIGRATIONS ≠ POSTGRES_PASSWORD']);
  });

  it('ne compare pas quand une des deux variables manque (conteneur de production)', () => {
    expect(verifierMotsDePasse({ BDD_URL_MIGRATIONS: 'postgres://p:a@db:5432/tourisme' })).toEqual(
      [],
    );
  });
});

describe('urlAvecBase', () => {
  it('change seulement le nom de la base', () => {
    const url = urlAvecBase('postgres://p:a@localhost:5433/tourisme', 'tourisme_test');
    expect(url).toBe('postgres://p:a@localhost:5433/tourisme_test');
    expect(nomBase(url)).toBe('tourisme_test');
  });
});
