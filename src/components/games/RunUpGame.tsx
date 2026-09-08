"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LEVELS, levelForDistance, STAR_STAMP_RATIO, ObstacleKind, LevelDef } from "@/lib/levels";
import { LevelProgressEntry } from "@/lib/usePlayer";

type GamePhase = "tutorial" | "idle" | "running" | "paused" | "levelup" | "over";

const PHYS = {
  gravity: 0.62,
  jumpVelocity: -12.4,
  holdBoost: -0.34,
  maxHoldFrames: 9,
  slideFrames: 28,
  groundYRatio: 0.8,
  coyote: 6,
};
const METERS_PER_PX = 0.12;
const OVERHEAD_KINDS: ObstacleKind[] = ["banner", "steam", "rope", "drone", "confetti"];

interface Obstacle { x: number; y: number; w: number; h: number; kind: ObstacleKind; hintShown?: boolean; }
interface Stamp { x: number; y: number; r: number; taken: boolean; }
interface LevelRunStats { collected: number; spawned: number; }
export interface RunUpResult {
  distanceM: number;
  stamps: number;
  stampPoints: number;
  reachedGate: boolean;
  levelResults: { level: number; stars: number; distanceReached: number }[];
}

const TUTORIAL_KEY = "vybeRunUpTutorialSeen";

