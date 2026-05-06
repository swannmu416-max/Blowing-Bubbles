import { useRef, useEffect } from 'react';

interface Bubble {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  hue: number;
  hue2: number;
  alpha: number;
  // merge animation
  merging?: boolean;       // this bubble is being absorbed
  mergeTarget?: number;    // id of target bubble
  mergeProgress?: number;  // 0→1
}

interface BubbleCanvasProps {
  isBlowing: boolean;
  mouthOpenness: number;
  duration: number;
  onBubbleRelease: (count: number, duration: number) => void;
}

// 5 discrete bubble size tiers (radius in px)
const BUBBLE_SIZES = [14, 22, 32, 44, 58];

let nextId = 0;

/** Pick a random size tier, weighted toward smaller */
function randomRadius(): number {
  const weights = [0.35, 0.28, 0.20, 0.11, 0.06];
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (r < acc) return BUBBLE_SIZES[i];
  }
  return BUBBLE_SIZES[0];
}

/** Draw the cyber background: deep gradient + grid + center glow */
function drawBackground(ctx: CanvasRenderingContext2D, W: number, H: number) {
  // ── Deep space gradient ──────────────────────────────────────────────
  const bg = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
  bg.addColorStop(0,   '#0D0520');
  bg.addColorStop(0.6, '#08010F');
  bg.addColorStop(1,   '#04000A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Subtle grid ─────────────────────────────────────────────────────
  const GRID = 60;
  ctx.strokeStyle = 'rgba(157, 78, 221, 0.055)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = 0; x < W; x += GRID) {
    ctx.moveTo(x, 0); ctx.lineTo(x, H);
  }
  for (let y = 0; y < H; y += GRID) {
    ctx.moveTo(0, y); ctx.lineTo(W, y);
  }
  ctx.stroke();

  // ── Center radial glow ───────────────────────────────────────────────
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.38);
  glow.addColorStop(0,   'rgba(157, 78, 221, 0.055)');
  glow.addColorStop(0.5, 'rgba(157, 78, 221, 0.018)');
  glow.addColorStop(1,   'rgba(157, 78, 221, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Bottom horizon fade ──────────────────────────────────────────────
  const horizon = ctx.createLinearGradient(0, H * 0.75, 0, H);
  horizon.addColorStop(0, 'rgba(60, 9, 108, 0)');
  horizon.addColorStop(1, 'rgba(60, 9, 108, 0.12)');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, H * 0.75, W, H * 0.25);
}

/** Draw a single soap-bubble on a Canvas2D context */
function drawBubble(ctx: CanvasRenderingContext2D, b: Bubble) {
  const { x, y, radius, alpha, hue, hue2 } = b;
  if (radius <= 0 || alpha <= 0) return;

  // Shift hue toward purple range (260-300) for cyber feel
  const cyberHue  = (hue  % 60) + 260;
  const cyberHue2 = (hue2 % 60) + 280;

  ctx.save();
  ctx.globalAlpha = alpha;

  // ── Outer glow ──────────────────────────────────────────────────────
  ctx.shadowBlur = radius * 0.8;
  ctx.shadowColor = `hsla(${cyberHue}, 80%, 70%, 0.28)`;

  // ── Transparent body ────────────────────────────────────────────────
  const body = ctx.createRadialGradient(
    x - radius * 0.28, y - radius * 0.28, radius * 0.02,
    x, y, radius,
  );
  body.addColorStop(0,    `rgba(200, 170, 255, 0.10)`);
  body.addColorStop(0.55, `rgba(157,  78, 221, 0.05)`);
  body.addColorStop(1,    `rgba(100,  30, 180, 0.02)`);

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.shadowBlur = 0;

  // ── Iridescent rim ──────────────────────────────────────────────────
  const rimW = Math.max(1.4, radius * 0.048);

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${cyberHue}, 80%, 72%, 0.65)`;
  ctx.lineWidth = rimW;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, radius - rimW * 0.55, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${cyberHue2}, 85%, 80%, 0.30)`;
  ctx.lineWidth = rimW * 0.55;
  ctx.stroke();

  // ── Primary specular (top-left) ─────────────────────────────────────
  const hl1 = ctx.createRadialGradient(
    x - radius * 0.34, y - radius * 0.37, 0,
    x - radius * 0.34, y - radius * 0.37, radius * 0.30,
  );
  hl1.addColorStop(0,   `rgba(255,255,255,0.90)`);
  hl1.addColorStop(0.5, `rgba(220,200,255,0.28)`);
  hl1.addColorStop(1,   `rgba(255,255,255,0)`);
  ctx.beginPath();
  ctx.arc(x - radius * 0.34, y - radius * 0.37, radius * 0.30, 0, Math.PI * 2);
  ctx.fillStyle = hl1;
  ctx.fill();

  // ── Secondary specular (bottom-right) ───────────────────────────────
  const hl2 = ctx.createRadialGradient(
    x + radius * 0.40, y + radius * 0.36, 0,
    x + radius * 0.40, y + radius * 0.36, radius * 0.13,
  );
  hl2.addColorStop(0, `rgba(200,180,255,0.40)`);
  hl2.addColorStop(1, `rgba(255,255,255,0)`);
  ctx.beginPath();
  ctx.arc(x + radius * 0.40, y + radius * 0.36, radius * 0.13, 0, Math.PI * 2);
  ctx.fillStyle = hl2;
  ctx.fill();

  ctx.restore();
}

