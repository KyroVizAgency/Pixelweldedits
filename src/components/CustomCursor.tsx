import { useEffect, useRef } from 'react';

interface TrailNode {
  x: number;
  y: number;
  timestamp: number;
}

type CursorMode = 'default' | 'pointer' | 'work' | 'stage';

export function CustomCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const finePointerMq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotionMq = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!finePointerMq.matches || reducedMotionMq.matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    document.body.classList.add('pw-custom-cursor-active');

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let visible = false;
    let targetX = width * 0.5;
    let targetY = height * 0.5;
    let coreX = targetX;
    let coreY = targetY;
    let ringX = targetX;
    let ringY = targetY;

    let ringRadius = 11;
    let targetRingRadius = 11;
    let ringAlpha = 0.55;
    let targetRingAlpha = 0.55;
    let mode: CursorMode = 'default';
    let labelText = '';

    const MAX_NODES = 22;
    const TRAIL_LIFETIME_MS = 380;
    const nodes: TrailNode[] = [];

    const detectTargetMode = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        mode = 'default';
        labelText = '';
        return;
      }

      const customZone = target.closest('[data-cursor]');
      if (customZone) {
        const attr = customZone.getAttribute('data-cursor');
        if (attr === 'work') {
          mode = 'work';
          labelText = 'VIEW';
          return;
        }
        if (attr === 'stage') {
          mode = 'stage';
          labelText = 'ORBIT';
          return;
        }
      }

      const interactive = target.closest(
        'a, button, [role="button"], input, textarea, select, summary'
      );
      if (interactive) {
        mode = 'pointer';
        labelText = '';
        return;
      }

      mode = 'default';
      labelText = '';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) {
        visible = true;
        coreX = targetX;
        coreY = targetY;
        ringX = targetX;
        ringY = targetY;
      }
      detectTargetMode(e.target);

      const now = performance.now();
      const last = nodes[0];
      if (!last || Math.hypot(targetX - last.x, targetY - last.y) > 2.5) {
        nodes.unshift({ x: targetX, y: targetY, timestamp: now });
        if (nodes.length > MAX_NODES) {
          nodes.pop();
        }
      }
    };

    const onPointerDown = () => {
      targetRingRadius = mode === 'work' ? 28 : 16;
    };

    const onPointerUp = () => {
      detectTargetMode(document.elementFromPoint(targetX, targetY));
    };

    const onMouseLeave = () => {
      visible = false;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    let rafId = 0;
    let lastFrame = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;

      ctx.clearRect(0, 0, width, height);

      // Prune expired trail points so the glow never stays permanently on screen
      while (nodes.length > 0 && now - nodes[nodes.length - 1].timestamp > TRAIL_LIFETIME_MS) {
        nodes.pop();
      }

      if (visible) {
        // Exponential damping for liquid-smooth motion
        const coreFactor = 1 - Math.exp(-36 * dt);
        const ringFactor = 1 - Math.exp(-14 * dt);

        coreX += (targetX - coreX) * coreFactor;
        coreY += (targetY - coreY) * coreFactor;
        ringX += (targetX - ringX) * ringFactor;
        ringY += (targetY - ringY) * ringFactor;

        if (mode === 'work' || mode === 'stage') {
          targetRingRadius = 30;
          targetRingAlpha = 0.92;
        } else if (mode === 'pointer') {
          targetRingRadius = 21;
          targetRingAlpha = 0.85;
        } else {
          targetRingRadius = 11;
          targetRingAlpha = 0.45;
        }

        ringRadius += (targetRingRadius - ringRadius) * (1 - Math.exp(-16 * dt));
        ringAlpha += (targetRingAlpha - ringAlpha) * (1 - Math.exp(-14 * dt));

        // Gently pull consecutive trail nodes toward the core for fluid taper
        for (let i = 0; i < nodes.length; i++) {
          const prev = i === 0 ? { x: coreX, y: coreY } : nodes[i - 1];
          const pull = 1 - Math.exp(-18 * dt);
          nodes[i].x += (prev.x - nodes[i].x) * pull * 0.35;
          nodes[i].y += (prev.y - nodes[i].y) * pull * 0.35;
        }

        // Draw flowing blue light ribbon
        if (nodes.length >= 2) {
          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          for (let i = 0; i < nodes.length - 1; i++) {
            const p0 = i === 0 ? { x: coreX, y: coreY, timestamp: now } : nodes[i];
            const p1 = nodes[i + 1];
            const age = (now - p1.timestamp) / TRAIL_LIFETIME_MS;
            const life = Math.max(0, 1 - age);
            const progress = 1 - i / nodes.length;
            const alpha = life * progress * 0.42;

            if (alpha <= 0.01) continue;

            const midX = (p0.x + p1.x) * 0.5;
            const midY = (p0.y + p1.y) * 0.5;

            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
            ctx.strokeStyle =
              progress > 0.55
                ? `rgba(94, 183, 255, ${alpha})`
                : `rgba(22, 102, 197, ${alpha * 0.9})`;
            ctx.lineWidth = Math.max(1, 5.5 * progress * life);
            ctx.shadowColor = 'rgba(56, 152, 236, 0.55)';
            ctx.shadowBlur = 12 * progress;
            ctx.stroke();
          }
          ctx.restore();
        }

        // Soft halo under the indicator ring
        const halo = ctx.createRadialGradient(ringX, ringY, 0, ringX, ringY, ringRadius * 1.9);
        halo.addColorStop(0, `rgba(56, 152, 236, ${mode === 'default' ? 0.14 : 0.22})`);
        halo.addColorStop(1, 'rgba(56, 152, 236, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(ringX, ringY, ringRadius * 1.9, 0, Math.PI * 2);
        ctx.fill();

        // Outer interactive ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(ringX, ringY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(94, 183, 255, ${ringAlpha})`;
        ctx.lineWidth = mode === 'default' ? 1 : 1.35;
        ctx.stroke();

        if (labelText) {
          ctx.fillStyle = '#F4F7FC';
          ctx.font = '500 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, ringX, ringY);
        }
        ctx.restore();

        // Precise luminous core point
        if (!labelText) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(coreX, coreY, mode === 'pointer' ? 2.2 : 3, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = '#5EB7FF';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    const handlePrefChange = () => {
      if (!finePointerMq.matches || reducedMotionMq.matches) {
        document.body.classList.remove('pw-custom-cursor-active');
        ctx.clearRect(0, 0, width, height);
      }
    };

    finePointerMq.addEventListener('change', handlePrefChange);
    reducedMotionMq.addEventListener('change', handlePrefChange);

    return () => {
      cancelAnimationFrame(rafId);
      document.body.classList.remove('pw-custom-cursor-active');
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      finePointerMq.removeEventListener('change', handlePrefChange);
      reducedMotionMq.removeEventListener('change', handlePrefChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 hidden md:block"
    />
  );
}
