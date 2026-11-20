// Date du jour gardée à jour sur un écran ouvert (D108) : à minuit (Paris) et au retour au premier plan.
// Horloge simulée de Vitest ; un faux document à la place de celui du navigateur.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { suivreDateDuJour } from './utiliser-date-du-jour';

class FauxDocument extends EventTarget {
  visibilityState: DocumentVisibilityState = 'visible';
  revenir(etat: DocumentVisibilityState) {
    this.visibilityState = etat;
    this.dispatchEvent(new Event('visibilitychange'));
  }
}

let doc: FauxDocument;
let dates: string[];
let arreter: () => void;

function suivreA(instant: string) {
  vi.setSystemTime(new Date(instant));
  arreter = suivreDateDuJour((d) => dates.push(d), doc);
}

beforeEach(() => {
  vi.useFakeTimers();
  doc = new FauxDocument();
  dates = [];
});
afterEach(() => {
  arreter();
  vi.useRealTimers();
});

describe('suivreDateDuJour', () => {
  it('donne la date de Paris tout de suite, même quand UTC est encore la veille', () => {
    suivreA('2026-11-19T23:30:00Z'); // 00 h 30 à Paris (hiver, UTC+1)
    expect(dates).toEqual(['2026-11-20']);
  });

  it('hiver : passe au lendemain juste après minuit à Paris…', () => {
    suivreA('2026-11-19T22:59:30Z'); // 23 h 59 min 30 s à Paris
    vi.advanceTimersByTime(31_000);
    expect(dates).toEqual(['2026-11-19', '2026-11-20']);
  });

  it('… et pas avant (limite : 29 s plus tard, toujours la veille)', () => {
    suivreA('2026-11-19T22:59:30Z');
    vi.advanceTimersByTime(29_000);
    expect(dates).toEqual(['2026-11-19']);
  });

  it('été : minuit à Paris est 22 h UTC', () => {
    suivreA('2026-07-14T21:59:30Z'); // 23 h 59 min 30 s à Paris (UTC+2)
    vi.advanceTimersByTime(31_000);
    expect(dates).toEqual(['2026-07-14', '2026-07-15']);
  });

  it('continue les jours suivants', () => {
    suivreA('2026-11-19T22:59:30Z');
    vi.advanceTimersByTime(31_000 + 86_400_000);
    expect(dates).toEqual(['2026-11-19', '2026-11-20', '2026-11-21']);
  });

  it('app rouverte le lendemain (téléphone en veille, minuteur pas déclenché) : nouvelle date', () => {
    suivreA('2026-11-19T20:00:00Z');
    vi.setSystemTime(new Date('2026-11-20T08:00:00Z')); // l'heure avance, sans minuteur
    doc.revenir('visible');
    expect(dates).toEqual(['2026-11-19', '2026-11-20']);
  });

  it('limite : passer en arrière-plan ne recalcule rien', () => {
    suivreA('2026-11-19T20:00:00Z');
    vi.setSystemTime(new Date('2026-11-20T08:00:00Z'));
    doc.revenir('hidden');
    expect(dates).toEqual(['2026-11-19']);
  });

  it('après l’arrêt : plus de minuteur ni d’écoute', () => {
    suivreA('2026-11-19T22:59:30Z');
    arreter();
    vi.advanceTimersByTime(31_000);
    doc.revenir('visible');
    expect(dates).toEqual(['2026-11-19']);
  });
});
