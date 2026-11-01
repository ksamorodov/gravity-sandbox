import { createBody, G, type Body } from './physics';

export type PresetName = 'solar' | 'binary' | 'chaos';
export const COLORS = ['#79ded2', '#b49bff', '#ffb776', '#ed83ad', '#8ebdff', '#ece19b'];

export function createPreset(name: PresetName): Body[] {
  if (name === 'solar') {
    const sun = createBody(0, 0, 4500, 0, 0, '#ffcf85');
    const radii = [95, 145, 205, 275, 345, 425];
    const masses = [5, 12, 18, 10, 42, 28];
    const angles = [-0.8, 2.3, 0.5, 3.6, 5.2, 2.6];
    const planets = radii.map((r, i) => {
      const angle = angles[i],
        speed = Math.sqrt((G * sun.mass) / r);
      return createBody(
        Math.cos(angle) * r,
        Math.sin(angle) * r,
        masses[i],
        -Math.sin(angle) * speed,
        Math.cos(angle) * speed,
        COLORS[i],
      );
    });
    // Start in the barycentric rest frame instead of letting the system drift.
    const bodies = [sun, ...planets];
    centerMomentum(bodies);
    return bodies;
  }
  if (name === 'binary') {
    const mass = 2000,
      distance = 150;
    const speed = Math.sqrt((G * mass) / (4 * distance));
    return [
      createBody(-distance, 0, mass, 0, -speed, '#ffc78c'),
      createBody(distance, 0, mass, 0, speed, '#b6a0ff'),
      createBody(0, -345, 12, 30, 0, '#7cddd7'),
      createBody(0, 420, 20, -28, 0, '#8ebdff'),
    ];
  }
  // Deterministic spiral: replaying a preset reproduces the same experiment.
  const bodies = Array.from({ length: 24 }, (_, i) => {
    const angle = i * 2.399963229728653;
    const r = 80 + Math.sqrt(i / 23) * 320;
    const speed = 8 + (i % 5) * 6;
    return createBody(
      Math.cos(angle) * r,
      Math.sin(angle) * r,
      15 + ((i * 37) % 100),
      -Math.sin(angle) * speed,
      Math.cos(angle) * speed,
      COLORS[i % COLORS.length],
    );
  });
  centerMomentum(bodies);
  return bodies;
}

function centerMomentum(bodies: Body[]): void {
  const mass = bodies.reduce((sum, b) => sum + b.mass, 0);
  const vx = bodies.reduce((sum, b) => sum + b.vx * b.mass, 0) / mass;
  const vy = bodies.reduce((sum, b) => sum + b.vy * b.mass, 0) / mass;
  for (const b of bodies) {
    b.vx -= vx;
    b.vy -= vy;
  }
}
