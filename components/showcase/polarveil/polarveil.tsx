'use client';
import { ShaderStage } from '../shader-background/shader-stage';
import { hero, palettes, shader } from './data';

export function Polarveil() {
  return <ShaderStage testId="polarveil-root" shader={shader} palettes={palettes} hero={hero} />;
}
