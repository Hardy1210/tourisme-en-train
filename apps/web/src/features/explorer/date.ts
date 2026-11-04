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
