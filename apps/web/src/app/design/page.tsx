// Planche des composants : en développement uniquement (fiche E10).
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Planche } from './planche';

export const metadata: Metadata = { title: 'Planche', robots: { index: false } };

type Proprietes = { searchParams: Promise<{ sombre?: string }> };

export default async function PagePlanche({ searchParams }: Proprietes) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { sombre } = await searchParams;
  return <Planche sombreAuDepart={sombre === '1'} />;
}
