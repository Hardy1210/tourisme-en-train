import { describe, expect, it } from 'vitest';
import { rapportMarkdown, taille, type Rapport } from '../src/chargement/rapport';

const base: Rapport = {
  source: 'gares',
  date: '2026-10-22',
  heureS: 9 * 3600 + 5 * 60,
  statut: 'SUCCES',
  message: null,
  dureeS: 1.234,
  remarques: [],
};

describe('rapportMarkdown', () => {
  it('titre avec la date et l’heure de Paris, statut et durée', () => {
    const texte = rapportMarkdown(base);
    expect(texte).toContain('# Rapport ETL — gares — 2026-10-22 09:05 (Paris)');
    expect(texte).toContain('- **Statut :** SUCCES');
    expect(texte).toContain('- **Durée :** 1,2 s');
  });

  it('fichier : empreinte courte, taille lisible et origine', () => {
    const texte = rapportMarkdown({
      ...base,
      fichier: {
        nom: 'gares.csv',
        empreinte: 'f4b6a56ff6bb01ec0b07e8',
        taille: 264749,
        telecharge: false,
      },
    });
    expect(texte).toContain(
      'gares.csv, empreinte `f4b6a56ff6bb`, 258,5 Ko (hors ligne, déjà présent)',
    );
  });

  it('lignes écartées regroupées par raison, avec leurs numéros', () => {
    const rejets = Array.from({ length: 12 }, (_, i) => ({
      ligne: i + 2,
      raison: 'uic : invalide',
    }));
    const texte = rapportMarkdown({ ...base, lecture: { lues: 20, rejets }, chargees: 8 });
    expect(texte).toContain('lues 20 · valides 8 · chargées 8 · écartées 12');
    expect(texte).toContain('12 × uic : invalide (lignes 2, 3, 4, 5, 6, 7, 8, 9, 10, 11…)');
  });

  it('aucune ligne de rejet quand rien n’est écarté', () => {
    const texte = rapportMarkdown({ ...base, lecture: { lues: 5, rejets: [] }, chargees: 5 });
    expect(texte).toContain('écartées 0');
    expect(texte).not.toContain(' × ');
  });

  it('contrôles : ✅ réussi, ❌ bloquant en échec, ⚠️ avertissement', () => {
    const texte = rapportMarkdown({
      ...base,
      statut: 'ECHEC',
      message: 'Contrôle bloquant en échec',
      controles: [
        { nom: 'France', bloquant: true, reussi: true, detail: '2792 (minimum 2500)' },
        { nom: 'Région', bloquant: true, reussi: false, detail: '12 (minimum 100)' },
        { nom: 'Communes', bloquant: false, reussi: false, detail: '8 sans nom' },
      ],
    });
    expect(texte).toContain('  - ✅ France : 2792 (minimum 2500)');
    expect(texte).toContain('  - ❌ Région : 12 (minimum 100)');
    expect(texte).toContain('  - ⚠️ Communes : 8 sans nom (non bloquant)');
    expect(texte).toContain('- **Message :** Contrôle bloquant en échec');
  });
});

describe('taille', () => {
  it('octets, Ko puis Mo', () => {
    expect(taille(1023)).toBe('1 023 o');
    expect(taille(1024)).toBe('1 Ko');
    expect(taille(1024 ** 2)).toBe('1 Mo');
  });
});
