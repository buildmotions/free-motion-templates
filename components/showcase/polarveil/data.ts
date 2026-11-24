import type { ShaderHero, ShaderPalette } from '../shader-background/shader-stage';

export const hero: ShaderHero = {
  kicker: 'Polarveil · northern lights',
  lines: ['Go north,', 'look up.'],
  lede: 'Small-group aurora trips above the Arctic Circle, guides included.',
  placeholder: 'Your email',
  cta: 'See the dates',
  family: 'Josefin Sans Variable',
  weight: 700,
  track: -0.03,
  size: 11.8,
  layout: 'center',
  form: 'pill',
};

export const palettes: readonly ShaderPalette[] = [
  { id: 'arctic', name: 'Arctic', colors: ['#03070f', '#17e8a0', '#7bffb0', '#a35cff'] },
  { id: 'solar', name: 'Solar', colors: ['#07040d', '#ff4f8b', '#ffb35c', '#7b4dff'] },
  { id: 'ice', name: 'Ice', colors: ['#030812', '#39b7ff', '#b4f1ff', '#5a6cff'] },
];

export const shader = `float curtain(vec2 q, float shift, float base) {
  float x = q.x * 1.3 + (soft(vec2(q.x * 0.9 + shift * 3.0, shift) + orbit(1.0, 0.4)) - 0.5) * 2.2;
  float rays = 0.45 + 0.55 * (0.5 + 0.5 * sin(x * 30.0 + shift)) * (0.5 + 0.5 * sin(x * 9.0 + TAU * u_p + shift * 2.0));
  float edge = base + (soft(vec2(x * 0.7, shift * 5.0) + orbit(1.0, 0.2)) - 0.5) * 0.7;
  float y = q.y - edge;
  return rays * smoothstep(-0.16, 0.08, y) * exp(-max(y, 0.0) * 2.5);
}
void main() {
  vec2 q = centered() + u_m * 0.05;
  vec3 c = u_a * (1.0 + 0.6 * smoothstep(0.5, -0.5, q.y));
  vec2 g = q * 90.0;
  float star = step(0.985, hash(floor(g))) * smoothstep(0.45, 0.05, length(fract(g) - 0.5));
  c += vec3(0.7) * star * (0.6 + 0.4 * wave(2.0, hash(floor(g) + 2.0)));
  float a = curtain(q, 1.0, -0.22);
  float b = curtain(q, 2.7, 0.08);
  float d = curtain(q, 4.3, -0.45);
  c += u_b * a * 0.8 + u_c * a * a * 0.4;
  c += u_d * b * 0.62;
  c += mix(u_b, u_d, 0.5) * d * 0.38;
  gl_FragColor = finish(c);
}
`;
