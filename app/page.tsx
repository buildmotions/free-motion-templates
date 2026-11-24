import Link from 'next/link';

const templates = [
  { href: '/larkspur', name: 'Larkspur', text: 'A private-wealth website in coded motion: rising lines, a sticky story, morphing charts and a planner.' },
  { href: '/ledgerline', name: 'Ledgerline', text: 'A SaaS pricing section with a billing toggle, a team-size slider and a plan that follows your team size.' },
  { href: '/polarveil', name: 'Polar Veil', text: 'A WebGL aurora background that loops without a seam and pauses when off screen.' },
];

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 20px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 36, marginBottom: 12 }}>Free motion templates</h1>
      <p style={{ marginBottom: 28 }}>
        Three free templates from <a href="https://buildmotions.com" style={{ textDecoration: 'underline' }}>BuildMotions</a>, the library of animated website templates with AI prompts and source code.
      </p>
      <ul style={{ display: 'grid', gap: 16 }}>
        {templates.map((t) => (
          <li key={t.href}>
            <Link href={t.href} style={{ fontWeight: 600, textDecoration: 'underline' }}>{t.name}</Link>
            <p>{t.text}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
