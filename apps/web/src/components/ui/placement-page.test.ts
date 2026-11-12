import { describe, expect, it } from 'vitest';
import { placementPage } from './placement-page';

// Le clavier de l'iPhone annonce sa hauteur finale dès le début de sa montée : si le fond de la page se
// raccourcissait aussitôt, l'écran du dessous se verrait sous elle jusqu'à ce que le clavier arrive.
describe('placementPage', () => {
  it('clavier ouvert : le fond couvre toujours tout l’écran', () => {
    const { fond } = placementPage({ haut: 0, hauteur: 400 });
    expect(fond).toEqual({});
  });

  it('clavier ouvert : seul le contenu s’arrête au-dessus du clavier', () => {
    expect(placementPage({ haut: 0, hauteur: 400 }).contenu).toEqual({
      transform: 'translateY(0px)',
      height: 400,
    });
  });

  it('écran décalé par iOS pour montrer le champ : le contenu suit la zone visible', () => {
    expect(placementPage({ haut: 120, hauteur: 380 }).contenu).toEqual({
      transform: 'translateY(120px)',
      height: 380,
    });
  });

  it('sans clavier : ni le fond ni le contenu ne sont recalés', () => {
    expect(placementPage(null)).toEqual({ fond: {}, contenu: {} });
  });
});
