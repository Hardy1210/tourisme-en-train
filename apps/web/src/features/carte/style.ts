// Couleurs du fond de carte, tirées des tokens --map-* (docs/06-interface.md § 6) : fonction pure.
export type CouleursCarte = {
  land: string;
  road: string;
  water: string;
  green: string;
  route: string;
  texte: string;
  /** Étiquettes de nos destinations. */
  texteFort: string;
  halo: string;
};

export type Couche = {
  id: string;
  type: string;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
};

const masquer = (couche: Couche): Couche => ({
  ...couche,
  layout: { ...couche.layout, visibility: 'none' },
});
const peindre = (couche: Couche, paint: Record<string, unknown>): Couche => ({
  ...couche,
  paint: { ...couche.paint, ...paint },
});

function colorierCouche(couche: Couche, c: CouleursCarte): Couche {
  const { id, type } = couche;
  if (type === 'background') return peindre(couche, { 'background-color': c.land });
  if (type === 'symbol') {
    // Seuls les noms de lieux restent : la carte montre nos épingles, pas celles du fond.
    return /^label_/.test(id)
      ? peindre(couche, { 'text-color': c.texte, 'text-halo-color': c.halo })
      : masquer(couche);
  }
  if (type === 'fill') {
    if (id === 'water') return peindre(couche, { 'fill-color': c.water });
    if (/^(park|landcover_wood|landcover_grass)$/.test(id)) {
      return peindre(couche, {
        'fill-color': c.green,
        'fill-outline-color': c.green,
        'fill-opacity': 1,
      });
    }
    return masquer(couche);
  }
  if (type === 'line') {
    if (/^waterway_(river|other)$/.test(id)) return peindre(couche, { 'line-color': c.water });
    if (/^(road|bridge)_/.test(id) && !/casing|rail|hatching|pattern/.test(id)) {
      return peindre(couche, { 'line-color': c.road });
    }
    return masquer(couche);
  }
  return masquer(couche);
}

type StyleEntree = { layers: readonly Couche[]; sources?: Record<string, Record<string, unknown>> };

/** Couches aux couleurs des tokens ; l'attribution des sources est retirée, la nôtre (sources.json) la remplace. */
export function colorierStyle<S extends StyleEntree>(style: S, couleurs: CouleursCarte): S {
  const sources = Object.fromEntries(
    Object.entries(style.sources ?? {}).map(([nom, source]) => [
      nom,
      Object.fromEntries(Object.entries(source).filter(([cle]) => cle !== 'attribution')),
    ]),
  );
  return {
    ...style,
    sources,
    layers: style.layers.map((couche) => colorierCouche(couche, couleurs)),
  };
}
