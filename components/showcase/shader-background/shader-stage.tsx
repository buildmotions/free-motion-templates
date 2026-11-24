'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { commonGlsl } from './common-glsl';
import s from './shader-stage.module.css';

export type ShaderPalette = { id: string; name: string; colors: readonly [string, string, string, string] };
export type SeekableCanvas = HTMLCanvasElement & { __seek?: (phase: number, width?: number, height?: number) => void };
export type ShaderHero = {
  kicker: string;
  lines: readonly string[];
  lede: string;
  placeholder: string;
  cta: string;
  family: string;
  weight: number;
  track: number;
  size: number;
  layout: 'center' | 'left' | 'low' | 'top';
  form: 'pill' | 'line' | 'block';
  italic?: boolean;
  upper?: boolean;
  tone?: 'light' | 'dark';
  shade?: 'soft' | 'strong';
};

/** Every shader is periodic in this many seconds, so the live page and the MP4 both loop without a seam. */
export const loopSeconds = 12;
const vertex = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const uniforms = ['u_res', 'u_p', 'u_m', 'u_a', 'u_b', 'u_c', 'u_d'] as const;

const toRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
const linear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const luminance = (r: number, g: number, b: number) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

/** White or near-black, whichever reads better on these luminances, and how hard the shade behind the text must work. */
function readability(samples: number[]) {
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const spread = Math.sqrt(samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) / samples.length);
  return { tone: 1.05 / (mean + 0.05) >= (mean + 0.05) / 0.056 ? 'light' : 'dark', shade: spread > 0.14 ? 'strong' : 'soft' };
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  console.error(gl.getShaderInfoLog(shader));
  return null;
}

