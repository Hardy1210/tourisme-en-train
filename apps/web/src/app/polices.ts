// Chargement des polices. Leur rôle et leur usage se règlent dans styles/globals.css (section 1).
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from 'next/font/google';

const titres = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--police-titres',
  display: 'swap',
});
const texte = Inter({ subsets: ['latin'], variable: '--police-texte', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--police-mono', display: 'swap' });

export const classesPolices = `${titres.variable} ${texte.variable} ${mono.variable}`;
