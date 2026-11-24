import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { marque } from '@/config/marque';
import manifest, { COULEUR_THEME } from './manifest';

const css = readFileSync(path.join(import.meta.dirname, '../styles/globals.css'), 'utf8');

describe('manifest', () => {
  it('reprend la couleur du design system', () => {
    expect(css).toContain(`--primary: ${COULEUR_THEME};`);
  });
  it("démarre sur Android avec le fond de l'écran de lancement (D112), sans saut de couleur", () => {
    expect(css).toContain('--hero-bg: var(--primary);');
    expect(manifest().background_color).toBe(COULEUR_THEME);
  });
  it('est installable : nom de la marque, plein écran, icônes 192, 512 et maskable', () => {
    const m = manifest();
    expect(m.name).toBe(marque.nom);
    expect(m.display).toBe('standalone');
    expect(m.icons?.map((i) => `${i.sizes}/${i.purpose}`)).toEqual([
      '192x192/any',
      '512x512/any',
      '512x512/maskable',
    ]);
  });
});
