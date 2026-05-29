"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: [number, number, number];
  life: number;
  maxLife: number;
  type: "spark" | "ember" | "burst";
}

interface FireParticlesProps {
  intensity: number;
  isExplosive: boolean;
}

const COLORS: [number, number, number][] = [
  [255, 50, 0],
  [255, 100, 0],
  [255, 160, 0],
  [255, 200, 50],
  [255, 255, 100],
  [255, 255, 200],
];

export default function FireParticles({ intensity, isExplosive }: FireParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intensityRef = useRef(0);
  const explosiveRef = useRef(false);
  intensityRef.current = intensity;
  explosiveRef.current = isExplosive;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: Particle[] = [];
    let w = 0;
    let h = 0;

    const resize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx!.scale(dpr, dpr);
      w = rect.width;
      h = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = (cx: number, cy: number, radius: number) => {
      const inten = intensityRef.current;
      const expl = explosiveRef.current;
      if (inten <= 0) return;

      const count = expl
        ? Math.floor(inten * 12) + 3
        : Math.floor(inten * 5) + 1;

      for (let i = 0; i < count; i++) {
        if (particles.length >= (expl ? 1000 : 400)) break;

        const angle = Math.random() * Math.PI * 2;
        const dist = radius + (Math.random() - 0.5) * 8;
        const speed = (1 + Math.random() * 2.5) * (1 + inten * 3) * (expl ? 3 : 1);
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const type: Particle["type"] =
          expl && Math.random() < 0.4 ? "burst" : Math.random() < 0.3 ? "ember" : "spark";

        let vx = Math.cos(angle) * speed;
        let vy = Math.sin(angle) * speed;
        if (type === "ember") vy -= Math.random() * 1.5;
        if (type === "burst") {
          vx *= 1.5 + Math.random() * 2;
          vy *= 1.5 + Math.random() * 2;
        }

        particles.push({
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          vx,
          vy,
          size: type === "ember" ? 2 + Math.random() * 3 : 1 + Math.random() * 2.5,
          alpha: 0.6 + Math.random() * 0.4,
          color,
          life: 0,
          maxLife: type === "burst" ? 0.5 + Math.random() * 0.5 : 0.8 + Math.random() * 1.2,
          type,
        });
      }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      if (intensityRef.current > 0) {
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(w, h) * 0.42;
        spawn(cx, cy, radius);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.type === "spark") {
          p.vy += 0.03;
          p.vx *= 0.98;
          p.vy *= 0.98;
        } else if (p.type === "ember") {
          p.vy -= 0.01;
          p.vx *= 0.995;
        } else {
          p.vy += 0.02;
          p.vx *= 0.97;
          p.vy *= 0.97;
        }

        p.life += 0.016 / p.maxLife;
        const lifeRatio = Math.min(p.life, 1);
        const currentAlpha = p.alpha * (1 - lifeRatio);

        if (currentAlpha <= 0 || lifeRatio >= 1) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = currentAlpha;

        const glowSize = p.size * (p.type === "burst" ? 6 : 3);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        const [r, g, b] = p.color;
        grad.addColorStop(0, `rgba(${r},${g},${b},${currentAlpha})`);
        grad.addColorStop(0.4, `rgba(${r},${g},${b},${currentAlpha * 0.4})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        if (p.type === "burst" || (explosiveRef.current && Math.random() < 0.2)) {
          ctx.globalAlpha = currentAlpha * 0.7;
          ctx.fillStyle = `rgba(255,255,255,${currentAlpha * 0.5})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
    />
  );
}
