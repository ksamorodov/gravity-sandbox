import './style.css';
import { createBody, MAX_BODIES, Simulation } from './physics';
import { COLORS, createPreset, type PresetName } from './presets';
import { Renderer, type LaunchPreview } from './renderer';

const paths: Record<string, string> = {
  orbit:
    '<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-35 12 12)"/><circle cx="12" cy="12" r="4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="9" stroke-dasharray="2 4"/>',
  binary:
    '<circle cx="8" cy="12" r="3"/><circle cx="17" cy="10" r="4"/><path d="M4 18c5 4 17-1 17-8M3 13C1 6 16 1 20 6"/>',
  chaos: '<path d="m4 5 16 14M5 20 19 4M2 12h20"/><circle cx="12" cy="12" r="4"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  play: '<path d="m8 5 11 7-11 7Z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"/>',
  arrow: '<path d="M5 19 19 5M6 5h13v13"/>',
  cursor: '<path d="m5 3 14 10-7 1-3 7Z"/>',
  reset: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
};
function icon(name: string): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="header">
    <a class="brand" href="./" aria-label="Gravity Sandbox home">
      <span class="brand-mark">${icon('orbit')}</span>
      <div><h1>Gravity Sandbox</h1><span>AN ORBITAL PLAYGROUND</span></div>
    </a>
    <div class="header-note"><span class="tiny-star">✦</span> A little universe. Endless possibilities.</div>
    <span class="version">EXPERIMENT / 001</span>
  </header>
  <main>
    <div class="intro"><div><span class="eyebrow">LET CURIOSITY TAKE THE LEAD</span><h2>Make a little cosmic chaos<span>.</span></h2></div>
      <p>No rules. Just gravity.<br>Click, drag, and see what happens.</p></div>
    <div class="workspace">
      <section class="universe" aria-label="Universe">
        <div class="canvas-wrap">
          <canvas tabindex="0" aria-label="Interactive gravity simulation">Your browser needs Canvas 2D to display the simulation.</canvas>
          <div class="scene-top"><span id="state-badge" class="state-badge"><i></i><span>SIMULATION LIVE</span></span><span class="canvas-caption">N-BODY / 2D</span></div>
          <div class="scene-bottom"><div><span class="scene-number">01 /</span><span id="scene-name">Solar System</span></div><span class="coordinate-label">A SPACE TO EXPERIMENT</span></div>
          <div id="empty-hint" class="empty-hint" hidden><span>✦</span><h3>A fresh start.</h3><p>Click anywhere to create a planet.<br>Drag to give it a little momentum.</p></div>
        </div>
        <div class="telemetry">
          <div><span class="metric-label"><i class="dot mint"></i> BODIES</span><output aria-label="Celestial bodies" id="body-count">7</output></div>
          <div><span class="metric-label">TOTAL MASS</span><div><output aria-label="Total mass" id="total-mass">0</output><span class="unit"> m</span></div></div>
          <div><span class="metric-label">SIMULATED TIME</span><output aria-label="Simulated time" id="sim-time">0.0 s</output></div>
          <div class="integrator"><span class="metric-label">INTEGRATOR</span><span>Verlet <span class="unit">/ 120 Hz</span></span></div>
        </div>
      </section>
      <aside class="controls" aria-label="Simulation controls">
        <section class="control-section presets-section"><div class="section-title"><h3>Your starting point</h3><span>01</span></div>
          <p class="section-description">Pick a universe. Make it your own.</p>
          <div class="presets">
            <button class="preset" data-preset="solar" aria-label="Solar System" aria-pressed="true"><span class="preset-icon solar">${icon('sun')}</span><span><strong>Solar System</strong><small>A delicate balance</small></span><i class="selection-dot"></i></button>
            <button class="preset" data-preset="binary" aria-label="Binary Stars" aria-pressed="false"><span class="preset-icon binary">${icon('binary')}</span><span><strong>Binary Stars</strong><small>Better together</small></span><i class="selection-dot"></i></button>
            <button class="preset" data-preset="chaos" aria-label="Chaos" aria-pressed="false"><span class="preset-icon chaos">${icon('chaos')}</span><span><strong>Chaos</strong><small>Beautifully unpredictable</small></span><i class="selection-dot"></i></button>
          </div>
        </section>
        <section class="control-section"><div class="section-title"><h3>Create a body</h3><span>02</span></div>
          <div class="mass-label"><label for="mass">Mass</label><div class="number-wrap"><input id="mass" aria-label="New body mass" type="number" min="1" max="500" value="40"><span>m</span></div></div>
          <input id="mass-range" aria-label="Mass slider" type="range" min="1" max="500" value="40">
          <div class="range-labels"><span>Little planet</span><span>Heavy hitter</span></div>
          <div class="creation-tip">${icon('cursor')}<p><strong>Click & drag to launch</strong><br>Longer drag, more velocity.</p>${icon('arrow')}</div>
        </section>
        <section class="control-section time-section"><div class="section-title"><h3>Set the pace</h3><span>03</span></div>
          <div class="setting-row"><label for="speed">Time scale</label><select id="speed" aria-label="Simulation speed"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1× · Realtime</option><option value="2">2×</option><option value="4">4×</option></select></div>
          <label class="setting-row trail-setting" for="trails"><span>Orbit trails</span><input type="checkbox" id="trails" checked><span class="switch" aria-hidden="true"></span></label>
          <div class="actions"><button id="pause" class="primary" aria-label="Pause simulation">${icon('pause')}<span>Pause</span><kbd>Space</kbd></button><button id="clear" class="clear-button" aria-label="Clear scene">${icon('trash')}<span>Clear</span></button></div>
        </section>
        <div class="panel-note"><span>✧</span><p>Every orbit tells a story.<br>What will yours look like?</p></div>
      </aside>
    </div>
    <div class="below-scene"><p>${icon('cursor')} <strong>Click</strong> to create <span>·</span> <strong>Drag</strong> to launch <span>·</span> Bodies merge on collision</p><button id="reset" aria-label="Reset current preset">${icon('reset')} Reset universe</button></div>
  </main>
  <footer><span>BUILT FOR THE JOY OF EXPLORING</span><div><i class="dot mint"></i> All gravity. No consequences.</div><span>STAY CURIOUS <span class="footer-star">✦</span></span></footer>
  <div id="announcement" class="sr-only" role="status" aria-live="polite"></div>
