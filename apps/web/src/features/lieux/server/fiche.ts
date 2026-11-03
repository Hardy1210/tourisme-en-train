// Lieux à pied d'une gare et fiche d'un lieu (docs/05-api.md § 3.6, § 3.7, D052).
import 'server-only';

import { parametres } from '@/config/parametres';
import { gareParUic } from '@/lib/db/requetes-partagees';
import { Introuvable } from '@/lib/http/erreurs';

import type { FicheLieu, ParametresLieuxGare, ReponseAutour } from '../schemas';

import { garesDuLieu, type LieuBrut, lieuParCle, lieuParId, lieuxDeLaGare } from './requetes-fiche';

export async function lieuxAPiedDeLaGare(
  uic: string,
  { categories, rayon }: ParametresLieuxGare,
): Promise<ReponseAutour> {
  const gare = await gareParUic(uic);
  if (gare === null) throw new Introuvable('Cette gare est inconnue.');
  const lignes = await lieuxDeLaGare({
    gareId: gare.id,
    rayonM: rayon,
    categories,
    limite: parametres.limites.lieux,
  });
  return {
    lieux: lignes.map((l) => ({
      cle: l.cle,
      nom: l.nom,
      categorie: l.categorie,
      sousCategorie: l.sous_categorie,
      distanceM: l.distance_m,
      dureeMarcheMin: l.duree_marche_min,
      imageUrl: l.image_url,
      qualiteTourisme: l.qualite_tourisme,
      source: l.source,
      lat: l.lat,
      lon: l.lon,
    })),
    total: lignes[0]?.total ?? 0,
  };
}

/** Doublon → lieu gardé ; membre d'un site → représentant. Borné : une chaîne ne boucle jamais. */
const SAUTS_MAX = 3;

export async function ficheLieu(cle: string): Promise<FicheLieu> {
  let lieu: LieuBrut | null = await lieuParCle(cle);
  if (lieu === null) throw new Introuvable('Ce lieu est introuvable.');
  for (let saut = 0; saut < SAUTS_MAX; saut += 1) {
    const suivant: number | null = lieu.doublon_de ?? lieu.site_de;
    if (suivant === null) break;
    const cible: LieuBrut | null = await lieuParId(suivant);
    if (cible === null) break;
    lieu = cible;
  }
  const gares = await garesDuLieu(lieu.id);
  return {
    cle: lieu.cle,
    demande: lieu.cle === cle ? null : cle,
    nom: lieu.nom,
    categorie: lieu.categorie,
    sousCategorie: lieu.sous_categorie,
    description: lieu.description,
    adresse: lieu.adresse,
    commune: lieu.commune,
    url: lieu.url,
    imageUrl: lieu.image_url,
    horaires: lieu.horaires,
    periode: lieu.periode,
    qualiteTourisme: lieu.qualite_tourisme,
    source: lieu.source,
    attribution: lieu.attribution,
    lat: lieu.lat,
    lon: lieu.lon,
    garesProches: gares.map((g) => ({
      uic: g.uic,
      nom: g.nom,
      distanceM: g.distance_m,
      dureeMarcheMin: g.duree_marche_min,
    })),
  };
}
