import type { Metadata } from 'next';
import '@fontsource-variable/source-serif-4';
import '@fontsource-variable/public-sans';
import { Larkspur } from '@/components/showcase/larkspur/larkspur';
export const metadata: Metadata = {
  title: { absolute: 'Larkspur — Private wealth website' },
  description: 'An original private wealth website with a living line-field hero, sticky growth story, portfolio donuts and an interactive planner.',
};
export default function LarkspurPage() {
  return <Larkspur />;
}
