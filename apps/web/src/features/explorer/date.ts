// Choix de la date de la sortie : libellés et options, à partir de la date du jour reçue en paramètre.
import { debutDuWeekEnd } from '@/lib/dates/week-end';
import { decalerJours, libelleCourt } from '@/lib/dates/calendrier';

export type OptionDate = {
  cle: 'aujourdhui' | 'demain' | 'weekend';
  libelle: string;
  detail: string;
  date: string | null;
};

export function optionsDate(dateDuJour: string): OptionDate[] {
  const demain = decalerJours(dateDuJour, 1);
  const samedi = debutDuWeekEnd(dateDuJour);
  const dimanche = decalerJours(samedi, 1);
  // Un dimanche, le week-end se réduit à ce jour-là.
  const estDimanche = new Date(`${samedi}T12:00:00Z`).getUTCDay() === 0;
  return [
    { cle: 'aujourdhui', libelle: "Aujourd'hui", detail: libelleCourt(dateDuJour), date: null },
    { cle: 'demain', libelle: 'Demain', detail: libelleCourt(demain), date: demain },
    {
      cle: 'weekend',
      libelle: 'Ce week-end',
      detail: estDimanche
        ? libelleCourt(samedi)
        : `${libelleCourt(samedi)} – ${libelleCourt(dimanche).toLowerCase()}`,
      date: samedi,
    },
  ];
}

/** Libellé de la puce : le nom de l'option si la date en est une, sinon la date. */
export function libelleDate(date: string | null, dateDuJour: string): string {
  if (date === null || date === dateDuJour) return "Aujourd'hui";
  const option = optionsDate(dateDuJour).find((o) => o.date === date);
  return option ? option.libelle : libelleCourt(date);
}

const minuscule = (texte: string) => texte.charAt(0).toLowerCase() + texte.slice(1);

/** « Sam. 21 nov. » → « 21 nov. » : le jour de la semaine en moins. */
const sansJour = (texte: string) => texte.slice(texte.indexOf(' ') + 1);

/**
 * Détail court de « Ce week-end » (`samedi` : le premier jour du week-end, ou le dimanche s'il ne reste que
 * lui) : « 21 – 22 nov. », « 31 oct. – 1er nov. », ou « 22 nov. » un dimanche.
 */
export function detailCourtWeekEnd(samedi: string): string {
  if (new Date(`${samedi}T12:00:00Z`).getUTCDay() === 0) return sansJour(libelleCourt(samedi));
  const debut = sansJour(libelleCourt(samedi));
  const fin = sansJour(libelleCourt(decalerJours(samedi, 1)));
  const [jourDebut, ...moisDebut] = debut.split(' ');
  const memeMois = moisDebut.join(' ') === fin.split(' ').slice(1).join(' ');
  return `${memeMois ? jourDebut : debut} – ${fin}`;
}

/**
 * 3ᵉ ligne de la page « Trajet » (D116) : « Aujourd'hui · sam. 21 nov. », « Demain · dim. 22 nov. » ; une
 * date du calendrier se suffit à elle-même (« Mer. 25 nov. »).
 */
export function ligneDate(
  date: string | null,
  dateDuJour: string,
): { libelle: string; detail: string | null } {
  if (date === null || date === dateDuJour) {
    return { libelle: "Aujourd'hui", detail: minuscule(libelleCourt(dateDuJour)) };
  }
  const option = optionsDate(dateDuJour).find((o) => o.date === date);
  return option
    ? { libelle: option.libelle, detail: minuscule(option.detail) }
    : { libelle: libelleCourt(date), detail: null };
}

/** Une date autre qu'aujourd'hui est choisie : pastille, compteur de « Filtres », fin des titres. */
export function dateChoisie(date: string | null, dateDuJour: string): boolean {
  return date !== null && date !== dateDuJour;
}

/** Fin des titres de liste : « · demain », « · ce week-end », « · sam. 14 nov. » ; rien aujourd'hui. */
export function suffixeDate(date: string | null, dateDuJour: string): string {
  return dateChoisie(date, dateDuJour) ? ` · ${libelleDate(date, dateDuJour).toLowerCase()}` : '';
}

/** Samedi et dimanche du week-end affiché si `date` en fait partie ; null sinon, ou un dimanche (il ne reste qu'un jour). */
export function joursDuWeekEnd(
  date: string | null,
  dateDuJour: string,
): { samedi: string; dimanche: string } | null {
  const samedi = debutDuWeekEnd(dateDuJour);
  if (new Date(`${samedi}T12:00:00Z`).getUTCDay() === 0) return null;
  const dimanche = decalerJours(samedi, 1);
  return date === samedi || date === dimanche ? { samedi, dimanche } : null;
}
