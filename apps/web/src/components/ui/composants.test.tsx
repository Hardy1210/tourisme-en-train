import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { marque } from '@/config/marque';
import { Bouton, BoutonFermer, BoutonRetour } from './bouton';
import { EtatVide } from './etat-vide';
import { Logo } from './logo';
import { Puce } from './puce';

describe('Bouton', () => {
  it('est un vrai bouton qui n’envoie pas de formulaire', () => {
    const html = renderToStaticMarkup(<Bouton>Partir</Bouton>);
    expect(html).toMatch(/^<button/);
    expect(html).toContain('type="button"');
    expect(html).toContain('h-touch');
  });

  it('prête son aspect à un lien, sans attribut de bouton', () => {
    const html = renderToStaticMarkup(
      <Bouton asChild>
        <a href="/sources">Sources</a>
      </Bouton>,
    );
    expect(html).toMatch(/^<a/);
    expect(html).toContain('h-touch');
    expect(html).not.toContain('type="button"');
  });

  it.each([
    ['Retour', BoutonRetour],
    ['Fermer', BoutonFermer],
  ])('« %s » : icône seule, nommée, de 44 px', (nom, Composant) => {
    const html = renderToStaticMarkup(<Composant />);
    expect(html).toContain(`aria-label="${nom}"`);
    expect(html).toContain('h-touch');
    expect(html).toContain('w-touch');
  });
});

describe('Puce', () => {
  it('annonce et marque la sélection', () => {
    const html = renderToStaticMarkup(<Puce selectionnee>Nature</Puce>);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('bg-selection-bg');
  });

  it('sans sélection, ne garde aucune marque de sélection', () => {
    const html = renderToStaticMarkup(<Puce selectionnee={false}>Nature</Puce>);
    expect(html).toContain('aria-pressed="false"');
    expect(html).not.toContain('bg-selection-bg');
  });
});

describe('EtatVide', () => {
  it('affiche les actions quand il y en a', () => {
    const html = renderToStaticMarkup(
      <EtatVide titre="Rien" texte="Essayez autre chose">
        <Bouton>Tout afficher</Bouton>
      </EtatVide>,
    );
    expect(html).toContain('Tout afficher');
  });

  it('n’ajoute pas de rangée vide sans action', () => {
    const html = renderToStaticMarkup(<EtatVide titre="Rien" texte="Essayez autre chose" />);
    expect(html).not.toContain('flex-wrap');
  });
});

describe('Logo', () => {
  it('écrit le nom venu de la configuration de marque', () => {
    expect(renderToStaticMarkup(<Logo />)).toContain(marque.nom);
  });

  it('change de couleur sur un en-tête plein', () => {
    expect(renderToStaticMarkup(<Logo />)).toContain('text-logo"');
    expect(renderToStaticMarkup(<Logo surHero />)).toContain('text-logo-sur-hero');
  });
});
