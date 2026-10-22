// Lecture d'un fichier précis dans un ZIP, en flux, sans tout décompresser (yauzl, D024).
// Utilisé par le GTFS (E03) et plus tard par les transports locaux (E07).
import type { Readable } from 'node:stream';
import yauzl from 'yauzl';

function ouvrirZip(chemin: string): Promise<yauzl.ZipFile> {
  return new Promise((resoudre, rejeter) => {
    yauzl.open(chemin, { lazyEntries: true }, (erreur, zip) =>
      erreur ? rejeter(erreur) : resoudre(zip),
    );
  });
}

/** Parcourt les entrées une à une ; `garder` renvoie true pour arrêter sur l'entrée courante. */
function parcourir(
  zip: yauzl.ZipFile,
  garder: (entree: yauzl.Entry) => boolean,
): Promise<yauzl.Entry | null> {
  return new Promise((resoudre, rejeter) => {
    zip.on('entry', (entree: yauzl.Entry) => (garder(entree) ? resoudre(entree) : zip.readEntry()));
    zip.on('end', () => resoudre(null));
    zip.on('error', rejeter);
    zip.readEntry();
  });
}

/** Noms des fichiers du ZIP (dossiers exclus). */
export async function listerZip(chemin: string): Promise<string[]> {
  const zip = await ouvrirZip(chemin);
  const noms: string[] = [];
  try {
    await parcourir(zip, (entree) => {
      if (!entree.fileName.endsWith('/')) noms.push(entree.fileName);
      return false;
    });
    return noms;
  } finally {
    zip.close();
  }
}

/** Flux du fichier `nom` du ZIP (à la racine) ; null s'il est absent (fichier GTFS facultatif). */
export async function ouvrirDansZip(chemin: string, nom: string): Promise<Readable | null> {
  const zip = await ouvrirZip(chemin);
  const entree = await parcourir(zip, (e) => e.fileName === nom).catch((erreur: unknown) => {
    zip.close();
    throw erreur;
  });
  if (!entree) {
    zip.close();
    return null;
  }
  const flux = await new Promise<Readable>((resoudre, rejeter) => {
    zip.openReadStream(entree, (erreur, f) => (erreur ? rejeter(erreur) : resoudre(f)));
  });
  // yauzl ne ferme réellement le fichier qu'à la fin du flux ouvert.
  zip.close();
  return flux;
}
