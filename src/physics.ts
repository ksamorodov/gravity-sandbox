/** Stylized world units, not an astronomical model. */
export const G = 90;
export const FIXED_DT = 1 / 120;
const SOFTENING_SQUARED = 16;
export const MAX_BODIES = 160;

export interface Body {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
}

let nextId = 1;
export function createBody(x: number, y: number, mass: number, vx = 0, vy = 0, color = '#8ae5df'): Body {
  if (![x, y, mass, vx, vy].every(Number.isFinite) || mass <= 0) {
    throw new RangeError('Body coordinates, velocity and positive mass must be finite');
  }
  return { id: nextId++, x, y, mass, vx, vy, color, radius: radiusFor(mass) };
}

function radiusFor(mass: number): number {
  return Math.max(2.5, Math.cbrt(mass) * 1.3);
}

function mergeOverlaps(bodies: Body[]): void {
  // Restart after every merge: a larger radius can engulf an earlier neighbor.
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], b = bodies[j];
        if (Math.hypot(a.x - b.x, a.y - b.y) > a.radius + b.radius) continue;
        const total = a.mass + b.mass;
        a.x = (a.x * a.mass + b.x * b.mass) / total;
        a.y = (a.y * a.mass + b.y * b.mass) / total;
        a.vx = (a.vx * a.mass + b.vx * b.mass) / total;
        a.vy = (a.vy * a.mass + b.vy * b.mass) / total;
        if (b.mass > a.mass) a.color = b.color;
        a.mass = total;
        a.radius = radiusFor(total);
        bodies.splice(j, 1);
        merged = true;
        break outer;
      }
    }
  }
}

function accelerations(bodies: Body[]): Float64Array {
  const values = new Float64Array(bodies.length * 2);
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const distanceSquared = dx * dx + dy * dy + SOFTENING_SQUARED;
      const factor = G / (distanceSquared * Math.sqrt(distanceSquared));
      values[2 * i] += dx * factor * b.mass;
      values[2 * i + 1] += dy * factor * b.mass;
      values[2 * j] -= dx * factor * a.mass;
      values[2 * j + 1] -= dy * factor * a.mass;
    }
  }
  return values;
}

/** Kick-drift-kick velocity Verlet. Collisions are perfectly inelastic. */
export function step(bodies: Body[], dt: number): void {
  mergeOverlaps(bodies);
  const before = accelerations(bodies);
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    b.vx += before[2 * i] * dt / 2;
    b.vy += before[2 * i + 1] * dt / 2;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
  // Merge after drift, before computing the second kick for the new topology.
  mergeOverlaps(bodies);
  const after = accelerations(bodies);
  for (let i = 0; i < bodies.length; i++) {
    bodies[i].vx += after[2 * i] * dt / 2;
    bodies[i].vy += after[2 * i + 1] * dt / 2;
  }
}

export class Simulation {
  time = 0;
  private accumulator = 0;
  constructor(public bodies: Body[] = []) {}

  reset(bodies: Body[]): void {
    this.bodies = bodies;
    this.time = 0;
    this.accumulator = 0;
  }

  advance(realDelta: number, speed: number): void {
    if (!Number.isFinite(realDelta) || !Number.isFinite(speed) || realDelta <= 0 || speed <= 0) return;
    // Drop wall-clock backlog, rather than taking a numerically unstable large step.
    this.accumulator += Math.min(realDelta, 0.1) * Math.min(speed, 4);
    while (this.accumulator + 1e-12 >= FIXED_DT) {
      step(this.bodies, FIXED_DT);
      this.time += FIXED_DT;
      this.accumulator = Math.max(0, this.accumulator - FIXED_DT);
    }
  }
}
