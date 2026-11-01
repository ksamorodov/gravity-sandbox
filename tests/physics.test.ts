import { describe, expect, it } from 'vitest';
import { createBody, G, Simulation, step } from '../src/physics';

describe('gravity and integration', () => {
  it('moves a lone body at its initial velocity', () => {
    const bodies = [createBody(0, 0, 10, 12, -4)];
    step(bodies, 0.5);
    expect(bodies[0].x).toBeCloseTo(6);
    expect(bodies[0].y).toBeCloseTo(-2);
  });

  it('attracts both bodies with acceleration proportional to the other mass', () => {
    const bodies = [createBody(-100, 0, 10), createBody(100, 0, 40)];
    step(bodies, 1 / 120);
    expect(bodies[0].vx).toBeGreaterThan(0);
    expect(bodies[1].vx).toBeLessThan(0);
    expect(bodies[0].vx / -bodies[1].vx).toBeCloseTo(4, 10);
    expect(bodies[0].vx).toBeCloseTo((G * 40) / 40000 / 120, 3);
  });

  it('conserves total linear momentum through gravitational updates', () => {
    const bodies = [createBody(-100, 0, 10, 3, 2), createBody(100, 50, 20, -2, 4)];
    for (let i = 0; i < 1000; i++) step(bodies, 1 / 120);
    expect(bodies.reduce((p, b) => p + b.mass * b.vx, 0)).toBeCloseTo(-10, 8);
    expect(bodies.reduce((p, b) => p + b.mass * b.vy, 0)).toBeCloseTo(100, 8);
  });

  it('merges overlapping bodies preserving mass, center of mass and momentum', () => {
    const bodies = [createBody(0, 0, 10, 3, 0), createBody(1, 0, 30, -1, 4)];
    step(bodies, 0);
    expect(bodies).toHaveLength(1);
    expect(bodies[0].mass).toBe(40);
    expect(bodies[0].x).toBeCloseTo(0.75);
    expect(bodies[0].vx).toBeCloseTo(0);
    expect(bodies[0].vy).toBeCloseTo(3);
  });

  it('merges coincident collision chains without NaN or leftover overlaps', () => {
    const bodies = Array.from({ length: 8 }, () => createBody(0, 0, 10));
    step(bodies, 1 / 120);
    expect(bodies).toHaveLength(1);
    expect(bodies[0].mass).toBe(80);
    expect([bodies[0].x, bodies[0].y, bodies[0].vx, bodies[0].vy].every(Number.isFinite)).toBe(
      true,
    );
  });

  it('keeps a circular orbit bounded over many fixed steps', () => {
    const bodies = [createBody(0, 0, 5000), createBody(200, 0, 1, 0, Math.sqrt((G * 5000) / 200))];
    for (let i = 0; i < 24000; i++) step(bodies, 1 / 120);
    expect(bodies).toHaveLength(2);
    const distance = Math.hypot(bodies[1].x - bodies[0].x, bodies[1].y - bodies[0].y);
    expect(distance).toBeGreaterThan(195);
    expect(distance).toBeLessThan(205);
  });

  it('rejects invalid mass instead of propagating invalid state', () => {
    expect(() => createBody(0, 0, 0)).toThrow();
    expect(() => createBody(0, 0, NaN)).toThrow();
  });
});

describe('fixed-step clock', () => {
  it('gives the same trajectory for different render frame partitions', () => {
    const a = new Simulation([createBody(0, 0, 10, 10, 0)]);
    const b = new Simulation([createBody(0, 0, 10, 10, 0)]);
    for (let i = 0; i < 60; i++) a.advance(1 / 60, 1);
    for (let i = 0; i < 120; i++) b.advance(1 / 120, 1);
    expect(a.time).toBeCloseTo(1, 10);
    expect(a.bodies[0].x).toBeCloseTo(b.bodies[0].x, 10);
  });

  it('stops at zero speed and doubles simulated time at 2x', () => {
    const sim = new Simulation([]);
    sim.advance(0.1, 0);
    expect(sim.time).toBe(0);
    sim.advance(0.1, 2);
    expect(sim.time).toBeCloseTo(0.2);
  });

  it('bounds catch-up after a background tab and resets the accumulator', () => {
    const sim = new Simulation([]);
    sim.advance(60, 4);
    expect(sim.time).toBeLessThanOrEqual(0.401);
    sim.reset([createBody(0, 0, 1)]);
    expect(sim.time).toBe(0);
    expect(sim.bodies).toHaveLength(1);
  });
});
