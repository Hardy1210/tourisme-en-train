import { describe, expect, it } from 'vitest';
import {
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
