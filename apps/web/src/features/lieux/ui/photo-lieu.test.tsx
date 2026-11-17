// Balisage de la photo d'un lieu (D101, D103) : l'icône de la catégorie est toujours là, dessous ; la photo
// (texte alternatif = nom du lieu) se pose par-dessus ; le crédit est un bouton ⓘ nommé. Le comportement
// (fondu, délai, bulle) se vérifie dans le navigateur : tests/e2e/photos.e2e.ts.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Photo } from '../schemas';
import { BoutonCreditPhoto, LigneCreditPhoto, PhotoLieu } from './photo-lieu';

const photo: Photo = {
  petite: 'https://thumb.wikimedia.org/a/500px-a.jpg',
  grande: 'https://thumb.wikimedia.org/a/960px-a.jpg',
  auteur: 'Chau7',
  licence: 'CC BY-SA 3.0',
  licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
  page: 'https://commons.wikimedia.org/wiki/File:A.jpg',
  source: 'wikimedia_commons',
};

describe('PhotoLieu', () => {
  it('l’icône dessous, la photo par-dessus : nom du lieu en texte alternatif, deux tailles, différée', () => {
    const html = renderToStaticMarkup(
      <PhotoLieu photo={photo} nom="Château de Bussy" categorie="patrimoine" format="carte" />,
    );
    expect(html).toContain('<svg');
    expect(html).toContain('alt="Château de Bussy"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain(photo.petite);
    expect(html).toContain(photo.grande);
    expect(html).not.toContain('CC BY-SA');
  });

  it('fiche lieu : la photo n’attend pas d’être vue (elle est en haut de l’écran)', () => {
    const html = renderToStaticMarkup(
      <PhotoLieu photo={photo} nom="Château de Bussy" categorie="patrimoine" format="fiche" />,
    );
    expect(html).toContain('loading="eager"');
  });

  it('limite : sans photo, l’icône seule, ni image ni bouton de crédit', () => {
    const html = renderToStaticMarkup(
      <PhotoLieu photo={null} nom="Croix" categorie="patrimoine" format="carte" />,
    );
    expect(html).toContain('<svg');
    expect(html).not.toContain('<img');
  });
});

describe('crédit', () => {
  it('ⓘ : un bouton nommé « Crédit de la photo »', () => {
    const html = renderToStaticMarkup(<BoutonCreditPhoto photo={photo} />);
    expect(html).toContain('<button');
    expect(html).toContain('aria-label="Crédit de la photo"');
  });

  it('ligne de la fiche : auteur, licence liée à son texte, source liée à la page du fichier', () => {
    const html = renderToStaticMarkup(<LigneCreditPhoto photo={photo} />);
    expect(html).toContain('Photo : Chau7');
    expect(html).toContain('href="https://creativecommons.org/licenses/by-sa/3.0"');
    expect(html).toContain('href="https://commons.wikimedia.org/wiki/File:A.jpg"');
  });

  it('limite : DATAtourisme, sans page ni lien de licence → texte seul, aucun lien vide', () => {
    const html = renderToStaticMarkup(
      <LigneCreditPhoto
        photo={{ ...photo, source: 'datatourisme_photos', licenceUrl: null, page: null }}
      />,
    );
    expect(html).toContain('DATAtourisme');
    expect(html).not.toContain('href=');
  });
});
