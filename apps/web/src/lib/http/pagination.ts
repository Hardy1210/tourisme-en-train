/** Numéro de la page suivante, ou null si `page` contient déjà les derniers éléments. */
export function pageSuivante(page: number, parPage: number, total: number): number | null {
  return page * parPage < total ? page + 1 : null;
}
