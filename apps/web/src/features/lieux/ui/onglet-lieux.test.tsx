// Balisage de l'onglet Lieux de la fiche destination (maquette du 18/11) : une carte par lieu, le lien
// sur la vignette et le texte, un bouton rond nommé pour la carte, les premiers lieux de chaque
// catégorie seulement. Le dépliage et la mini-carte se vérifient dans le navigateur (destination.e2e.ts).
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { parametres } from '@/config/parametres';
import type { LieuResume } from '../schemas';
import { OngletLieux } from './onglet-lieux';

const lieu = (n: number, reste: Partial<LieuResume> = {}): LieuResume => ({
  cle: `osm-node-${n}`,
  nom: `Lieu ${n}`,
  categorie: 'patrimoine',
  sousCategorie: 'château',
  distanceM: 500 + n,
  dureeMarcheMin: 7,
  photo: null,
  qualiteTourisme: false,
  source: 'osm',
  lat: 47,
  lon: 4.8,
  ...reste,
});

const rendre = (lieux: LieuResume[]) =>
  renderToStaticMarkup(
    <OngletLieux
      lieuxCharges
      lieux={lieux}
      chargement={false}
      erreur={false}
      surReessai={() => undefined}
      surTrains={() => undefined}
      lienDe={(cle) => `/lieux/${cle}`}
      surCarte={() => undefined}
      carte={null}
    />,
  );

const { lieuxParCategorie } = parametres.limites;

describe('OngletLieux', () => {
  it('une carte par lieu : lien vers la fiche, bouton rond nommé pour la carte, sans chevron', () => {
    const html = rendre([lieu(1, { nom: 'Château de Beaune' })]);
    expect(html).toContain('href="/lieux/osm-node-1"');
    expect(html).toContain('aria-label="Voir Château de Beaune sur la carte"');
    expect(html).not.toContain('Voir sur la carte');
    expect(html).not.toContain('lucide-chevron-right');
    expect(html).toContain('château');
  });

  it('la sous-catégorie qui répète le nom est cachée', () => {
    const html = rendre([lieu(1, { nom: 'Aire de jeux', sousCategorie: 'aire de jeux' })]);
    expect(html).not.toContain('aire de jeux');
  });

  it('le badge Qualité Tourisme reste', () => {
    expect(rendre([lieu(1, { qualiteTourisme: true })])).toContain('Qualité Tourisme');
  });

  it('au-delà du maximum par catégorie, les premiers lieux puis « Voir l’autre »', () => {
    const lieux = Array.from({ length: lieuxParCategorie + 1 }, (_, i) => lieu(i + 1));
    const html = rendre(lieux);
    expect(html.match(/href="\/lieux\//g)).toHaveLength(lieuxParCategorie);
    expect(html).toContain('Voir l&#x27;autre');
  });

  it('limite : exactement le maximum, tous les lieux et aucun bouton à déplier', () => {
    const lieux = Array.from({ length: lieuxParCategorie }, (_, i) => lieu(i + 1));
    const html = rendre(lieux);
    expect(html.match(/href="\/lieux\//g)).toHaveLength(lieuxParCategorie);
    expect(html).not.toContain('Voir l');
  });
});
