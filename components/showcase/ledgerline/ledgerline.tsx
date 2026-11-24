'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { comparison, MAX_SEATS, MIN_SEATS, monthly, plans, recommended, type Billing } from './data';
import s from './ledgerline.module.css';

const pounds = (value: number) => '£' + Math.round(value).toLocaleString('en-GB');

// Counts smoothly from the last shown value to the next one; jumps straight there under reduced motion.
function useTween(target: number) {
  const [value, setValue] = useState(target);
  const shown = useRef(target);
  useEffect(() => {
    const from = shown.current;
    if (from === target) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shown.current = target;
      const id = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(id);
    }
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 450);
      const next = from + (target - from) * (1 - (1 - t) ** 3);
      shown.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}

function Price({ amount }: { amount: number }) {
  const value = useTween(amount);
  return <>{pounds(value)}</>;
}

export function Ledgerline() {
  const [billing, setBilling] = useState<Billing>('annual');
  const [seats, setSeats] = useState(12);
  const best = recommended(seats);

  return (
    <div className={s.page} data-testid="ledgerline-root">
      <section className={s.pricing} aria-labelledby="pricing-title">
        <div className={s.head}>
          <p className={s.eyebrow}>
            <span className={s.dot} /> Pricing
          </p>
          <h2 id="pricing-title">
            Pay for the close,
            <br />
            <em>not the seats you forget.</em>
          </h2>
          <p className={s.lede}>
            Ledgerline reconciles, routes approvals and closes the month. Tell us how many people
            touch the books and we will show what it costs.
          </p>
        </div>

        <div className={s.controls}>
          <div className={s.toggle} role="radiogroup" aria-label="Billing" data-billing={billing}>
            <span className={s.thumb} aria-hidden="true" />
            {(['monthly', 'annual'] as const).map((value) => (
              <button
                key={value}
                role="radio"
                aria-checked={billing === value}
                onClick={() => setBilling(value)}
              >
                {value === 'monthly' ? 'Monthly' : 'Annual'}
                {value === 'annual' && <span className={s.save}>save ~20%</span>}
              </button>
            ))}
          </div>
          <label className={s.seats}>
            <span>
              Team size <output>{seats} {seats === 1 ? 'person' : 'people'}</output>
            </span>
            <input
              type="range"
              min={MIN_SEATS}
              max={MAX_SEATS}
              value={seats}
              aria-valuetext={`${seats} people`}
              style={{ ['--fill' as string]: `${((seats - MIN_SEATS) / (MAX_SEATS - MIN_SEATS)) * 100}%` }}
              onChange={(event) => setSeats(Number(event.target.value))}
            />
          </label>
        </div>

        <ul className={s.plans}>
          {plans.map((plan) => {
            const cost = monthly(plan, seats, billing);
            const fits = cost !== null;
            return (
              <li
                key={plan.id}
                className={s.plan}
                data-best={plan.id === best}
                data-fits={fits}
                aria-label={`${plan.name}${plan.id === best ? ', recommended for your team' : ''}`}
              >
                {plan.id === best && <span className={s.badge}>Best for {seats} {seats === 1 ? 'person' : 'people'}</span>}
                <h3>{plan.name}</h3>
                <p className={s.line}>{plan.line}</p>
                <p className={s.price} data-testid={`price-${plan.id}`}>
                  {fits ? (
                    <>
                      <strong>
                        <Price amount={cost} />
                      </strong>
                      <span>
                        / month
                        {cost > 0 && (
                          <>
                            <br />
                            {pounds(plan.perSeat[billing])} per seat
                            {plan.minimumSeats ? `, ${plan.minimumSeats}-seat minimum` : ''}
                          </>
                        )}
                      </span>
                    </>
                  ) : (
                    <strong className={s.tooSmall}>Up to 3 people</strong>
                  )}
                </p>
                <a className={plan.id === best ? s.primary : s.secondary} href="#compare">
                  {plan.id === 'scale' ? 'Talk to us' : plan.id === 'starter' ? 'Start free' : 'Start 14-day trial'}
                  <ArrowRight size={16} />
                </a>
                <ul className={s.features}>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={15} /> {feature}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>

        <details className={s.compare} id="compare">
          <summary>Compare every plan</summary>
          <div className={s.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.id} scope="col">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map(([feature, ...values]) => (
                  <tr key={feature}>
                    <th scope="row">{feature}</th>
                    {values.map((value, index) => (
                      <td key={index}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
        <p className={s.footnote}>
          Prices exclude VAT. Ledgerline is a fictional concept; nothing on this page can be bought.
        </p>
      </section>
    </div>
  );
}
