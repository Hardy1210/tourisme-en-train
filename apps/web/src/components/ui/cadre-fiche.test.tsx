// Cadre des fiches : marge du haut (zone de l'heure et de la batterie) ; `hautPlein` la laisse au contenu,
// pour une photo qui monte jusqu'en haut de l'écran, derrière l'heure (maquette Fiche-Lieu, Hardy 20/11).
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CadreFiche } from './cadre-fiche';

const classesDuCadre = (html: string) => /class="([^"]*)"/.exec(html)?.[1]?.split(' ') ?? [];

describe('CadreFiche', () => {
  it('par défaut, garde la marge du haut (rien sous l’heure)', () => {
    const html = renderToStaticMarkup(<CadreFiche carte={null}>contenu</CadreFiche>);
    expect(classesDuCadre(html)).toContain('safe-top');
  });
  it('`hautPlein` : aucune marge en haut, le contenu monte derrière l’heure', () => {
    const html = renderToStaticMarkup(
      <CadreFiche carte={null} hautPlein>
        contenu
      </CadreFiche>,
    );
    expect(classesDuCadre(html)).not.toContain('safe-top');
  });
});
