import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

const PARTICLE_COUNT = 80;
const LINK_DISTANCE  = 110;
const SPEED_MAX      = 0.28;

function createParticle(W: number, H: number): Particle {
  const speed = 0.08 + Math.random() * SPEED_MAX;
  const angle = Math.random() * Math.PI * 2;
  return {
    x:      Math.random() * W,
    y:      Math.random() * H,
    vx:     Math.cos(angle) * speed,
    vy:     Math.sin(angle) * speed,
    radius: 0.8 + Math.random() * 1.4,
    alpha:  0.25 + Math.random() * 0.45,
  };
}

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0;
    let particles: Particle[] = [];

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      // Re-create particles on resize so they fill the new area
      particles = Array.from({ length: PARTICLE_COUNT }, () => createParticle(W, H));
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // ── Update + draw particles ──────────────────────────────────────
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < -2)  p.x = W + 2;
        if (p.x > W + 2) p.x = -2;
        if (p.y < -2)  p.y = H + 2;
        if (p.y > H + 2) p.y = -2;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(157, 78, 221, ${p.alpha})`;
        ctx.fill();
      }

      // ── Draw connection lines ────────────────────────────────────────
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DISTANCE) {
            const lineAlpha = (1 - dist / LINK_DISTANCE) * 0.18;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(157, 78, 221, ${lineAlpha})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
