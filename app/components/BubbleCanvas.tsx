import { useRef, useEffect, useCallback } from 'react';

interface Bubble {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  hue: number; // base hue for iridescent rim
}

interface BubbleCanvasProps {
  isBlowing: boolean;
  mouthOpenness: number;
  duration: number;
  onBubbleRelease: (size: number, duration: number) => void;
  gravity: number;
  wind: number;
  surfaceTension: number;
}

let nextId = 0;

export function BubbleCanvas({
  isBlowing,
  mouthOpenness,
  duration,
  onBubbleRelease,
  gravity,
  wind,
  surfaceTension,
}: BubbleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);

  // All state lives in refs so the animation loop always sees fresh values
  const bubblesRef = useRef<Bubble[]>([]);
  const activeBubbleRef = useRef<Bubble | null>(null);
  const isBlowingRef = useRef(false);
  const mouthOpennessRef = useRef(0);
  const durationRef = useRef(0);
  const gravityRef = useRef(gravity);
  const windRef = useRef(wind);
  const surfaceTensionRef = useRef(surfaceTension);
  const onBubbleReleaseRef = useRef(onBubbleRelease);
  const lastSpawnRef = useRef(0); // timestamp of last auto-spawn

  // Keep refs in sync with props
  useEffect(() => { isBlowingRef.current = isBlowing; }, [isBlowing]);
  useEffect(() => { mouthOpennessRef.current = mouthOpenness; }, [mouthOpenness]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { gravityRef.current = gravity; }, [gravity]);
  useEffect(() => { windRef.current = wind; }, [wind]);
  useEffect(() => { surfaceTensionRef.current = surfaceTension; }, [surfaceTension]);
  useEffect(() => { onBubbleReleaseRef.current = onBubbleRelease; }, [onBubbleRelease]);

  // Handle blow start / stop via isBlowing prop changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isBlowing) {
      // Start a new active bubble if none exists
      if (!activeBubbleRef.current) {
        activeBubbleRef.current = {
          id: nextId++,
          x: canvas.width / 2,
          y: canvas.height * 0.55,
          radius: 12,
          vx: 0,
          vy: 0,
          alpha: 0.9,
          hue: Math.random() * 360,
        };
        lastSpawnRef.current = performance.now();
      }
    } else {
      // Release active bubble
      if (activeBubbleRef.current) {
        const b = activeBubbleRef.current;
        const released: Bubble = {
          ...b,
          vy: -1.8 - b.radius / 60,
          vx: (Math.random() - 0.5) * 1.5,
        };
        bubblesRef.current = [...bubblesRef.current, released];
        onBubbleReleaseRef.current(b.radius, durationRef.current);
        activeBubbleRef.current = null;
      }
    }
  }, [isBlowing]);

  // Draw a single bubble with realistic soap-bubble look
  const drawBubble = useCallback((ctx: CanvasRenderingContext2D, b: Bubble) => {
    const { x, y, radius, alpha, hue } = b;

    ctx.save();

    // Outer soft glow
    ctx.shadowBlur = radius * 0.6;
    ctx.shadowColor = `hsla(${hue}, 60%, 80%, ${alpha * 0.25})`;

    // Transparent body — very subtle fill
    const bodyGrad = ctx.createRadialGradient(
      x - radius * 0.25, y - radius * 0.25, radius * 0.02,
      x, y, radius
    );
    bodyGrad.addColorStop(0,   `rgba(240, 248, 255, ${alpha * 0.07})`);
    bodyGrad.addColorStop(0.6, `rgba(200, 220, 255, ${alpha * 0.04})`);
    bodyGrad.addColorStop(1,   `rgba(160, 190, 255, ${alpha * 0.02})`);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.shadowBlur = 0;

    // Iridescent rim — two overlapping strokes with offset hues
    const rimWidth = Math.max(1.2, radius * 0.045);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${hue}, 75%, 72%, ${alpha * 0.55})`;
    ctx.lineWidth = rimWidth;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, radius - rimWidth * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${(hue + 80) % 360}, 80%, 78%, ${alpha * 0.3})`;
    ctx.lineWidth = rimWidth * 0.6;
    ctx.stroke();

    // Primary specular highlight — top-left
    const hl1 = ctx.createRadialGradient(
      x - radius * 0.35, y - radius * 0.38, 0,
      x - radius * 0.35, y - radius * 0.38, radius * 0.32
    );
    hl1.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.82})`);
    hl1.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.25})`);
    hl1.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(x - radius * 0.35, y - radius * 0.38, radius * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = hl1;
    ctx.fill();

    // Secondary specular — bottom-right, smaller and dimmer
    const hl2 = ctx.createRadialGradient(
      x + radius * 0.42, y + radius * 0.38, 0,
      x + radius * 0.42, y + radius * 0.38, radius * 0.14
    );
    hl2.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.35})`);
    hl2.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(x + radius * 0.42, y + radius * 0.38, radius * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = hl2;
    ctx.fill();

    ctx.restore();
  }, []);

  // Elastic collision between two bubbles (modifies in place)
  const resolveCollision = (a: Bubble, b: Bubble) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    // Normalised collision axis
    const nx = dx / dist;
    const ny = dy / dist;

    // Relative velocity along collision axis
    const dvx = a.vx - b.vx;
    const dvy = a.vy - b.vy;
    const dot = dvx * nx + dvy * ny;

    // Only resolve if approaching
    if (dot <= 0) return;

    // Simple equal-mass elastic: swap velocity components along normal
    const impulse = dot * 0.85; // slight energy loss
    a.vx -= impulse * nx;
    a.vy -= impulse * ny;
    b.vx += impulse * nx;
    b.vy += impulse * ny;

    // Separate overlapping bubbles
    const overlap = (a.radius + b.radius - dist) / 2;
    a.x -= overlap * nx;
    a.y -= overlap * ny;
    b.x += overlap * nx;
    b.y += overlap * ny;
  };

  // Main animation loop — runs once, reads from refs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const g = gravityRef.current;
      const w = windRef.current;
      const st = surfaceTensionRef.current;
      const W = canvas.width;
      const H = canvas.height;

      // ── Active bubble ──────────────────────────────────────────────
      if (activeBubbleRef.current && isBlowingRef.current) {
        const ab = activeBubbleRef.current;
        const growthRate = 0.6 + mouthOpennessRef.current * 1.8;
        const maxRadius = 80 + st * 80; // 80–160px depending on surface tension
        ab.radius = Math.min(ab.radius + growthRate, maxRadius);
        // Subtle jitter while blowing
        ab.x += (Math.random() - 0.5) * 0.5;
        ab.y += (Math.random() - 0.5) * 0.5;
        ab.hue = (ab.hue + 0.5) % 360;

        drawBubble(ctx, ab);

        // Auto-spawn a small satellite bubble every 1.8s while blowing
        if (now - lastSpawnRef.current > 1800 && ab.radius > 20) {
          const angle = Math.random() * Math.PI * 2;
          const spawnR = 6 + Math.random() * 14;
          const satellite: Bubble = {
            id: nextId++,
            x: ab.x + (ab.radius + spawnR + 2) * Math.cos(angle),
            y: ab.y + (ab.radius + spawnR + 2) * Math.sin(angle),
            radius: spawnR,
            vx: (Math.random() - 0.5) * 2.5,
            vy: -1 - Math.random() * 1.5,
            alpha: 0.85,
            hue: (ab.hue + 120 + Math.random() * 60) % 360,
          };
          bubblesRef.current = [...bubblesRef.current, satellite];
          lastSpawnRef.current = now;
        }
      }

      // ── Floating bubbles ───────────────────────────────────────────
      let updated = bubblesRef.current.map((b) => {
        let { x, y, vx, vy, alpha, radius, hue } = b;

        // Physics
        vy -= g * 0.04;          // buoyancy (upward)
        vy += 0.015;              // tiny gravity pull
        vx += w * 0.03;          // wind
        vx *= 0.999;              // drag
        vy *= 0.999;

        x += vx;
        y += vy;
        hue = (hue + 0.3) % 360;

        // Boundary bounce
        if (x - radius < 0)  { x = radius;      vx = Math.abs(vx) * 0.8; }
        if (x + radius > W)  { x = W - radius;  vx = -Math.abs(vx) * 0.8; }
        if (y - radius < 0)  { y = radius;      vy = Math.abs(vy) * 0.8; }
        if (y + radius > H)  { y = H - radius;  vy = -Math.abs(vy) * 0.8; }

        // Alpha decay — larger bubbles last longer
        const decayRate = 0.0008 + 0.002 * (12 / Math.max(radius, 12));
        alpha -= decayRate;

        return { ...b, x, y, vx, vy, alpha, hue };
      }).filter((b) => b.alpha > 0);

      // Collision detection — O(n²), acceptable for <100 bubbles
      for (let i = 0; i < updated.length; i++) {
        for (let j = i + 1; j < updated.length; j++) {
          const a = updated[i];
          const bub = updated[j];
          const dx = bub.x - a.x;
          const dy = bub.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < a.radius + bub.radius) {
            resolveCollision(a, bub);
          }
        }
      }

      updated.forEach((b) => drawBubble(ctx, b));
      bubblesRef.current = updated;

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [drawBubble]); // only re-run if drawBubble changes (never)

  // Resize canvas to match container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = Math.floor(width);
        canvas.height = Math.floor(height);
      }
    });

    observer.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    return () => observer.disconnect();
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