`;

function element<T extends HTMLElement>(selector: string): T {
  return document.querySelector<T>(selector)!;
}
const canvas = element<HTMLCanvasElement>('canvas');
const renderer = new Renderer(canvas);
const simulation = new Simulation(createPreset('solar'));
const massInput = element<HTMLInputElement>('#mass');
const massRange = element<HTMLInputElement>('#mass-range');
const speedInput = element<HTMLSelectElement>('#speed');
const trailsInput = element<HTMLInputElement>('#trails');
const pauseButton = element<HTMLButtonElement>('#pause');
const bodyCount = element<HTMLOutputElement>('#body-count');
const totalMass = element<HTMLOutputElement>('#total-mass');
const simTime = element<HTMLOutputElement>('#sim-time');
const badge = element<HTMLSpanElement>('#state-badge');
const emptyHint = element<HTMLDivElement>('#empty-hint');
const announcement = element<HTMLDivElement>('#announcement');
let preset: PresetName = 'solar';
let paused = false;
let mass = 40;
let colorIndex = 0;
let preview: LaunchPreview | null = null;
let activePointer: number | null = null;
let lastFrame: number | null = null;

function updateTelemetry(): void {
  bodyCount.value = String(simulation.bodies.length);
  totalMass.value = simulation.bodies.reduce((sum, b) => sum + b.mass, 0).toLocaleString('en-US');
  simTime.value = `${simulation.time.toFixed(1)} s`;
  emptyHint.hidden = simulation.bodies.length !== 0 || preview !== null;
}

function cancelLaunch(): void {
  const pointer = activePointer;
  activePointer = null;
  preview = null;
  if (pointer !== null && canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
  updateTelemetry();
}

function loadPreset(name: PresetName): void {
  cancelLaunch();
  preset = name;
  simulation.reset(createPreset(name));
  renderer.clearTrails();
  document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.preset === name));
  });
  element('#scene-name').textContent = {
    solar: 'Solar System',
    binary: 'Binary Stars',
    chaos: 'Chaos',
  }[name];
  element('.scene-number').textContent = { solar: '01 /', binary: '02 /', chaos: '03 /' }[name];
  announcement.textContent = `${element('#scene-name').textContent} loaded`;
  updateTelemetry();
}

function togglePause(): void {
  paused = !paused;
  lastFrame = null;
  pauseButton.setAttribute('aria-label', paused ? 'Resume simulation' : 'Pause simulation');
  pauseButton.innerHTML = `${icon(paused ? 'play' : 'pause')}<span>${paused ? 'Resume' : 'Pause'}</span><kbd>Space</kbd>`;
  badge.classList.toggle('paused', paused);
  badge.querySelector('span')!.textContent = paused ? 'SIMULATION PAUSED' : 'SIMULATION LIVE';
  announcement.textContent = paused ? 'Simulation paused' : 'Simulation resumed';
}

document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => {
  button.addEventListener('click', () => loadPreset(button.dataset.preset as PresetName));
});
pauseButton.addEventListener('click', togglePause);
element('#reset').addEventListener('click', () => loadPreset(preset));
element('#clear').addEventListener('click', () => {
  cancelLaunch();
  simulation.reset([]);
  renderer.clearTrails();
  announcement.textContent = 'Scene cleared. Click the canvas to create a body.';
  updateTelemetry();
});
function updateMass(value: string): void {
  const parsed = Number(value);
  if (value !== '' && Number.isFinite(parsed))
    mass = Math.round(Math.max(1, Math.min(500, parsed)));
  massInput.value = String(mass);
  massRange.value = String(mass);
}
massInput.addEventListener('change', () => updateMass(massInput.value));
massRange.addEventListener('input', () => updateMass(massRange.value));
trailsInput.addEventListener('change', () => renderer.clearTrails());

canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || !event.isPrimary || activePointer !== null) return;
  event.preventDefault();
  canvas.focus({ preventScroll: true });
  if (simulation.bodies.length >= MAX_BODIES) {
    announcement.textContent = `Limit of ${MAX_BODIES} bodies reached. Clear the scene or let bodies merge.`;
    return;
  }
  updateMass(massInput.value);
  const start = renderer.toWorld(event.clientX, event.clientY);
  activePointer = event.pointerId;
  preview = { start, end: { ...start }, mass, color: COLORS[colorIndex % COLORS.length] };
  canvas.setPointerCapture(event.pointerId);
  updateTelemetry();
});
canvas.addEventListener('pointermove', (event) => {
  if (preview && activePointer === event.pointerId)
    preview.end = renderer.toWorld(event.clientX, event.clientY);
});
canvas.addEventListener('pointerup', (event) => {
  if (!preview || activePointer !== event.pointerId) return;
  const end = renderer.toWorld(event.clientX, event.clientY);
  const dx = (end.x - preview.start.x) * 0.45,
    dy = (end.y - preview.start.y) * 0.45;
  const factor = Math.min(1, 300 / (Math.hypot(dx, dy) || 1));
  simulation.bodies.push(
    createBody(
      preview.start.x,
      preview.start.y,
      preview.mass,
      dx * factor,
      dy * factor,
      preview.color,
    ),
  );
  colorIndex++;
  cancelLaunch();
});
canvas.addEventListener('pointercancel', cancelLaunch);
canvas.addEventListener('lostpointercapture', cancelLaunch);
window.addEventListener('blur', () => {
  cancelLaunch();
  lastFrame = null;
});
window.addEventListener('resize', cancelLaunch);
document.addEventListener('visibilitychange', () => {
  cancelLaunch();
  lastFrame = null;
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    cancelLaunch();
    return;
  }
  if (event.target instanceof HTMLElement && event.target.closest('input, select, button, a'))
    return;
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (event.code === 'Space') {
    event.preventDefault();
    togglePause();
  }
  if (event.key.toLowerCase() === 'r') loadPreset(preset);
});

function frame(now: number): void {
  if (!paused && lastFrame !== null && !document.hidden)
    simulation.advance((now - lastFrame) / 1000, Number(speedInput.value));
  lastFrame = now;
  renderer.draw(
    simulation.bodies,
    simulation.time,
    trailsInput.checked,
    preset === 'solar',
    preview,
  );
  updateTelemetry();
  requestAnimationFrame(frame);
}
updateTelemetry();
requestAnimationFrame(frame);
