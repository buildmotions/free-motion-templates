import type { Metadata } from 'next';
import '@fontsource/instrument-serif';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/instrument-sans';
import { Ledgerline } from '@/components/showcase/ledgerline/ledgerline';
export const metadata: Metadata = {
  title: { absolute: 'Ledgerline — Pricing' },
  description:
    'An original pricing section for a fictional finance close tool: billing toggle, team-size slider, recommended plan and a comparison table.',
};
export default function LedgerlinePage() {
  return <Ledgerline />;
}
