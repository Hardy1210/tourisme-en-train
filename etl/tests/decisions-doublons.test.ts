import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { FICHIER_DECISIONS, lireDecisions } from '../src/chargement/decisions-doublons';
import { fileURLToPath } from 'node:url';

const ENTETE =
  'source_garde;id_garde;nom_garde;source_doublon;id_doublon;nom_doublon;distance_m;similarite;decision';

async function fichier(lignes: string[]): Promise<string> {
  const chemin = path.join(await mkdtemp(path.join(tmpdir(), 'decisions-')), 'd.csv');
  await writeFile(chemin, ['# commentaire', ENTETE, ...lignes].join('\n') + '\n');
  return chemin;
}

describe('lireDecisions (regles/doublons_manuels.csv, D044)', () => {
  it('le fichier du dépôt est lisible', async () => {
    expect((await lireDecisions(fileURLToPath(FICHIER_DECISIONS))).rejets).toEqual([]);
  });

  it('« oui » et « non » gardés ; décision vide ignorée ; nom avec point-virgule entre guillemets', async () => {
    const lues = await lireDecisions(
      await fichier([
        'datatourisme;"https://data.datatourisme.fr/1";"Parc; Buffon";datatourisme;"https://data.datatourisme.fr/2";"Musée";131;0.4;oui',
        'datatourisme;"x";"A";osm;"way/1";"B";10;0.55;non',
        'datatourisme;"y";"C";osm;"way/2";"D";10;0.55;',
      ]),
    );
    expect(lues.rejets).toEqual([]);
    expect(lues.decisions.map((d) => [d.id_garde, d.decision])).toEqual([
      ['https://data.datatourisme.fr/1', 'oui'],
      ['x', 'non'],
    ]);
  });

  it('décision mal écrite (« Oui! ») : ligne rejetée', async () => {
    const lues = await lireDecisions(await fichier(['osm;"a";"A";osm;"b";"B";1;1;Oui!']));
    expect(lues.decisions).toEqual([]);
    expect(lues.rejets).toHaveLength(1);
  });
});