export function ShaderStage({ testId, shader, palettes, hero }: { testId: string; shader: string; palettes: readonly ShaderPalette[]; hero: ShaderHero }) {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<SeekableCanvas>(null);
  const copy = useRef<HTMLDivElement>(null);
  const [palette, setPalette] = useState(palettes[0].id);
  const [paused, setPaused] = useState(false);
  const [joined, setJoined] = useState(false);
  const live = useRef({ colors: palettes[0].colors as readonly string[], paused: false, draw: () => {}, measure: () => {} });

  useEffect(() => {
    live.current.colors = palettes.find((p) => p.id === palette)?.colors ?? palettes[0].colors;
    live.current.paused = paused;
    live.current.draw();
    live.current.measure();
  }, [palette, paused, palettes]);

  useEffect(() => {
    const element = canvas.current;
    const root = stage.current;
    const state = live.current;
    if (!element || !root) return;
    const gl = element.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    const fragment = gl && compile(gl, gl.FRAGMENT_SHADER, commonGlsl + shader);
    const vert = gl && compile(gl, gl.VERTEX_SHADER, vertex);
    const program = gl?.createProgram();
    if (!gl || !fragment || !vert || !program) {
      const apply = () => {
        const { tone, shade } = readability(state.colors.map((hex) => luminance(...toRgb(hex))));
        root.dataset.tone = hero.tone ?? tone;
        root.dataset.shade = hero.shade ?? shade;
      };
      state.measure = apply;
      apply();
      root.dataset.state = 'fallback';
      return;
    }
    gl.attachShader(program, vert);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const at = Object.fromEntries(uniforms.map((name) => [name, gl.getUniformLocation(program, name)]));

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let quality = 1;
    let phase = reduced ? 0.2 : 0;
    let captured = false;

    const render = () => {
      gl.viewport(0, 0, element.width, element.height);
      gl.uniform2f(at.u_res, element.width, element.height);
      gl.uniform1f(at.u_p, phase);
      gl.uniform2f(at.u_m, pointer.x, pointer.y);
      (['u_a', 'u_b', 'u_c', 'u_d'] as const).forEach((name, i) => {
        const [r, g, b] = toRgb(live.current.colors[i]);
        gl.uniform3f(at[name], r, g, b);
      });
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    live.current.draw = render;

    // Sample the shader behind the words across the whole loop, so the text stays readable in every palette.
    const measure = () => {
      if (captured || !copy.current) return;
      const box = copy.current.getBoundingClientRect();
      const view = element.getBoundingClientRect();
      const scaleX = element.width / (view.width || 1);
      const scaleY = element.height / (view.height || 1);
      const samples: number[] = [];
      const pixel = new Uint8Array(4);
      const resume = phase;
      for (const at of [0, 0.25, 0.5, 0.75]) {
        phase = at;
        render();
        for (let row = 0; row < 7; row++) {
          for (let column = 0; column < 11; column++) {
            const x = (box.left - view.left + (box.width * (column + 0.5)) / 11) * scaleX;
            const y = element.height - (box.top - view.top + (box.height * (row + 0.5)) / 7) * scaleY;
            gl.readPixels(Math.floor(x), Math.floor(y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            samples.push(luminance(pixel[0] / 255, pixel[1] / 255, pixel[2] / 255));
          }
        }
      }
      phase = resume;
      render();
      const { tone, shade } = readability(samples);
      root.dataset.tone = hero.tone ?? tone;
      root.dataset.shade = hero.shade ?? shade;
    };
    live.current.measure = measure;

    const resize = () => {
      if (captured) return;
      const scale = Math.min(devicePixelRatio || 1, 1.5) * quality;
      element.width = Math.max(1, Math.round(element.clientWidth * scale));
      element.height = Math.max(1, Math.round(element.clientHeight * scale));
      render();
      measure();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();

    const onPointer = (event: PointerEvent) => {
      pointer.tx = event.clientX / innerWidth - 0.5;
      pointer.ty = 0.5 - event.clientY / innerHeight;
    };
    if (!reduced) addEventListener('pointermove', onPointer, { passive: true });

    // Rendering a chosen phase lets the preview be made frame by frame, however slow the machine.
    element.__seek = (next, width, height) => {
      captured = true;
      if (width && height) {
        element.width = width;
        element.height = height;
      }
      phase = next;
      pointer.x = pointer.y = 0;
      render();
    };

    let frame = 0;
    let last = performance.now();
    let slow = 0;
    let count = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const delta = now - last;
      last = now;
      if (live.current.paused || captured || reduced) return;
      phase = (phase + delta / 1000 / loopSeconds) % 1;
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      render();
      // Weak GPUs get fewer pixels instead of a stutter.
      slow += delta;
      if (++count === 40) {
        if (slow / count > 34 && quality > 0.5) {
          quality *= 0.8;
          resize();
        }
        slow = count = 0;
      }
    };
    frame = requestAnimationFrame(tick);
    root.dataset.state = 'ready';

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener('pointermove', onPointer);
      state.draw = () => {};
      state.measure = () => {};
      delete element.__seek;
    };
  }, [shader, hero.tone, hero.shade]);

  const current = palettes.find((p) => p.id === palette) ?? palettes[0];
  return (
    <div
      ref={stage}
      className={s.stage}
      data-testid={testId}
      data-state="loading"
      style={{ background: `linear-gradient(135deg, ${current.colors.join(', ')})` }}
    >
      <canvas ref={canvas} className={s.canvas} aria-hidden="true" />
      <div className={s.hero} data-layout={hero.layout} data-form={hero.form}>
        <div ref={copy} className={s.copy}>
          <p className={s.kicker}>{hero.kicker}</p>
          <h1
            style={{
              fontFamily: `'${hero.family}', serif`,
              fontWeight: hero.weight,
              fontStyle: hero.italic ? 'italic' : 'normal',
              letterSpacing: `${hero.track}em`,
              textTransform: hero.upper ? 'uppercase' : 'none',
              ['--size' as string]: hero.size,
            }}
          >
            {hero.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className={s.lede}>{hero.lede}</p>
          <form
            className={s.form}
            onSubmit={(event) => {
              event.preventDefault();
              setJoined(true);
            }}
          >
            {joined ? (
              <p role="status">You&rsquo;re on the list. We&rsquo;ll write soon.</p>
            ) : (
              <>
                <input type="email" required aria-label={hero.placeholder} placeholder={hero.placeholder} autoComplete="email" />
                <button type="submit">
                  {hero.cta}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </>
            )}
          </form>
        </div>
      </div>
      <div className={s.bar} role="group" aria-label="Background controls">
        <button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? 'Resume motion' : 'Pause motion'}>
          {paused ? <Play size={12} /> : <Pause size={12} />}
        </button>
        <div role="radiogroup" aria-label="Palette">
          {palettes.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={palette === item.id}
              aria-label={item.name}
              onClick={() => setPalette(item.id)}
            >
              <i style={{ background: `linear-gradient(135deg, ${item.colors[1]}, ${item.colors[2]})` }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
