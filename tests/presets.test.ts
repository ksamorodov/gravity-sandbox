import { expect, it } from 'vitest';
import { createPreset } from '../src/presets';
import { step } from '../src/physics';

it.each([
  ['solar', 7],
  ['binary', 4],
  ['chaos', 24],
] as const)('%s preset is finite, distinct and survives its first second', (name, count) => {
  const bodies = createPreset(name);
  expect(bodies).toHaveLength(count);
  expect(new Set(bodies.map((b) => b.id)).size).toBe(count);
  for (let i = 0; i < 120; i++) step(bodies, 1 / 120);
  expect(bodies.length).toBeGreaterThan(1);
  expect(bodies.every((b) => [b.x, b.y, b.vx, b.vy, b.mass].every(Number.isFinite))).toBe(true);
});

it('resetting Chaos produces the same positions and velocities without sharing objects', () => {
  const a = createPreset('chaos'),
    b = createPreset('chaos');
  expect(a.map(({ id: _, ...body }) => body)).toEqual(b.map(({ id: _, ...body }) => body));
  a[0].x = 999;
  expect(b[0].x).not.toBe(999);
});
