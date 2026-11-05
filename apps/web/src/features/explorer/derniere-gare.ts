// Dernière gare de départ, pour rouvrir l'application hors ligne (D071). Sur l'appareil seulement, et
// jamais la position de l'utilisateur (règle 5) : le code et les coordonnées de la gare, rien d'autre.
import { z } from 'zod';

const CLE = 'wagoo-derniere-gare';

const schemaDerniereGare = z.object({
  uic: z.string(),
  nom: z.string(),
  commune: z.string().nullable(),
  lat: z.number(),
  lon: z.number(),
});

export type DerniereGare = z.infer<typeof schemaDerniereGare>;

export function lireDerniereGare(): DerniereGare | null {
  try {
    const texte = localStorage.getItem(CLE);
    return texte === null ? null : schemaDerniereGare.parse(JSON.parse(texte));
  } catch {
    return null;
  }
}

/** Seuls les champs ci-dessous sont écrits, quoi que contienne `gare`. */
export function ecrireDerniereGare(gare: DerniereGare): void {
  try {
    const { uic, nom, commune, lat, lon } = gare;
    localStorage.setItem(CLE, JSON.stringify({ uic, nom, commune, lat, lon }));
  } catch {
    // Stockage refusé (navigation privée) : l'application marche sans, seul le hors-ligne en pâtit.
  }
}
