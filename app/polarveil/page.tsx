import type { Metadata } from 'next';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/josefin-sans';
import { Polarveil } from '@/components/showcase/polarveil/polarveil';
export const metadata: Metadata = {
  title: { absolute: 'Polarveil — Animated shader background' },
  description: 'An original full-screen WebGL shader background. Curtains of green and violet light hang across a starry polar sky, with fine vertical rays rippling along their folds.',
};
export default function PolarveilPage() {
  return <Polarveil />;
}
