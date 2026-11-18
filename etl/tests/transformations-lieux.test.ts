import { describe, expect, it } from 'vitest';
import {
  entitesInconnues,
  nettoyerDescription,
  normaliserNom,
  texteOuNull,
  urlValide,
} from '../src/transformations/lieux';

describe('nettoyerDescription', () => {
  it('retire le HTML et décode les entités', () => {
    expect(nettoyerDescription('<p>Jardin &amp; mus&#233;e<br/>du XVIIᵉ</p>', 500)).toBe(
      'Jardin & musée du XVIIᵉ',
    );
  });
  it('garde un texte de exactement `max` caractères', () => {
    const texte = 'a'.repeat(20);
    expect(nettoyerDescription(texte, 20)).toBe(texte);
  });
  it('coupe au mot près au-delà de `max`, avec des points de suspension', () => {
    const coupe = nettoyerDescription('Un château fort, remparts et donjon du XIIᵉ siècle', 30);
    expect(coupe).toBe('Un château fort, remparts et…');
    expect(coupe?.length).toBeLessThanOrEqual(30);
  });
  it('vide ou absent → null', () => {
    expect(nettoyerDescription('  <br>  ', 500)).toBeNull();
    expect(nettoyerDescription(undefined, 500)).toBeNull();
  });
});

describe('nettoyerDescription : entités HTML (D105)', () => {
  it('décode les entités hexadécimales et les entités nommées courantes en français', () => {
    expect(
      nettoyerDescription(
        '&#xE9;t&eacute; &laquo;&nbsp;caf&eacute;&nbsp;&raquo; l&rsquo;&oelig;uvre&hellip; 5&nbsp;&euro;, 20&deg;, &agrave; &ccedil;a &ndash; &egrave;',
        2000,
      ),
    ).toBe('été « café » l’œuvre… 5 €, 20°, à ça – è');
  });
  it('limite : une entité inconnue reste telle quelle, jamais effacée', () => {
    expect(nettoyerDescription('&zzz; et &amp; &#x27;', 2000)).toBe("&zzz; et & '");
  });
  it('entitesInconnues : liste celles qu’on ne sait pas décoder, pour le rapport', () => {
    expect(entitesInconnues('a &zzz; b &eacute; &#233; &yyy; &zzz;')).toEqual(['&zzz;', '&yyy;', '&zzz;']);
    expect(entitesInconnues('rien à signaler &amp;')).toEqual([]);
  });
});

describe('nettoyerDescription : paragraphes (D105)', () => {
  it('garde les paragraphes : lignes vides multiples réduites à un seul saut, espaces en trop retirés', () => {
    expect(
      nettoyerDescription(
        'Premier paragraphe.\r\n\r\n\r\n   Deuxième   ligne  \nsuite\n \n\t\n\nFin.',
        2000,
      ),
    ).toBe('Premier paragraphe.\n\nDeuxième ligne\nsuite\n\nFin.');
  });
  it('HTML : `<br>` devient un retour à la ligne, `</p>` un paragraphe', () => {
    expect(nettoyerDescription('<p>Un</p><p>Deux<br/>trois</p>', 2000)).toBe('Un\n\nDeux\ntrois');
  });
  it('limite : une seule ligne reste une seule ligne', () => {
    expect(nettoyerDescription('  Jardin   botanique  ', 2000)).toBe('Jardin botanique');
  });
});

describe('nettoyerDescription : coupe à une fin de phrase (D105)', () => {
  const suite = ' Suite du texte qui dépasse largement la limite permise ici.';
  it('coupe après la dernière phrase entière si elle garde au moins 80 % de la longueur permise', () => {
    const texte = `${'a'.repeat(79)}.${suite}`;
    expect(nettoyerDescription(texte, 100)).toBe(`${'a'.repeat(79)}. …`);
  });
  it('limite : en dessous de 80 %, coupe au mot près', () => {
    const texte = `${'a'.repeat(78)}.${suite}`;
    const coupe = nettoyerDescription(texte, 100) ?? '';
    expect(coupe.endsWith('…')).toBe(true);
    expect(coupe.endsWith('. …')).toBe(false);
    expect(coupe.length).toBeLessThanOrEqual(100);
    expect(coupe.startsWith(`${'a'.repeat(78)}. Suite du`)).toBe(true);
  });
  it('une phrase entière au-delà de 80 % : la coupe en fin de phrase l’emporte sur le mot', () => {
    const texte = 'Le château domine la vallée de la Saône depuis 1200. Ses jardins sont ouverts.';
    expect(nettoyerDescription(texte, 60)).toBe('Le château domine la vallée de la Saône depuis 1200. …');
  });
  it('« ! », « ? » et « … » terminent aussi une phrase', () => {
    expect(nettoyerDescription(`${'b'.repeat(80)} !${suite}`, 100)).toBe(`${'b'.repeat(80)} ! …`);
    expect(nettoyerDescription(`${'c'.repeat(80)}?${suite}`, 100)).toBe(`${'c'.repeat(80)}? …`);
  });
  it('limite : un texte de exactement la longueur permise n’est pas coupé', () => {
    const texte = `${'d'.repeat(98)}.\n`;
    expect(nettoyerDescription(texte, 99)).toBe(`${'d'.repeat(98)}.`);
  });
});

describe('normaliserNom', () => {
  it('remet en casse normale un nom tout en majuscules', () => {
    expect(normaliserNom('CHÂTEAU DE BUSSY-RABUTIN')).toBe('Château de Bussy-Rabutin');
    expect(normaliserNom("LA MAISON D'ARTAGNAN")).toBe("La Maison d'Artagnan");
  });
  it('laisse tel quel un nom qui a déjà des minuscules', () => {
    expect(normaliserNom('Musée des Beaux-Arts de Dijon')).toBe('Musée des Beaux-Arts de Dijon');
    expect(normaliserNom('MuséoParc Alésia')).toBe('MuséoParc Alésia');
  });
  it('normalise les espaces', () => {
    expect(normaliserNom('  Lac   des Settons ')).toBe('Lac des Settons');
  });
});

describe('urlValide', () => {
  it('accepte http et https', () => {
    expect(urlValide('https://www.beaune-tourisme.fr')).toBe('https://www.beaune-tourisme.fr/');
    expect(urlValide(' http://example.org/a ')).toBe('http://example.org/a');
  });
  it('refuse un texte qui n’est pas une adresse web', () => {
    expect(urlValide('www.sans-protocole.fr')).toBeNull();
    expect(urlValide('mailto:contact@example.org')).toBeNull();
    expect(urlValide('')).toBeNull();
  });
});

describe('texteOuNull', () => {
  it('espaces seuls → null ; sinon texte normalisé', () => {
    expect(texteOuNull(' \n\t ')).toBeNull();
    expect(texteOuNull('a \n b')).toBe('a b');
  });
});
