export const profiles = {
  Preserve: { rates: [0.02, 0.04, 0.055], mix: [{ name: 'Bonds', share: 55 }, { name: 'Global equity', share: 25 }, { name: 'Real assets', share: 10 }, { name: 'Cash', share: 10 }] },
  Balance: { rates: [0.03, 0.055, 0.075], mix: [{ name: 'Global equity', share: 50 }, { name: 'Bonds', share: 30 }, { name: 'Real assets', share: 15 }, { name: 'Cash', share: 5 }] },
  Grow: { rates: [0.035, 0.07, 0.095], mix: [{ name: 'Global equity', share: 72 }, { name: 'Private markets', share: 13 }, { name: 'Bonds', share: 10 }, { name: 'Cash', share: 5 }] },
} as const;
export type Profile = keyof typeof profiles;

export const mixColors = ['#5560d8', '#b9774a', '#8aa58b', '#c9c3b6'];

// Year-by-year value with monthly contributions compounded monthly at an annual rate.
export function project(initial: number, monthly: number, years: number, rate: number) {
  const r = rate / 12;
  const values = [initial];
  let value = initial;
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) value = value * (1 + r) + monthly;
    values.push(Math.round(value));
  }
  return values;
}

export const contributed = (initial: number, monthly: number, years: number) => initial + monthly * 12 * years;

// Donut arcs as [start, end] fractions for a mix.
export function arcs(mix: readonly { share: number }[]) {
  let start = 0;
  return mix.map((m) => {
    const arc = { start, end: start + m.share / 100 };
    start = arc.end;
    return arc;
  });
}

export const compact = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;

// A smooth pseudo-noise angle field for the hero lines, deterministic for a given time.
export const angleAt = (x: number, y: number, t: number) =>
  -Math.PI / 2 + Math.sin(x * 0.0042 + t * 0.35) * 0.55 + Math.cos(y * 0.0057 - t * 0.27) * 0.45 + Math.sin((x + y) * 0.0019) * 0.3;

export const steps = [
  { title: 'Listen', text: 'We start with your family, not a form: the people you provide for, the work you love, the risks that keep you up.' },
  { title: 'Design', text: 'A written plan and a portfolio built for it, with every fee, tax lever and trade-off in plain language.' },
  { title: 'Tend', text: 'Quarterly reviews, quiet rebalancing and one adviser who picks up the phone, for as long as you need us.' },
];

export const quotes = [
  { text: 'They asked about our grandchildren before they asked about our accounts. That told us everything.', who: 'Margit and Hal Sorensen', where: 'Clients since 2011' },
  { text: 'Every number in our plan comes with a sentence explaining it. I finally understand where our money goes.', who: 'Dr Amara Okafor', where: 'Clients since 2018' },
  { text: 'When markets fell, our adviser called us first. We did nothing rash, and we are glad.', who: 'The Ilves family', where: 'Clients since 2008' },
];
