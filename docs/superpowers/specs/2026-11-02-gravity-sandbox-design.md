# Gravity Sandbox — design

## Intent
A polished, shareable browser toy for exploring gravity. No backend, accounts,
database, framework or astrophysical accuracy claims.

## Approach
Choose TypeScript + Vite + Canvas 2D over WebGL (unnecessary complexity for at most
160 bodies) or a UI framework (no component complexity). Vitest tests pure physics;
Playwright runs real Chromium. These are autonomous implementation choices under
the user's instruction to settle noncritical decisions without questions.

## Structure and behavior
- `src/physics.ts`: bodies, softened inverse-square gravity, velocity Verlet at
  1/120 second, collision merging preserving mass and momentum, bounded catch-up.
- `src/presets.ts`: deterministic Solar System, Binary Stars and Chaos scenes.
- `src/renderer.ts`: responsive high-DPI canvas, starfield, glowing bodies, trails,
  launch preview. Logical world units independent of viewport size.
- `src/main.ts` + `src/style.css`: accessible control panel, mass, speed, pause,
  trails, clear and preset controls. Pointer capture supports mouse/touch;
  drag direction is launch velocity. Click creates a stationary body.
- Bound body count and trail history; clamp background-tab catch-up. Clear resets
  bodies and trails; preset selection resets scene and simulated time.
- Dark midnight observatory aesthetic: cyan/lilac accents, restrained glass cards,
  large space canvas and readable labels; responsive stacked mobile controls.

## Acceptance
Real Chromium checks load/console, all presets, pause/resume, mass and drag creation,
speed, clear, resize and touch. Unit tests verify attraction, mass dependence,
conservation, finite coincident positions, long-running orbit and fixed-step timing.
Screenshot desktop and mobile. Independent reviewer receives original requirements,
develop diff and test evidence; fix major/blocking findings and rerun.

## Git and reusable skill
Empty remote: initial minimal commit on main; develop points to it; all work on
feature/gravity-sandbox. No push/merge/rebase/reset. Explicit staging and reviewed
diff per atomic Conventional Commit. Skill lives in
`.opencode/skills/agent-git-workflow/SKILL.md`, following V2 official discovery docs;
verify by actually loading it with OpenCode, not just inspecting the file.
