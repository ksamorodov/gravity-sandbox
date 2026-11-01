import type { Body } from './physics';

export interface Point {
  x: number;
  y: number;
}
export interface LaunchPreview {
  start: Point;
  end: Point;
  mass: number;
  color: string;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width = 1;
  private height = 1;
  private scale = 1;
  private trails = new Map<number, Point[]>();
  private lastTime = -1;
  private observer: ResizeObserver;
  private lastDraw: Parameters<Renderer['draw']> | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser does not support Canvas 2D');
    this.ctx = ctx;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
  }

  private resize(): void {
    const box = this.canvas.getBoundingClientRect();
    this.width = box.width;
    this.height = box.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const width = Math.round(this.width * dpr),
      height = Math.round(this.height * dpr);
    const changed = this.canvas.width !== width || this.canvas.height !== height;
    if (changed) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.scale = Math.min(this.width / 1040, this.height / 940);
    if (changed && this.lastDraw) this.draw(...this.lastDraw);
  }

  toWorld(clientX: number, clientY: number): Point {
    const box = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - box.left - this.width / 2) / this.scale,
      y: (clientY - box.top - this.height / 2) / this.scale,
    };
  }

  clearTrails(): void {
    this.trails.clear();
    this.lastTime = -1;
  }

  draw(
    bodies: Body[],
    time: number,
    showTrails: boolean,
    guides: boolean,
    preview: LaunchPreview | null,
  ): void {
    this.lastDraw = [bodies, time, showTrails, guides, preview];
    const c = this.ctx;
    c.setTransform(this.canvas.width / this.width, 0, 0, this.canvas.height / this.height, 0, 0);
    this.background(guides);
    c.save();
    c.translate(this.width / 2, this.height / 2);
    c.scale(this.scale, this.scale);

    const alive = new Set(bodies.map((b) => b.id));
    for (const id of this.trails.keys()) if (!alive.has(id)) this.trails.delete(id);
    const sample = showTrails && time !== this.lastTime;
    for (const b of bodies) {
      let points = this.trails.get(b.id);
      if (!points) {
        points = [];
        this.trails.set(b.id, points);
      }
      const last = points.at(-1);
      if (sample && (!last || Math.hypot(last.x - b.x, last.y - b.y) > 0.3)) {
        points.push({ x: b.x, y: b.y });
        if (points.length > 180) points.shift();
      }
      if (showTrails && points.length > 1) {
        c.lineWidth = 1.5 / this.scale;
        c.strokeStyle = b.color;
        c.shadowColor = b.color;
        c.shadowBlur = 3;
        // Draw in a few opacity bands rather than a shadow-blurred path per segment.
        for (let band = 0; band < 6; band++) {
          const start = Math.floor((band * (points.length - 1)) / 6);
          const end = Math.floor(((band + 1) * (points.length - 1)) / 6);
          c.globalAlpha = 0.08 + band * 0.085;
          c.beginPath();
          c.moveTo(points[start].x, points[start].y);
          for (let i = start + 1; i <= end; i++) c.lineTo(points[i].x, points[i].y);
          c.stroke();
        }
        c.globalAlpha = 1;
        c.shadowBlur = 0;
      }
    }
    this.lastTime = time;
    for (const b of bodies) this.body(b.x, b.y, b.radius, b.color, b.mass > 1000);
    if (preview) this.preview(preview);
    c.restore();
  }

  private background(guides: boolean): void {
    const c = this.ctx,
      w = this.width,
      h = this.height;
    c.fillStyle = '#080c16';
    c.fillRect(0, 0, w, h);
    const nebula = c.createRadialGradient(w * 0.6, h * 0.35, 0, w * 0.6, h * 0.35, w * 0.65);
    nebula.addColorStop(0, '#16172d');
    nebula.addColorStop(0.6, '#0c1422');
    nebula.addColorStop(1, '#080c16');
    c.fillStyle = nebula;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 180; i++) {
      const x = (((Math.sin(i * 127.1 + 3) * 43758.5453) % 1) + 1) % 1;
      const y = (((Math.sin(i * 311.7 + 8) * 96453.738) % 1) + 1) % 1;
      c.fillStyle = i % 4 === 0 ? '#aeb5d07a' : '#808da63d';
      c.beginPath();
      c.arc(x * w, y * h, i % 9 === 0 ? 1.1 : 0.65, 0, Math.PI * 2);
      c.fill();
    }
    c.save();
    c.translate(w / 2, h / 2);
    c.scale(this.scale, this.scale);
    c.lineWidth = 1 / this.scale;
    c.strokeStyle = '#a3b4db0a';
    c.beginPath();
    c.moveTo(-w / this.scale, 0);
    c.lineTo(w / this.scale, 0);
    c.moveTo(0, -h / this.scale);
    c.lineTo(0, h / this.scale);
    c.stroke();
    if (guides) {
      c.strokeStyle = '#a3b4db12';
      for (const r of [95, 145, 205, 275, 345, 425]) {
        c.beginPath();
        c.arc(0, 0, r, 0, Math.PI * 2);
        c.stroke();
      }
    }
    c.restore();
  }

  private body(x: number, y: number, radius: number, color: string, star = false): void {
    const c = this.ctx,
      r = Math.max(radius, 3 / this.scale);
    const glowSize = r * (star ? 5 : 4);
    const glow = c.createRadialGradient(x, y, r * 0.5, x, y, glowSize);
    glow.addColorStop(0, `${color}${star ? '55' : '35'}`);
    glow.addColorStop(1, `${color}00`);
    c.fillStyle = glow;
    c.beginPath();
    c.arc(x, y, glowSize, 0, Math.PI * 2);
    c.fill();
    const sphere = c.createRadialGradient(x - r * 0.3, y - r * 0.4, 0, x, y, r);
    sphere.addColorStop(0, star ? '#fff3cf' : '#f2f5ff');
    sphere.addColorStop(0.35, color);
    sphere.addColorStop(1, color);
    c.fillStyle = sphere;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    if (star) {
      c.strokeStyle = `${color}35`;
      c.lineWidth = 1 / this.scale;
      c.beginPath();
      c.arc(x, y, r + 5 / this.scale, 0, Math.PI * 2);
      c.stroke();
    }
  }

  private preview({ start, end, mass, color }: LaunchPreview): void {
    const c = this.ctx;
    this.body(start.x, start.y, Math.cbrt(mass) * 1.3, color);
    c.strokeStyle = '#b5f1e6';
    c.lineWidth = 1.5 / this.scale;
    c.setLineDash([5 / this.scale, 5 / this.scale]);
    c.beginPath();
    c.moveTo(start.x, start.y);
    c.lineTo(end.x, end.y);
    c.stroke();
    c.setLineDash([]);
    const angle = Math.atan2(end.y - start.y, end.x - start.x),
      head = 9 / this.scale;
    c.beginPath();
    c.moveTo(end.x - head * Math.cos(angle - 0.5), end.y - head * Math.sin(angle - 0.5));
    c.lineTo(end.x, end.y);
    c.lineTo(end.x - head * Math.cos(angle + 0.5), end.y - head * Math.sin(angle + 0.5));
    c.stroke();
  }
}
