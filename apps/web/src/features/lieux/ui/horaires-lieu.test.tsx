// Horaires d'ouverture (D108) : lignes françaises et « Aujourd'hui » ; texte d'origine si non compris.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HorairesLieu } from './horaires-lieu';

const HOTEL_DIEU =
  'Apr 01-Nov 15 09:00-19:30; Nov 16-Mar 31 09:00-12:00,14:00-18:30; Jan 01,Dec 25 14:00-18:30';

describe('HorairesLieu', () => {
  it('affiche les lignes françaises, sans le texte d’origine', () => {
    const html = renderToStaticMarkup(<HorairesLieu texte={HOTEL_DIEU} dateDuJour="2026-11-20" />);
    expect(html).toContain('<dt');
    expect(html).toContain('16 nov. – 31 mars');
    expect(html).toContain('14 h – 18 h 30');
    expect(html).not.toContain('Apr 01');
  });

  it('marque une seule ligne « Aujourd’hui », celle du jour', () => {
    const html = renderToStaticMarkup(<HorairesLieu texte={HOTEL_DIEU} dateDuJour="2026-11-20" />);
    expect(html.match(/Aujourd’hui/g)).toHaveLength(1);
    expect(html.indexOf('16 nov. – 31 mars')).toBeLessThan(html.indexOf('Aujourd’hui'));
    expect(html.indexOf('Aujourd’hui')).toBeLessThan(html.indexOf('1er janv.'));
  });

  it('n’affiche aucun « Aujourd’hui » un jour sans règle', () => {
    const html = renderToStaticMarkup(
      <HorairesLieu texte="Sa,Su 14:00-18:00" dateDuJour="2026-11-20" />,
    );
    expect(html).not.toContain('Aujourd’hui');
  });

  it('garde le texte d’origine quand il n’est pas compris', () => {
    const html = renderToStaticMarkup(
      <HorairesLieu texte="May-Oct Su[1]" dateDuJour="2026-11-20" />,
    );
    expect(html).toContain('May-Oct Su[1]');
    expect(html).not.toContain('<dl');
  });
});
