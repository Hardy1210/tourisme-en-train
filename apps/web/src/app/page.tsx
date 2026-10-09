// Page d'accueil provisoire (E00) : remplacée par l'écran Explorer en E11.
import { marque } from '@/config/marque';

export default function Accueil() {
  return (
    <main>
      <h1>{marque.nom}</h1>
      <p>{marque.slogan}</p>
      <p>En construction.</p>
    </main>
  );
}
