// Generated from scripts/templates/shaders/common.glsl.
export const commonGlsl = `precision highp float;
uniform vec2 u_res;
uniform float u_p; // loop phase, 0 to 1 over 12 seconds
uniform vec2 u_m;  // pointer, -0.5 to 0.5, eased
uniform vec3 u_a;
uniform vec3 u_b;
uniform vec3 u_c;
uniform vec3 u_d;
#define TAU 6.2831853

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
vec2 hash2(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy);
}
// Gradient noise that repeats every per cells, so scrolling by a whole period loops cleanly.
float corner(vec2 i, vec2 f, vec2 o, vec2 per) {
  return dot(hash2(mod(i + o, per)) * 2.0 - 1.0, f - o);
}
float tnoise(vec2 p, vec2 per) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float v = mix(
    mix(corner(i, f, vec2(0.0, 0.0), per), corner(i, f, vec2(1.0, 0.0), per), u.x),
    mix(corner(i, f, vec2(0.0, 1.0), per), corner(i, f, vec2(1.0, 1.0), per), u.x),
    u.y
  );
  return 0.5 + 0.75 * v;
}
float noise(vec2 p) {
  return tnoise(p, vec2(289.0));
}
float tfbm(vec2 p, vec2 per) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * tnoise(p, per);
    p *= 2.0;
    per *= 2.0;
    a *= 0.5;
  }
  return v;
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = r * p * 2.03 + 17.0;
    a *= 0.5;
  }
  return v;
}
float soft(vec2 p) {
  return 0.65 * noise(p) + 0.35 * noise(p * 2.1 + 9.0);
}
// Whole-number k keeps every motion periodic over the loop.
vec2 orbit(float k, float r) {
  return r * vec2(cos(TAU * k * u_p), sin(TAU * k * u_p));
}
float wave(float k, float offset) {
  return sin(TAU * (k * u_p + offset));
}
vec2 centered() {
  return (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
}
mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, s, -s, c);
}
// a to b to c to d
vec3 ramp(float t) {
  t = clamp(t, 0.0, 1.0) * 3.0;
  vec3 c = mix(u_a, u_b, smoothstep(0.0, 1.0, t));
  c = mix(c, u_c, smoothstep(1.0, 2.0, t));
  return mix(c, u_d, smoothstep(2.0, 3.0, t));
}
// a to b to c to d and back to a
vec3 cycle(float t) {
  t = fract(t) * 4.0;
  vec3 c = mix(u_a, u_b, smoothstep(0.0, 1.0, t));
  c = mix(c, u_c, smoothstep(1.0, 2.0, t));
  c = mix(c, u_d, smoothstep(2.0, 3.0, t));
  return mix(c, u_a, smoothstep(3.0, 4.0, t));
}
// A true mesh gradient: four colours anchored at drifting points, blended by distance.
vec3 mesh(vec2 q, float size) {
  vec2 p0 = vec2(-0.55, 0.35) + orbit(1.0, 0.28);
  vec2 p1 = vec2(0.6, 0.3) + orbit(1.0, 0.22).yx;
  vec2 p2 = vec2(-0.35, -0.42) - orbit(1.0, 0.3);
  vec2 p3 = vec2(0.45, -0.38) + orbit(2.0, 0.14);
  float s = size * size;
  float w0 = exp(-dot(q - p0, q - p0) / s);
  float w1 = exp(-dot(q - p1, q - p1) / s);
  float w2 = exp(-dot(q - p2, q - p2) / s);
  float w3 = exp(-dot(q - p3, q - p3) / s);
  return (u_a * w0 + u_b * w1 + u_c * w2 + u_d * w3) / (w0 + w1 + w2 + w3 + 0.0001);
}
// A touch of static grain stops gradients banding.
vec4 finish(vec3 c) {
  return vec4(c + (hash(gl_FragCoord.xy) - 0.5) / 96.0, 1.0);
}
`;
