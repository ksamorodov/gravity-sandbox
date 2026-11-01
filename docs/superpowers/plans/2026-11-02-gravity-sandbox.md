# Gravity Sandbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a beautiful, tested orbital sandbox and reusable safe Git skill.
**Architecture:** Pure deterministic physics separated from canvas rendering and DOM
controls. Fixed world coordinates and bounded fixed-step simulation.
**Tech Stack:** TypeScript, Vite, Canvas 2D, Vitest, Playwright Chromium.
**Spec:** `docs/superpowers/specs/2026-11-02-gravity-sandbox-design.md`

## Global Constraints

- No React/backend/database/authentication or unnecessary abstractions.
- Only feature/gravity-sandbox, based on develop; no push/merge/rebase/reset.
- Tests must actually run; stage explicit related paths, inspect every commit.

## Review Focus

- Coincident bodies and collision chains must stay finite and conserve momentum.
- Long frame gaps and pause must not cause a catch-up explosion.
- Pointer cancellation and touch must not launch unintended bodies.
- Small viewports and resize must retain usable controls/world coordinates.
- Repeated scene edits must not leak trails or exceed bounded body/history limits.

## Task 1: Tooling

Files: package.json, package-lock.json, tsconfig.json, index.html, vite.config.ts,
playwright.config.ts. Interfaces: npm run dev/build/test/test:e2e.

- [x] Add minimal Vite/TS/Vitest/Playwright scripts and strict TypeScript settings.
- [x] Install dependencies and Chromium; verify tools, typecheck empty scaffold.
- [x] Inspect status/diff; commit `chore: initialize vite typescript project`.

## Task 2: Physics (TDD)

Files: src/physics.ts, tests/physics.test.ts.
Interfaces: Body {id,x,y,vx,vy,mass,color,radius}; createBody, step(bodies,dt),
Simulation {bodies,time,advance(realDelta,speed),reset(bodies)}.

- [x] Write tests for attraction/mass, inertial motion, momentum/mass merging,
      coincident chains, orbit stability, frame partition independence, gap clamp.
- [x] Run npm test; observe missing-module failure.
- [x] Implement softened gravity + Verlet, iterative overlaps, bounded accumulator.
- [x] Run npm test and npm run build; commit engine and its tests together.

## Task 3: Interactive demo (browser TDD)

Files: src/main.ts, src/renderer.ts, src/presets.ts, src/style.css, tests/app.spec.ts.
Interfaces: createPreset(name): Body[]; Renderer.draw(bodies,preview,trails).

- [x] Write browser tests using labeled controls, body/time outputs and canvas
      pointer gestures for load, presets, pause/resume, creation, clear, speed, resize,
      cancellation and console errors; run to observe absent-UI failure.
- [x] Build presets, canvas effects and UI; cap bodies at 160 and trail points at 180.
- [x] Run full unit/browser/build checks; inspect desktop/mobile screenshots.
- [x] Fix issues with regression tests, commit cohesive app and browser tests.

## Task 4: Reusable skill and documentation

Files: .opencode/skills/agent-git-workflow/SKILL.md, README.md.

- [x] Use writing-skills workflow; baseline-pressure test reviewer behavior.
- [x] Write compact language-independent branch/staging/check/permission workflow.
- [x] Load skill via OpenCode and test pressure scenarios with clean-context agent.
- [x] Document commands, physics limits, skill/global installation; commit docs.

## Task 5: Independent review and delivery

- [x] Provide reviewer original task, develop diff, actual test results.
- [x] Fix blocker/major findings and rerun all checks (no confirmed defects found).
- [x] Save screenshots and report evidence, risks, current branch and commit list.
- [x] Verify clean tree and PR readiness; do not push or merge.
