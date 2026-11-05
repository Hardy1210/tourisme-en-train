// Service worker servi par Next.js (D029, D071). Les deux écrans principaux sont disponibles hors ligne dès l'installation.
import { randomUUID } from 'node:crypto';
import { createSerwistRoute } from '@serwist/turbopack';

const revision = randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute(
  {
    swSrc: 'src/app/sw.ts',
    useNativeEsbuild: true,
    additionalPrecacheEntries: [
      { url: '/', revision },
      { url: '/lieux', revision },
    ],
  },
);
