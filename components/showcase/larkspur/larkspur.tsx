'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { angleAt, arcs, compact, contributed, mixColors, profiles, project, quotes, steps, type Profile } from './data';
import s from './larkspur.module.css';

const reduced = () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function Flower({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="12" cy="6.5" rx="3.2" ry="5.2" fill="currentColor" opacity="0.85" transform={`rotate(${a} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="2.4" fill="#b9774a" />
    </svg>
  );
}

// Hundreds of thin lines rise through a slowly shifting field, like growth seen from above.
function Field() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    let frame = 0;
    let t = 0;
    let w = 0;
    let h = 0;
    const mouse = { x: -999, y: -999 };
    const seeds = Array.from({ length: 150 }, (_, i) => ({ x: ((i * 97) % 150) / 150, hue: i % 7 === 0 ? 1 : 0 }));
    function size() {
      const dpr = Math.min(2, devicePixelRatio);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const seed of seeds) {
        let x = seed.x * w;
        let y = h + 10;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let i = 0; i < 70; i++) {
          let a = angleAt(x, y, t);
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < 140) a += ((140 - d) / 140) * (dx > 0 ? 0.9 : -0.9);
          x += Math.cos(a) * 9;
          y += Math.sin(a) * 9;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = seed.hue ? 'rgba(185, 119, 74, 0.8)' : 'rgba(85, 96, 216, 0.38)';
        ctx.lineWidth = seed.hue ? 1.5 : 1.1;
        ctx.stroke();
      }
    }
    function loop() {
      t += 0.012;
      draw();
      frame = requestAnimationFrame(loop);
    }
    function move(event: PointerEvent) {
      const box = canvas.getBoundingClientRect();
      mouse.x = event.clientX - box.left;
      mouse.y = event.clientY - box.top;
    }
    size();
    if (reduced()) draw();
    else loop();
    addEventListener('resize', size);
    canvas.parentElement!.addEventListener('pointermove', move);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('resize', size);
      canvas.parentElement?.removeEventListener('pointermove', move);
    };
  }, []);
  return <canvas ref={ref} className={s.field} aria-hidden="true" />;
}

function Counter({ to, prefix = '', suffix = '', decimals = 0 }: { to: number; prefix?: string; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      if (reduced()) return setValue(to);
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 1600);
        setValue(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return (
    <span ref={ref}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

const C = 2 * Math.PI * 80;

export function Larkspur() {
  const root = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>('Balance');
  const [initial, setInitial] = useState(250000);
  const [monthly, setMonthly] = useState(2000);
  const [years, setYears] = useState(20);
  const [quote, setQuote] = useState(0);
  const [sent, setSent] = useState(false);
  const [low, mid, high] = profiles[profile].rates.map((rate) => project(initial, monthly, years, rate));
  const max = high[high.length - 1];
  const point = (v: number, i: number) => `${((i / years) * 600).toFixed(1)},${(220 - (v / max) * 200).toFixed(1)}`;
  const band = `M${high.map(point).join(' L')} L${[...low].reverse().map((v, i) => point(v, years - i)).join(' L')} Z`;
  const line = `M${mid.map(point).join(' L')}`;

  // Reveal-on-scroll for anything marked data-reveal, and the sticky approach steps.
  useEffect(() => {
    const el = root.current!;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.setAttribute('data-in', 'true')),
      { threshold: 0.15 },
    );
    el.querySelectorAll('[data-reveal]').forEach((n) => io.observe(n));
    const stepper = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setStep(Number((e.target as HTMLElement).dataset.step))),
      { rootMargin: '-45% 0px -45% 0px' },
    );
    el.querySelectorAll('[data-step]').forEach((n) => stepper.observe(n));
    const onScroll = () => setScrolled(scrollY > 40);
    addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      stepper.disconnect();
      removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (reduced()) return;
    const timer = setInterval(() => setQuote((q) => (q + 1) % quotes.length), 6500);
    return () => clearInterval(timer);
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <div className={s.site} ref={root} data-testid="larkspur-root">
      <header className={s.nav} data-scrolled={scrolled}>
        <a href="#top" className={s.logo}>
          <Flower /> Larkspur
        </a>
        <nav aria-label="Main">
          <a href="#approach">Approach</a>
          <a href="#portfolios">Portfolios</a>
          <a href="#planner">Planner</a>
          <a href="#voices">Clients</a>
        </nav>
        <a href="#contact" className={s.navCta}>
          Book a call
        </a>
      </header>

      <section className={s.hero} id="top">
        <Field />
        <div className={s.heroCopy}>
          <p className={s.eyebrow}>Private wealth · Est. 1994</p>
          <h1>
            Wealth that grows
            <br />
            like a garden: <em>patiently.</em>
          </h1>
          <p className={s.lede}>Independent advice for families who would rather spend their time on the things money is for.</p>
          <div className={s.actions}>
            <a href="#planner" className={s.primary}>
              Try the planner <ArrowRight size={16} />
            </a>
            <a href="#approach" className={s.ghost}>
              How we work
            </a>
          </div>
        </div>
        <dl className={s.stats}>
          <div>
            <dt>Assets under advice</dt>
            <dd>
              <Counter to={4.2} prefix="$" suffix="B" decimals={1} />
            </dd>
          </div>
          <div>
            <dt>Families</dt>
            <dd>
              <Counter to={380} />
            </dd>
          </div>
          <div>
            <dt>Average relationship</dt>
            <dd>
              <Counter to={14} suffix=" yrs" />
            </dd>
          </div>
        </dl>
      </section>

      <div className={s.marquee} aria-label="As featured in">
        <div>
          {[0, 1].map((k) => (
            <span key={k} aria-hidden={k === 1}>
              {['The Ledger Review', 'Harbour Times', 'MONEYWEEK QUARTERLY', 'The Northern Post', 'Allocator', 'Fieldnotes FT'].map((n) => (
                <b key={n}>{n}</b>
              ))}
            </span>
          ))}
        </div>
      </div>

      <section className={s.approach} id="approach">
        <div className={s.sticky}>
          <p className={s.eyebrow}>Our approach</p>
          <svg viewBox="0 0 200 200" className={s.growth} aria-hidden="true" data-stage={step}>
            <circle cx="100" cy="150" r="46" className={s.soil} />
            <path d="M100 150 C 100 120, 100 100, 100 60" className={s.stem} />
            <path d="M100 118 C 82 108, 70 112, 62 98 C 80 94, 92 102, 100 112" className={s.leafL} />
            <path d="M100 100 C 118 90, 130 94, 138 80 C 120 76, 108 84, 100 94" className={s.leafR} />
            <g className={s.bloom}>
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} cx="100" cy="46" rx="8" ry="14" transform={`rotate(${a} 100 60)`} />
              ))}
              <circle cx="100" cy="60" r="6" />
            </g>
          </svg>
          <ol className={s.dots}>
            {steps.map((st, i) => (
              <li key={st.title} data-on={i === step}>
                {String(i + 1).padStart(2, '0')} {st.title}
              </li>
            ))}
          </ol>
        </div>
        <div className={s.stepList}>
          {steps.map((st, i) => (
            <article key={st.title} data-step={i} data-on={i === step}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <h2>{st.title}</h2>
              <p>{st.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={s.portfolios} id="portfolios" data-reveal>
        <div>
          <p className={s.eyebrow}>Portfolios</p>
          <h2 className={s.h2}>Three temperaments. One discipline.</h2>
          <div role="radiogroup" aria-label="Portfolio" className={s.tabs}>
            {(Object.keys(profiles) as Profile[]).map((p) => (
              <button key={p} role="radio" aria-checked={profile === p} onClick={() => setProfile(p)}>
                {p}
              </button>
            ))}
          </div>
          <ul className={s.mix}>
            {profiles[profile].mix.map((m, i) => (
              <li key={m.name} style={{ ['--c' as string]: mixColors[i] }}>
                <i /> {m.name} <b>{m.share}%</b>
              </li>
            ))}
          </ul>
          <p className={s.range}>
            Long-run return range {Math.round(profiles[profile].rates[0] * 100)}–{Math.round(profiles[profile].rates[2] * 1000) / 10}% a year, illustrative.
          </p>
        </div>
        <svg viewBox="0 0 200 200" className={s.donut} aria-label={`${profile} allocation`} role="img">
          {arcs(profiles[profile].mix).map((a, i) => (
            <circle
              key={i}
              cx="100"
              cy="100"
              r="80"
              stroke={mixColors[i]}
              strokeDasharray={`${Math.max(0, (a.end - a.start) * C - 4)} ${C}`}
              strokeDashoffset={-a.start * C}
            />
          ))}
          <text x="100" y="96" textAnchor="middle" className={s.donutLabel}>
            {profile}
          </text>
          <text x="100" y="118" textAnchor="middle" className={s.donutSub}>
            {profiles[profile].mix[0].share}% {profiles[profile].mix[0].name.toLowerCase()}
          </text>
        </svg>
      </section>

      <section className={s.planner} id="planner" data-reveal>
        <div className={s.controls}>
          <p className={s.eyebrow}>Planner</p>
          <h2 className={s.h2}>See where patience takes you.</h2>
          <label>
            <span>
              Starting amount <b>{compact(initial)}</b>
            </span>
            <input type="range" min={25000} max={2000000} step={25000} value={initial} onChange={(e) => setInitial(Number(e.target.value))} />
          </label>
          <label>
            <span>
              Monthly contribution <b>{compact(monthly)}</b>
            </span>
            <input type="range" min={0} max={20000} step={500} value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} />
          </label>
          <label>
            <span>
              Years <b>{years}</b>
            </span>
            <input type="range" min={5} max={40} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} />
          </label>
          <p className={s.note}>Using the {profile} portfolio. Illustrative only, not a forecast or advice.</p>
        </div>
        <div className={s.chart}>
          <p className={s.result}>
            <span>Expected in {years} years</span>
            <b data-testid="larkspur-expected">{compact(mid[years])}</b>
            <small>
              Range {compact(low[years])} – {compact(high[years])} · you add {compact(contributed(initial, monthly, years))}
            </small>
          </p>
          <svg viewBox="0 0 600 230" preserveAspectRatio="none" aria-hidden="true">
            {[0.25, 0.5, 0.75].map((g) => (
              <line key={g} x1="0" x2="600" y1={220 - g * 200} y2={220 - g * 200} className={s.grid} />
            ))}
            <path d={band} className={s.band} />
            <path d={line} className={s.line} key={`${profile}-${years}`} pathLength={1} />
          </svg>
        </div>
      </section>

      <section className={s.voices} id="voices" data-reveal>
        <Flower size={34} />
        <blockquote key={quote} aria-live="polite">
          <p>“{quotes[quote].text}”</p>
          <footer>
            {quotes[quote].who} · <span>{quotes[quote].where}</span>
          </footer>
        </blockquote>
        <div className={s.pager}>
          {quotes.map((q, i) => (
            <button key={q.who} aria-label={`Quote ${i + 1}`} aria-pressed={i === quote} onClick={() => setQuote(i)} />
          ))}
        </div>
      </section>

      <section className={s.insights} data-reveal>
        <div className={s.insightHead}>
          <h2 className={s.h2}>Field notes</h2>
          <a href="#contact">
            All insights <ArrowUpRight size={15} />
          </a>
        </div>
        <ul>
          {[
            ['Markets', 'Why we did nothing in March', '6 min read'],
            ['Family', 'Talking to your children about inheritance', '9 min read'],
            ['Tax', 'Five quiet levers for the new tax year', '7 min read'],
          ].map(([tag, title, time], i) => (
            <li key={title} style={{ ['--i' as string]: i }}>
              <a href="#contact">
                <span className={s.tag}>{tag}</span>
                <b>{title}</b>
                <small>
                  {time} <ArrowUpRight size={14} />
                </small>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className={s.contact} id="contact">
        <div>
          <h2>
            Start with a <em>conversation.</em>
          </h2>
          <p>Thirty minutes, no obligation and no sales script. We will tell you honestly whether we can help.</p>
        </div>
        {sent ? (
          <p className={s.thanks} role="status">
            <Check size={18} /> Thank you. An adviser will email you within one working day.
          </p>
        ) : (
          <form onSubmit={submit} className={s.form}>
            <label>
              Name
              <input required name="name" autoComplete="name" />
            </label>
            <label>
              Email
              <input required type="email" name="email" autoComplete="email" />
            </label>
            <label>
              I am interested in
              <select name="interest" defaultValue="planning">
                <option value="planning">Financial planning</option>
                <option value="investing">Investment management</option>
                <option value="family">Family and estate</option>
              </select>
            </label>
            <button type="submit">
              Request a call <ArrowRight size={16} />
            </button>
          </form>
        )}
      </section>

      <footer className={s.footer}>
        <span className={s.logo}>
          <Flower size={18} /> Larkspur
        </span>
        <p>Larkspur is a fictional firm created for this template. Nothing here is financial advice.</p>
      </footer>
    </div>
  );
}