/** Elastic collision between two bubbles — mutates in place */
function resolveCollision(a: Bubble, b: Bubble) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;
  const nx = dx / dist;
  const ny = dy / dist;
  const dot = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
  if (dot <= 0) return;
  const imp = dot * 0.80;
  a.vx -= imp * nx; a.vy -= imp * ny;
  b.vx += imp * nx; b.vy += imp * ny;
  // Push apart so they don't overlap
  const overlap = (a.radius + b.radius - dist) / 2 + 0.5;
  a.x -= overlap * nx; a.y -= overlap * ny;
  b.x += overlap * nx; b.y += overlap * ny;
}

/**
 * Try to find a spawn position that doesn't overlap existing bubbles.
 * Returns null if no valid position found after maxTries.
 */
function findNonOverlappingPos(
  existingBubbles: Bubble[],
  radius: number,
  W: number,
  H: number,
  maxTries = 20,
): { x: number; y: number } | null {
  for (let t = 0; t < maxTries; t++) {
    const x = W * 0.5 + (Math.random() - 0.5) * W * 0.12;
    const y = H * 0.82 + (Math.random() - 0.5) * H * 0.04;
    let overlaps = false;
    for (const b of existingBubbles) {
      const dx = b.x - x;
      const dy = b.y - y;
      const minDist = b.radius + radius + 2;
      if (dx * dx + dy * dy < minDist * minDist) {
        overlaps = true;
        break;
      }
    }
    if (!overlaps) return { x, y };
  }
  return null;
}

/**
 * Compute merged radius from two bubbles (area-conserving).
 */
function mergedRadius(r1: number, r2: number): number {
  return Math.sqrt(r1 * r1 + r2 * r2);
}

