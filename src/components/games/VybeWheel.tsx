"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const COLORS = ["#2E3F8C", "#3C64C8", "#2FB8E0", "#E23A3A", "#F0A23C", "#7CC24A", "#8B98B8"];

interface SpinResult {
  segmentLabel: string;
  segmentIndex: number;
  totalSegments: number;
  pointsWon: number;
  freeSpin: boolean;
  newBalance: number;
}

export default function VybeWheel({
  playerId,
  balance,
  spinCost,
  onSpinComplete,
}: {
  playerId: string | null;
  balance: number;
  spinCost: number;
  onSpinComplete: (result: SpinResult) => void;
}) {
  const [segments, setSegments] = useState<{ label: string }[]>([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/wheel-spin")
      .then((r) => r.json())
      .then((data) => setSegments(data.segments))
      .catch(() => setSegments(Array.from({ length: 7 }, (_, i) => ({ label: `Segment ${i + 1}` }))));
  }, []);

  const segAngle = 360 / (segments.length || 7);

  async function spin() {
    if (!playerId) { setError("Join the list first to start earning Vybe Points."); return; }
    if (balance < spinCost) { setError(`You need ${spinCost} points to spin.`); return; }
    setError(null);
    setSpinning(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/wheel-spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setSpinning(false); return; }

      const result: SpinResult = data;
      const targetCenter = (result.segmentIndex + 0.5) * (360 / result.totalSegments);
      const extraSpins = 5 * 360;
      const delta = extraSpins + (360 - targetCenter);
      setRotation((prev) => prev + delta);

      setTimeout(() => {
        setSpinning(false);
        setLastResult(result);
        onSpinComplete(result);
      }, 3200);
    } catch {
      setError("Network error — try again.");
      setSpinning(false);
    }
  }

  const radius = 140;
  const center = 150;

  function arcPath(index: number) {
    const start = (index * segAngle * Math.PI) / 180;
    const end = ((index + 1) * segAngle * Math.PI) / 180;
    const x1 = center + radius * Math.sin(start), y1 = center - radius * Math.cos(start);
    const x2 = center + radius * Math.sin(end), y2 = center - radius * Math.cos(end);
    const largeArc = segAngle > 180 ? 1 : 0;
    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-[300px] h-[300px]">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-brand-orange drop-shadow-lg" />
        <motion.svg
          width="300"
          height="300"
          viewBox="0 0 300 300"
          animate={{ rotate: rotation }}
          transition={{ duration: 3.2, ease: [0.12, 0.7, 0.15, 1] }}
          className="drop-shadow-[0_0_40px_rgba(47,184,224,0.25)]"
        >
          <circle cx={center} cy={center} r={radius + 6} fill="#101B33" stroke="#8B98B8" strokeOpacity={0.2} />
          {segments.map((seg, i) => (
            <g key={i}>
              <path d={arcPath(i)} fill={COLORS[i % COLORS.length]} stroke="#070C16" strokeWidth={2} />
              <text
                x={center + radius * 0.62 * Math.sin(((i + 0.5) * segAngle * Math.PI) / 180)}
                y={center - radius * 0.62 * Math.cos(((i + 0.5) * segAngle * Math.PI) / 180)}
                fill="#F4F6FA"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {seg.label}
              </text>
            </g>
          ))}
          <circle cx={center} cy={center} r={22} fill="#070C16" stroke="#2FB8E0" strokeWidth={2} />
        </motion.svg>
      </div>

      <button
        onClick={spin}
        disabled={spinning}
        className="bg-brand-gradient text-white font-semibold px-8 py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_-10px_rgba(60,100,200,0.6)]"
      >
        {spinning ? "Spinning…" : `Spin for ${spinCost} points`}
      </button>

      {error && <p className="text-brand-red text-sm text-center max-w-xs">{error}</p>}

      {lastResult && !spinning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center glass-strong glow-cyan rounded-xl px-7 py-5"
        >
          <p className="text-inkdim text-sm">You landed on</p>
          <p className="font-serif text-xl font-bold grad-text">{lastResult.segmentLabel}</p>
          <p className="text-inkdim text-xs mt-1">Balance: {lastResult.newBalance.toLocaleString()} points</p>
        </motion.div>
      )}
    </div>
  );
}
