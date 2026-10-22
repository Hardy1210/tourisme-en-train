// Rapport Markdown d'une exécution (docs/04-traitement-donnees.md § 5), écrit dans
// <DOSSIER_DONNEES>/traite/rapports/AAAA-MM-JJ_<source>.md. Relancé le même jour : remplacé.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ResultatControle } from '../controles/base';
import type { BilanLecture } from './base';

export type Statut = 'SUCCES' | 'ECHEC' | 'IGNORE';

/** Rempli au fil du traitement : un échec en cours de route garde ce qui était déjà connu. */
export interface Suivi {
  fichier?: { nom: string; empreinte: string; taille: number; telecharge: boolean };
  lecture?: BilanLecture;
  chargees?: number;
  controles?: ResultatControle[];
  /** Constats propres à la source (ex. « 8 gares sans nom de commune »). */
  remarques: string[];
}

export interface Rapport extends Suivi {
  source: string;
  /** AAAA-MM-JJ, à Paris. */
  date: string;
  /** Secondes depuis minuit, à Paris. */
  heureS: number;
  statut: Statut;
  message: string | null;
  dureeS: number;
}

/** Nombre de numéros de ligne cités par raison de rejet (le total reste exact). */
const EXEMPLES_PAR_RAISON = 10;

const nombre = (n: number): string => n.toLocaleString('fr-FR');

function heure(secondes: number): string {
  const h = Math.floor(secondes / 3600);
  const m = Math.floor((secondes % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function taille(octets: number): string {
  if (octets < 1024) return `${nombre(octets)} o`;
  if (octets < 1024 ** 2)
    return `${(octets / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Ko`;
  return `${(octets / 1024 ** 2).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
}

function lignesRejets(lecture: BilanLecture): string[] {
  const parRaison = new Map<string, number[]>();
  for (const { ligne, raison } of lecture.rejets) {
    parRaison.set(raison, [...(parRaison.get(raison) ?? []), ligne]);
  }
  return [...parRaison].map(([raison, lignes]) => {
    const exemples = lignes.slice(0, EXEMPLES_PAR_RAISON).join(', ');
    const suite = lignes.length > EXEMPLES_PAR_RAISON ? '…' : '';
    return `  - ${nombre(lignes.length)} × ${raison} (lignes ${exemples}${suite})`;
  });
}

export function rapportMarkdown(r: Rapport): string {
  const lignes = [
    `# Rapport ETL — ${r.source} — ${r.date} ${heure(r.heureS)} (Paris)`,
    '',
    `- **Statut :** ${r.statut}`,
  ];
  if (r.message) lignes.push(`- **Message :** ${r.message}`);
  if (r.fichier) {
    const origine = r.fichier.telecharge ? 'téléchargé' : 'hors ligne, déjà présent';
    lignes.push(
      `- **Fichier :** ${r.fichier.nom}, empreinte \`${r.fichier.empreinte.slice(0, 12)}\`, ` +
        `${taille(r.fichier.taille)} (${origine})`,
    );
  }
  if (r.lecture) {
    const { lues, rejets } = r.lecture;
    const chargees = r.chargees === undefined ? '—' : nombre(r.chargees);
    lignes.push(
      `- **Lignes :** lues ${nombre(lues)} · valides ${nombre(lues - rejets.length)} · ` +
        `chargées ${chargees} · écartées ${nombre(rejets.length)}`,
      ...lignesRejets(r.lecture),
    );
  }
  if (r.controles?.length) {
    lignes.push('- **Contrôles :**');
    for (const c of r.controles) {
      const marque = c.reussi ? '✅' : c.bloquant ? '❌' : '⚠️';
      lignes.push(`  - ${marque} ${c.nom} : ${c.detail}${c.bloquant ? '' : ' (non bloquant)'}`);
    }
  }
  if (r.remarques.length) lignes.push('- **Remarques :**', ...r.remarques.map((t) => `  - ${t}`));
  lignes.push(
    `- **Durée :** ${r.dureeS.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s`,
    '',
  );
  return lignes.join('\n');
}

/** Écrit le rapport et renvoie son chemin. */
export async function enregistrerRapport(dossierDonnees: string, r: Rapport): Promise<string> {
  const dossier = path.join(dossierDonnees, 'traite', 'rapports');
  await mkdir(dossier, { recursive: true });
  const chemin = path.join(dossier, `${r.date}_${r.source}.md`);
  await writeFile(chemin, rapportMarkdown(r));
  return chemin;
}