export function BubbleCanvas({
  isBlowing,
  mouthOpenness,
  duration,
  onBubbleRelease,
}: BubbleCanvasProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);

  const bubblesRef       = useRef<Bubble[]>([]);
  const isBlowingRef     = useRef(false);
  const mouthOpenRef     = useRef(0);
  const durationRef      = useRef(0);
  const onReleaseRef     = useRef(onBubbleRelease);
  const lastSpawnRef     = useRef(0);
  const spawnIntervalRef = useRef(400);
  const blowCountRef     = useRef(0);
  const wasBlowingRef    = useRef(false);

  // Merge event tracking: timestamp of last merge trigger
  const lastMergeTriggerRef = useRef(0);
  // How many merge groups have fired in the current 5s cycle
  const mergeGroupsFiredRef = useRef(0);

  useEffect(() => { isBlowingRef.current = isBlowing; }, [isBlowing]);
  useEffect(() => { mouthOpenRef.current = mouthOpenness; }, [mouthOpenness]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { onReleaseRef.current = onBubbleRelease; }, [onBubbleRelease]);

  useEffect(() => {
    if (!isBlowing && wasBlowingRef.current && blowCountRef.current > 0) {
      const count = blowCountRef.current;
      const dur   = durationRef.current;
      setTimeout(() => onReleaseRef.current(count, dur), 600);
      blowCountRef.current = 0;
    }
    wasBlowingRef.current = isBlowing;
  }, [isBlowing]);

  /** Spawn one bubble near the mouth area (bottom-center of canvas) */
  const spawnBubble = (canvas: HTMLCanvasElement) => {
    const W = canvas.width;
    const H = canvas.height;
    const radius = randomRadius();
    const pos = findNonOverlappingPos(bubblesRef.current, radius, W, H);
    if (!pos) return; // skip if no room
    const hue = Math.random() * 360;
    const bubble: Bubble = {
      id: nextId++,
      x: pos.x,
      y: pos.y,
      radius,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -(0.6 + Math.random() * 0.8),
      hue,
      hue2: (hue + 80 + Math.random() * 60) % 360,
      alpha: 0.92,
    };
    bubblesRef.current = [...bubblesRef.current, bubble];
    blowCountRef.current += 1;
  };

  /**
   * Trigger one merge group: pick 2 adjacent (close) bubbles and animate them merging.
   * Returns true if a pair was found and marked.
   */
  const triggerMergeGroup = (): boolean => {
    const bubbles = bubblesRef.current.filter(b => !b.merging);
    if (bubbles.length < 2) return false;

    // Find the closest pair
    let bestDist = Infinity;
    let bestI = -1, bestJ = -1;
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const dx = bubbles[i].x - bubbles[j].x;
        const dy = bubbles[i].y - bubbles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestDist) {
          bestDist = d;
          bestI = i;
          bestJ = j;
        }
      }
    }
    if (bestI < 0) return false;

    const a = bubbles[bestI];
    const b = bubbles[bestJ];

    // Mark the smaller one as merging into the larger one
    const [absorb, target] = a.radius <= b.radius ? [a, b] : [b, a];
    absorb.merging = true;
    absorb.mergeTarget = target.id;
    absorb.mergeProgress = 0;
    return true;
  };

  // Main animation loop
  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (now: number) => {
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);
      drawBackground(ctx, W, H);

      // ── Spawn bubbles while blowing ──────────────────────────────────
      if (isBlowingRef.current) {
        const openness = Math.max(0.1, mouthOpenRef.current);
        spawnIntervalRef.current = Math.max(120, 500 - openness * 1200);

        if (now - lastSpawnRef.current > spawnIntervalRef.current) {
          spawnBubble(canvas);
          lastSpawnRef.current = now;
        }
      }

      // ── Every 5 s: trigger 3 merge groups (staggered 0 / 300 / 600 ms) ──
      const timeSinceLastCycle = now - lastMergeTriggerRef.current;
      if (timeSinceLastCycle >= 5000) {
        lastMergeTriggerRef.current = now;
        mergeGroupsFiredRef.current = 0;
      }
      // Fire group 0 at t+0, group 1 at t+300, group 2 at t+600
      const groupOffsets = [0, 300, 600];
      for (let g = mergeGroupsFiredRef.current; g < 3; g++) {
        if (timeSinceLastCycle >= groupOffsets[g]) {
          triggerMergeGroup();
          mergeGroupsFiredRef.current = g + 1;
        } else {
          break;
        }
      }

      // ── Physics update ───────────────────────────────────────────────
      let bubbles = bubblesRef.current;
      const toRemove = new Set<number>();

      for (const b of bubbles) {
        // ── Merge animation ──────────────────────────────────────────
        if (b.merging && b.mergeTarget !== undefined) {
          b.mergeProgress = (b.mergeProgress ?? 0) + 0.025; // ~40 frames = ~0.67s
          const target = bubbles.find(t => t.id === b.mergeTarget);
          if (target && b.mergeProgress < 1) {
            // Move absorbing bubble toward target
            b.x += (target.x - b.x) * 0.08;
            b.y += (target.y - b.y) * 0.08;
            // Shrink absorbing bubble
            b.radius = b.radius * (1 - b.mergeProgress * 0.03);
            b.alpha  = Math.max(0, 1 - b.mergeProgress);
          } else if (b.mergeProgress >= 1) {
            // Merge complete: grow target, remove absorbing bubble
            if (target) {
              target.radius = mergedRadius(target.radius, b.radius);
              // Cap at a reasonable max
              if (target.radius > 90) target.radius = 90;
            }
            toRemove.add(b.id);
            continue;
          }
          // Skip normal physics for merging bubbles (they just glide toward target)
          continue;
        }

        // Normal physics
        b.vy -= 0.008;
        b.vy += 0.003;
        b.vx += (Math.random() - 0.5) * 0.012;
        b.vx *= 0.998;
        b.vy *= 0.998;

        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed > 2.5) { b.vx = (b.vx / speed) * 2.5; b.vy = (b.vy / speed) * 2.5; }

        b.x += b.vx;
        b.y += b.vy;
        b.hue  = (b.hue  + 0.25) % 360;
        b.hue2 = (b.hue2 + 0.18) % 360;

        if (b.x - b.radius < 0)  { b.x = b.radius;      b.vx =  Math.abs(b.vx) * 0.8; }
        if (b.x + b.radius > W)  { b.x = W - b.radius;  b.vx = -Math.abs(b.vx) * 0.8; }
        if (b.y - b.radius < 0)  { b.y = b.radius;      b.vy =  Math.abs(b.vy) * 0.8; }
        if (b.y + b.radius > H)  { b.y = H - b.radius;  b.vy = -Math.abs(b.vy) * 0.8; }
      }

      // Remove merged-away bubbles
      if (toRemove.size > 0) {
        bubbles = bubbles.filter(b => !toRemove.has(b.id));
        bubblesRef.current = bubbles;
      }

      // ── Collision detection — only non-merging bubbles ───────────────
      const active = bubbles.filter(b => !b.merging);
      const n = active.length;
      const limit = Math.min(n, 80);
      for (let i = 0; i < limit; i++) {
        for (let j = i + 1; j < limit; j++) {
          const a = active[i], bb = active[j];
          const dx = bb.x - a.x, dy = bb.y - a.y;
          if (dx * dx + dy * dy < (a.radius + bb.radius) ** 2) {
            resolveCollision(a, bb);
          }
        }
      }

      // ── Draw all bubbles ─────────────────────────────────────────────
      for (const b of bubbles) {
        drawBubble(ctx, b);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Resize canvas to match container
  useEffect(() => {
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        canvas.width  = Math.floor(e.contentRect.width);
        canvas.height = Math.floor(e.contentRect.height);
      }
    });
    ro.observe(container);
    canvas.width  = container.clientWidth;
    canvas.height = container.clientHeight;
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