export default function RunUpGame({
  gateDistanceToday,
  levelProgress,
  onGameOver,
}: {
  gateDistanceToday: number;
  levelProgress: LevelProgressEntry[];
  onGameOver: (result: RunUpResult) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [hudDistance, setHudDistance] = useState(0);
  const [hudStamps, setHudStamps] = useState(0);
  const [hudCombo, setHudCombo] = useState(0);
  const [hudLevel, setHudLevel] = useState<LevelDef>(LEVELS[0]);
  const [levelUpInfo, setLevelUpInfo] = useState<LevelDef | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [comboFlash, setComboFlash] = useState(0);
  const [missFlash, setMissFlash] = useState(0);

  const gameRef = useRef({
    distance: 0,
    speed: LEVELS[0].speedFrom,
    frame: 0,
    player: { y: 0, vy: 0, sliding: 0, grounded: true, coyote: 0, holdFrames: 0, w: 34, h: 46 },
    obstacles: [] as Obstacle[],
    stamps: [] as Stamp[],
    stampsCollected: 0,
    stampPoints: 0,
    combo: 0,
    spawnTimer: 0,
    glimpseSeen: false,
    gateFlashUntil: 0,
    worldOffset: 0,
    currentLevelIdx: 0,
    levelStats: {} as Record<number, LevelRunStats>,
    hintsShown: { jump: false, slide: false },
    levelUpUntil: 0,
  });
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef<GamePhase>("idle");
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    const seen = typeof window !== "undefined" ? localStorage.getItem(TUTORIAL_KEY) : "true";
    if (!seen) { setShowTutorial(true); setPhase("tutorial"); }
  }, []);

  function dismissTutorial() {
    localStorage.setItem(TUTORIAL_KEY, "true");
    setShowTutorial(false);
    setPhase("idle");
  }

  const groundY = useCallback((h: number) => h * PHYS.groundYRatio, []);

  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const h = canvas.getBoundingClientRect().height;
    const g = gameRef.current;
    g.distance = 0; g.speed = LEVELS[0].speedFrom; g.frame = 0;
    g.obstacles = []; g.stamps = []; g.stampsCollected = 0; g.stampPoints = 0; g.combo = 0;
    g.spawnTimer = 0; g.glimpseSeen = false;
    g.player = { y: groundY(h) - 46, vy: 0, sliding: 0, grounded: true, coyote: 0, holdFrames: 0, w: 34, h: 46 };
    g.worldOffset = 0;
    g.currentLevelIdx = 0;
    g.levelStats = { 1: { collected: 0, spawned: 0 } };
    g.hintsShown = { jump: false, slide: false };
    setHudDistance(0); setHudStamps(0); setHudCombo(0); setHudLevel(LEVELS[0]);
  }, [groundY]);

  const startRun = useCallback(() => {
    resetGame();
    setPhase("running");
  }, [resetGame]);

  const jump = useCallback(() => {
    const g = gameRef.current;
    if (phaseRef.current !== "running") return;
    const p = g.player;
    if (p.grounded || p.coyote > 0) {
      p.vy = PHYS.jumpVelocity; p.grounded = false; p.coyote = 0; p.holdFrames = 0;
    }
  }, []);
  const startSlide = useCallback(() => {
    if (phaseRef.current === "running" && gameRef.current.player.grounded) {
      gameRef.current.player.sliding = PHYS.slideFrames;
    }
  }, []);

  const endRunRef = useRef<() => void>(() => {});
  endRunRef.current = () => {
    const g = gameRef.current;
    const distM = Math.round(g.distance * METERS_PER_PX);
    setPhase("over");

    const levelResults: RunUpResult["levelResults"] = [];
    for (const L of LEVELS) {
      if (distM < L.distanceFrom) break;
      const stats = g.levelStats[L.level] || { collected: 0, spawned: 0 };
      let stars = 0;
      let distanceReached: number;
      if (L.level === 5) {
        distanceReached = distM;
        if (distM >= L.distanceFrom) stars = 1;
        if (stats.collected >= 8) stars = Math.max(stars, 2);
        if (distM >= L.distanceFrom + 1000) stars = Math.max(stars, 3);
      } else {
        const bandEnd = L.distanceTo as number;
        const completed = distM >= bandEnd;
        distanceReached = Math.min(distM, bandEnd) - L.distanceFrom;
        if (completed) {
          stars = 2;
          if (stats.spawned === 0 || stats.collected / stats.spawned >= STAR_STAMP_RATIO) stars = 3;
        }
      }
      levelResults.push({ level: L.level, stars, distanceReached });
    }

    onGameOver({
      distanceM: distM,
      stamps: g.stampsCollected,
      stampPoints: g.stampPoints,
      reachedGate: g.glimpseSeen,
      levelResults,
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let dpr = 1;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const skyline = Array.from({ length: 22 }, (_, i) => ({ x: i * 70, h: 40 + ((Math.sin(i * 3.1) + 1) / 2) * 90 }));

    function spawnObstacle(level: LevelDef) {
      const g = gameRef.current;
      const kind = level.obstaclePool[Math.floor(Math.random() * level.obstaclePool.length)];
      const overhead = OVERHEAD_KINDS.includes(kind);
      const dims: Record<ObstacleKind, { w: number; h: number }> = {
        trolley: { w: 40, h: 40 }, banner: { w: 64, h: 24 },
        danfo: { w: 72, h: 58 }, okada: { w: 46, h: 40 }, pothole: { w: 50, h: 14 },
        steam: { w: 50, h: 30 }, crowd: { w: 64, h: 50 }, speaker: { w: 42, h: 56 },
        bouncer: { w: 30, h: 60 }, rope: { w: 70, h: 20 }, confetti: { w: 60, h: 40 },
        drone: { w: 28, h: 20 },
      };
      const { w, h } = dims[kind];
      const rect = canvas!.getBoundingClientRect();
      const gy = groundY(rect.height);
      const y = overhead ? gy - h - 46 : gy - h;
      const needsHint = !overhead ? !g.hintsShown.jump : !g.hintsShown.slide;
      if (!overhead) g.hintsShown.jump = true; else g.hintsShown.slide = true;
      g.obstacles.push({ x: rect.width + 40, y, w, h, kind, hintShown: needsHint });
    }
    function spawnStamp(level: LevelDef) {
      const g = gameRef.current;
      const rect = canvas!.getBoundingClientRect();
      const gy = groundY(rect.height);
      g.stamps.push({ x: rect.width + 40, y: gy - 90 - Math.random() * 60, r: 11, taken: false });
      const stats = g.levelStats[level.level] || { collected: 0, spawned: 0 };
      stats.spawned++;
      g.levelStats[level.level] = stats;
    }

    function drawPlayer(px: number, p: typeof gameRef.current.player) {
      const w = p.w, h = p.h, sliding = p.sliding > 0, airborne = !p.grounded;
      const ph = sliding ? h * 0.55 : h;
      const py = sliding ? p.y + (h - ph) : p.y;
      const cx = px + w / 2;
      const grad = ctx.createLinearGradient(px, py, px + w, py + ph);
      grad.addColorStop(0, "#F4F6FA"); grad.addColorStop(1, "#BFE9F7");
      ctx.fillStyle = grad;
      if (sliding) {
        ctx.beginPath(); ctx.ellipse(cx, py + ph / 2, w * 0.62, ph * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + w * 0.82, py + ph * 0.35, ph * 0.32, 0, Math.PI * 2); ctx.fill();
        return;
      }
      const headR = w * 0.26, headY = py + headR * 1.05, bodyTop = headY + headR * 0.8, bodyBot = py + h * 0.72;
      ctx.beginPath(); ctx.arc(cx, headY, headR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.16, bodyTop); ctx.lineTo(cx + w * 0.22, bodyTop + 2);
      ctx.lineTo(cx + w * 0.10, bodyBot); ctx.lineTo(cx - w * 0.22, bodyBot);
      ctx.closePath(); ctx.fill();
      const phase2 = airborne ? 0.6 : (Math.floor(gameRef.current.frame / 4) % 2 === 0 ? 1 : -1);
      const legLen = h - bodyBot + py;
      ctx.lineWidth = Math.max(3, w * 0.12); ctx.lineCap = "round"; ctx.strokeStyle = "#BFE9F7";
      ctx.beginPath(); ctx.moveTo(cx - w * 0.06, bodyBot);
      ctx.lineTo(cx - w * 0.06 - phase2 * w * 0.30, bodyBot + legLen * 0.55);
      ctx.lineTo(cx - w * 0.10 - phase2 * w * 0.10, py + h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + w * 0.08, bodyBot);
      ctx.lineTo(cx + w * 0.08 + phase2 * w * 0.28, bodyBot + legLen * 0.5);
      ctx.lineTo(cx + w * 0.14 + phase2 * w * 0.06, py + h); ctx.stroke();
    }

    function drawObstacle(o: Obstacle) {
      const flavorColors: Record<ObstacleKind, string> = {
        trolley: "#5b6b8c", banner: "#8a5a22", danfo: "#233b66", okada: "#3b4f78",
        pothole: "#1a2436", steam: "#6b7b8f", crowd: "#42305c", speaker: "#2a2a2a",
        bouncer: "#3a2233", rope: "#7a3030", confetti: "#7cc24a", drone: "#4a4a52",
      };
      ctx.save();
      ctx.fillStyle = flavorColors[o.kind] ?? "#233b66";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(o.x, o.y, o.w, o.h, 4); else ctx.rect(o.x, o.y, o.w, o.h);
      ctx.fill();
      const pulse = 0.55 + Math.sin(gameRef.current.frame * 0.15) * 0.25;
      ctx.strokeStyle = `rgba(226,58,58,${pulse})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = "rgba(240,162,60,0.65)";
      ctx.lineWidth = 2;
      for (let sx = o.x + 2; sx < o.x + o.w - 2; sx += 8) {
        ctx.beginPath(); ctx.moveTo(sx, o.y); ctx.lineTo(sx + 4, o.y + 4); ctx.stroke();
      }
      ctx.restore();
      if (o.hintShown) {
        const overhead = OVERHEAD_KINDS.includes(o.kind);
        ctx.save();
        ctx.font = "700 12px sans-serif"; ctx.textAlign = "center";
        ctx.fillStyle = "#F5B32C";
        ctx.fillText(overhead ? "SLIDE!" : "JUMP!", o.x + o.w / 2, o.y - 10);
        ctx.restore();
      }
    }

    function drawStamp(s: Stamp) {
      const bob = Math.sin(gameRef.current.frame * 0.12 + s.x * 0.05) * 4;
      const y = s.y + bob;
      ctx.save();
      const glow = ctx.createRadialGradient(s.x, y, 1, s.x, y, s.r * 2.4);
      glow.addColorStop(0, "rgba(245,179,44,0.55)"); glow.addColorStop(1, "rgba(245,179,44,0)");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(s.x, y, s.r * 2.4, 0, Math.PI * 2); ctx.fill();
      const g = ctx.createLinearGradient(s.x - s.r, y - s.r, s.x + s.r, y + s.r);
      g.addColorStop(0, "#FFE29A"); g.addColorStop(1, "#2FB8E0");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#070C16"; ctx.font = "700 9px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("\u2726", s.x, y + 3);
      ctx.restore();
    }

    function tick() {
      const g = gameRef.current;
      const rect = canvas!.getBoundingClientRect();
      const w = rect.width, h = rect.height, gy = groundY(h);
      const level = LEVELS[g.currentLevelIdx];

      if (phaseRef.current === "running") {
        g.frame++;
        const speedRange = level.speedTo - level.speedFrom;
        const bandLen = (level.distanceTo ?? level.distanceFrom + 2000) - level.distanceFrom;
        const intoLevel = Math.min(1, (g.distance * METERS_PER_PX - level.distanceFrom) / bandLen);
        g.speed = level.speedFrom + speedRange * Math.max(0, intoLevel);
        g.worldOffset += g.speed;
        g.distance += g.speed;

        const distM = g.distance * METERS_PER_PX;
        const newLevel = levelForDistance(distM);
        if (newLevel.level - 1 !== g.currentLevelIdx) {
          g.currentLevelIdx = newLevel.level - 1;
          g.levelStats[newLevel.level] = g.levelStats[newLevel.level] || { collected: 0, spawned: 0 };
          setHudLevel(newLevel);
          setLevelUpInfo(newLevel);
          phaseRef.current = "levelup";
          setPhase("levelup");
          g.levelUpUntil = performance.now() + 1300;
        }

        const p = g.player;
        if (!p.grounded) {
          p.vy += PHYS.gravity; p.y += p.vy;
          const floorY = gy - p.h;
          if (p.y >= floorY) { p.y = floorY; p.vy = 0; p.grounded = true; p.coyote = PHYS.coyote; }
        } else if (p.coyote > 0) p.coyote--;
        if (p.sliding > 0) p.sliding--;

        g.spawnTimer -= g.speed;
        if (g.spawnTimer <= 0) {
          spawnObstacle(level);
          if (Math.random() < 0.55) spawnStamp(level);
          g.spawnTimer = 92 + Math.random() * 100 - g.speed * 2.6;
        }

        const px = 90, pw = p.w, ph = p.sliding > 0 ? p.h * 0.55 : p.h;
        const py = p.sliding > 0 ? p.y + (p.h - ph) : p.y;
        const shrink = 0.2;
        for (let i = g.obstacles.length - 1; i >= 0; i--) {
          const o = g.obstacles[i]; o.x -= g.speed;
          if (o.hintShown && o.x < w * 0.5) o.hintShown = false;
          if (o.x < -80) { g.obstacles.splice(i, 1); continue; }
          const ox = o.x + o.w * shrink / 2, ow = o.w * (1 - shrink);
          const oy = o.y + o.h * shrink / 2, oh = o.h * (1 - shrink);
          if (px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy) {
            endRunRef.current();
            break;
          }
        }
        for (let i = g.stamps.length - 1; i >= 0; i--) {
          const s = g.stamps[i]; s.x -= g.speed;
          if (s.x < -40) {
            if (!s.taken) { g.combo = 0; setMissFlash((v) => v + 1); }
            g.stamps.splice(i, 1); continue;
          }
          if (!s.taken) {
            const dx = (px + pw / 2) - s.x, dy = (py + ph / 2) - s.y;
            if (Math.sqrt(dx * dx + dy * dy) < s.r + 22) {
              s.taken = true;
              g.stampsCollected++;
              g.combo++;
              const tier = g.combo < 5 ? 1 : g.combo < 10 ? 2 : 3;
              g.stampPoints += 5 * tier;
              const stats = g.levelStats[level.level] || { collected: 0, spawned: 0 };
              stats.collected++;
              g.levelStats[level.level] = stats;
              setComboFlash((v) => v + 1);
              g.stamps.splice(i, 1);
            }
          }
        }
        if (!g.glimpseSeen && distM >= gateDistanceToday) {
          g.glimpseSeen = true; g.gateFlashUntil = g.frame + 40;
        }
        setHudDistance(Math.round(distM));
        setHudStamps(g.stampsCollected);
        setHudCombo(g.combo);
      }

      if (phaseRef.current === "levelup" && performance.now() >= g.levelUpUntil) {
        phaseRef.current = "running";
        setPhase("running");
      }

      ctx.clearRect(0, 0, w, h);
      const sky = ctx.createLinearGradient(0, 0, 0, gy);
      sky.addColorStop(0, level.palette.sky[0]); sky.addColorStop(1, level.palette.sky[1]);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, gy);

      const distMNow = g.distance * METERS_PER_PX;
      const progress = Math.min(1, distMNow / gateDistanceToday);
      const flashing = g.frame < g.gateFlashUntil;
      const glowR = 90 + progress * 60 + (flashing ? Math.sin(g.frame * 0.8) * 40 : 0);
      const glowA = 0.10 + progress * 0.2 + (flashing ? 0.35 : 0);
      const gx = w - 120, gyPos = 90;
      const rg = ctx.createRadialGradient(gx, gyPos, 4, gx, gyPos, glowR);
      const accentHex = level.palette.accent;
      const alphaHex = Math.round(Math.min(0.9, glowA) * 255).toString(16).padStart(2, "0");
      rg.addColorStop(0, `${accentHex}${alphaHex}`);
      rg.addColorStop(1, `${accentHex}00`);
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(gx, gyPos, glowR, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = level.palette.sky[1];
      skyline.forEach((b) => { const x = ((b.x - g.worldOffset * 0.2) % (w + 160)) - 80; ctx.fillRect(x, gy - b.h - 10, 46, b.h); });

      ctx.fillStyle = level.palette.ground; ctx.fillRect(0, gy, w, h - gy);
      ctx.strokeStyle = "rgba(140,158,196,0.25)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      ctx.setLineDash([18, 14]);
      ctx.beginPath(); ctx.moveTo(-(g.worldOffset % 32), gy + 16); ctx.lineTo(w, gy + 16); ctx.stroke();
      ctx.setLineDash([]);

      g.stamps.forEach(drawStamp);
      g.obstacles.forEach(drawObstacle);
      drawPlayer(90, g.player);

      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateDistanceToday, groundY]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (phaseRef.current === "tutorial") return;
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
      if (e.code === "ArrowDown") startSlide();
      if (e.code === "KeyP") setPhase((s) => (s === "running" ? "paused" : s === "paused" ? "running" : s));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [jump, startSlide]);

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (phase === "tutorial") return;
    if (phase === "idle" || phase === "over") { startRun(); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const half = rect.left + rect.width / 2;
    if (e.clientX < half) startSlide(); else jump();
  }

  const bestStars = (level: number) => levelProgress.find((l) => l.level === level)?.stars ?? 0;

  return (
    <div className="relative w-full aspect-[4/5] sm:aspect-[16/8] sm:max-h-[560px] bg-night rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        className="absolute inset-0 w-full h-full touch-none"
        aria-label="The Run Up game canvas"
      />

      <div className="absolute top-3 left-0 right-0 flex justify-between px-3 sm:px-4 pointer-events-none gap-2">
        <div className="glass rounded-lg px-3 py-2">
          <div className="text-[0.58rem] tracking-wider text-inkdim uppercase">Distance</div>
          <div className="font-serif text-lg font-semibold tabular-nums">{hudDistance}m</div>
        </div>
        <div className="glass rounded-lg px-3 py-2 relative">
          <div className="text-[0.58rem] tracking-wider text-inkdim uppercase">Stamps</div>
          <div className="font-serif text-lg font-semibold tabular-nums">{hudStamps}</div>
          <AnimatePresence>
            {hudCombo >= 5 && (
              <motion.div
                key={comboFlash}
                initial={{ opacity: 0, y: 6, scale: 0.8 }}
                animate={{ opacity: 1, y: -2, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -top-2 -right-2 bg-brand-gradient text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full"
              >
                x{hudCombo < 10 ? 2 : 3}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="glass rounded-lg px-3 py-2 text-right">
          <div className="text-[0.58rem] tracking-wider text-inkdim uppercase">Level {hudLevel.level}/5</div>
          <div className="font-serif text-sm font-semibold" style={{ color: hudLevel.palette.accent }}>{hudLevel.name}</div>
        </div>
      </div>

      <div className="absolute top-[68px] sm:top-[60px] left-3 sm:left-4 glass rounded-lg px-2.5 py-1.5 flex items-center gap-3 text-[0.62rem] text-inkdim">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gradient-to-br from-amber-200 to-cyan-400" /> collect</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm border border-brand-red" /> avoid</span>
      </div>

      <AnimatePresence>
        {missFlash > 0 && (
          <motion.div
            key={missFlash}
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: "inset 0 0 60px 10px rgba(226,58,58,0.5)" }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "levelup" && levelUpInfo && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            className="absolute inset-0 flex items-center justify-center bg-night/55 backdrop-blur-[2px]"
          >
            <div className="text-center px-6">
              <div className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: levelUpInfo.palette.accent }}>
                Level {levelUpInfo.level} of 5 &middot; {levelUpInfo.pillar}
              </div>
              <div className="font-serif text-3xl sm:text-4xl font-bold mb-2">{levelUpInfo.name}</div>
              <div className="text-inkdim text-sm">{levelUpInfo.subtitle}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showTutorial && phase === "tutorial" && <Tutorial onDone={dismissTutorial} />}

      {(phase === "idle" || phase === "paused" || phase === "over") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 bg-night/85 backdrop-blur-sm px-5 py-6 overflow-y-auto">
          {phase === "paused" ? (
            <h3 className="font-serif text-3xl font-semibold">Paused</h3>
          ) : (
            <>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold max-w-xs tracking-tight">
                {phase === "idle" ? "Nobody's gotten in yet." : "Run again?"}
              </h3>
              <p className="text-inkdim max-w-sm text-sm leading-relaxed">
                The gate is {gateDistanceToday.toLocaleString()}m away today. Five stops between here and
                there &mdash; jump the cones, slide the banners, chase the glow.
              </p>
              <div className="flex items-center gap-1.5">
                {LEVELS.map((l) => (
                  <div key={l.level} className="flex flex-col items-center gap-1">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold border"
                      style={{
                        borderColor: bestStars(l.level) > 0 ? l.palette.accent : "rgba(148,163,196,0.25)",
                        color: bestStars(l.level) > 0 ? l.palette.accent : "#8B98B8",
                        background: bestStars(l.level) > 0 ? `${l.palette.accent}14` : "transparent",
                      }}
                    >
                      {l.level}
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((n) => (
                        <span key={n} className={`text-[8px] ${bestStars(l.level) >= n ? "text-brand-orange" : "text-white/15"}`}>&#9733;</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <button
            onClick={phase === "paused" ? () => setPhase("running") : startRun}
            className="bg-brand-gradient text-white font-semibold px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl shadow-[0_10px_30px_-10px_rgba(60,100,200,0.65)]"
          >
            {phase === "paused" ? "Resume" : phase === "over" ? "Run again" : "Start running"}
          </button>
          {phase === "idle" && (
            <button onClick={() => setPhase("tutorial")} className="text-inkdim text-xs underline underline-offset-4">
              How to play
            </button>
          )}
        </div>
      )}

      <div className="absolute bottom-2 left-0 right-0 flex justify-around md:hidden pointer-events-none">
        <span className="text-[0.65rem] bg-night/55 text-inkdim px-2.5 py-1 rounded-full">&#9664; Slide</span>
        <span className="text-[0.65rem] bg-night/55 text-inkdim px-2.5 py-1 rounded-full">Jump &#9654;</span>
      </div>
    </div>
  );
}

function Tutorial({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "Jump the low stuff", body: "Tap the right half of the screen, or press Space / \u2191.", icon: "\u25B2" },
    { title: "Slide the overhead stuff", body: "Tap the left half, or press \u2193.", icon: "\u25BC" },
    { title: "Glow means go", body: "Gold-and-cyan glowing stamps: collect them. Anything with a red hazard outline: avoid it.", icon: "\u2726" },
  ];
  const s = steps[step];
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-5 bg-night/92 backdrop-blur-sm px-6 z-10">
      <div className="text-5xl">{s.icon}</div>
      <h3 className="font-serif text-2xl font-semibold">{s.title}</h3>
      <p className="text-inkdim text-sm max-w-xs leading-relaxed">{s.body}</p>
      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === step ? "bg-brand-cyan" : "bg-white/15"}`} />
        ))}
      </div>
      <button
        onClick={() => (step < steps.length - 1 ? setStep(step + 1) : onDone())}
        className="bg-brand-gradient text-white font-semibold px-7 py-3 rounded-xl"
      >
        {step < steps.length - 1 ? "Next" : "Let's go"}
      </button>
    </div>
  );
}
