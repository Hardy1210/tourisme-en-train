// Règle du type de train (docs/04-traitement-donnees.md § 4.2, D036) : le GTFS SNCF écrit le mode
// dans chaque `stop_id` (`StopPoint:OCE<mode>-<UIC>`) ; `route_type` et l'agence ne sont pas fiables.
// Seul endroit où cette règle est écrite : le SQL la reçoit en paramètres (`parametresSql`).
import type { TypeTrain } from '@tourisme/commun';

/** Modes reconnus et leur type. Un mode absent d'ici et des exclus devient `AUTRE` (compté). */
const TYPE_PAR_MODE: Readonly<Record<string, Exclude<TypeTrain, 'AUTRE'>>> = {
  'Train TER': 'TER',
  TramTrain: 'TER',
  'TGV INOUI': 'TGV',
  OUIGO: 'TGV',
  Lyria: 'TGV',
  ICE: 'TGV',
  INTERCITES: 'INTERCITES',
  'INTERCITES de nuit': 'INTERCITES',
};

/** Pas des trains : jamais chargés, comptés dans le rapport (la promesse est « y aller en train »). */
export const MODES_EXCLUS: readonly string[] = ['Car TER', 'Car à réservation', 'Navette'];

/** Type d'un mode ; null = mode exclu. */
export function typeDuMode(mode: string): TypeTrain | null {
  if (MODES_EXCLUS.includes(mode)) return null;
  return TYPE_PAR_MODE[mode] ?? 'AUTRE';
}

function modesDe(type: TypeTrain): string[] {
  return Object.entries(TYPE_PAR_MODE)
    .filter(([, t]) => t === type)
    .map(([mode]) => mode);
}

/** Listes passées à `transformations/gtfs.sql` ($-paramètres de type text[]). */
export function parametresSql(): {
  modesTer: string[];
  modesTgv: string[];
  modesIntercites: string[];
  modesExclus: string[];
} {
  return {
    modesTer: modesDe('TER'),
    modesTgv: modesDe('TGV'),
    modesIntercites: modesDe('INTERCITES'),
    modesExclus: [...MODES_EXCLUS],
  };
}
