import { EcranLieu } from '@/features/lieux/ui/ecran-lieu';

type Proprietes = {
  params: Promise<{ cle: string }>;
  searchParams: Promise<{ depuis?: string; date?: string }>;
};

export default async function PageLieu({ params, searchParams }: Proprietes) {
  const { cle } = await params;
  const { depuis, date } = await searchParams;
  return (
    <EcranLieu
      cle={decodeURIComponent(cle)}
      trajet={depuis ? { depuis, date: date ?? null } : null}
    />
  );
}
