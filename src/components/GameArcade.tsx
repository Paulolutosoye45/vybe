"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RunUpGame, { RunUpResult } from "./games/RunUpGame";
import VybeWheel from "./games/VybeWheel";
import { PlayerProfile } from "@/lib/usePlayer";
import { LEVELS } from "@/lib/levels";

type Tab = "run-up" | "wheel";

export default function GameArcade({
  playerId,
  profile,
  gateDistanceToday,
  onNeedSignup,
  onProfileRefresh,
}: {
  playerId: string | null;
  profile: PlayerProfile | null;
  gateDistanceToday: number;
  onNeedSignup: () => void;
  onProfileRefresh: () => void;
}) {
  const [tab, setTab] = useState<Tab>("run-up");
  const [lastRun, setLastRun] = useState<(RunUpResult & { pointsEarned?: number; starBonusPoints?: number }) | null>(null);

  async function handleGameOver(result: RunUpResult) {
    if (!playerId) {
      setLastRun(result);
      return;
    }
    try {
      const res = await fetch("/api/game-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          game: "run-up",
          distanceM: result.distanceM,
          stamps: result.stamps,
          stampPoints: result.stampPoints,
          levelResults: result.levelResults,
        }),
      });
      const data = await res.json();
      setLastRun({ ...result, pointsEarned: data.pointsEarned, starBonusPoints: data.starBonusPoints });
      onProfileRefresh();
    } catch {
      setLastRun(result);
    }
  }

  const furthestLevel = lastRun?.levelResults.length
    ? LEVELS.find((l) => l.level === lastRun.levelResults[lastRun.levelResults.length - 1].level)
    : null;
  const totalStars = lastRun?.levelResults.reduce((s, r) => s + r.stars, 0) ?? 0;

  return (
    <section id="arcade" className="section-pad">
      <div className="max-w-5xl mx-auto px-6 sm:px-8">
        <div className="mb-10">
          <span className="text-xs font-semibold tracking-[0.16em] text-brand-cyan uppercase">Two games, one currency</span>
          <div className="flex items-end justify-between flex-wrap gap-5 mt-2">
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight">The Vybe Arcade</h2>
            <div className="flex gap-1 glass rounded-xl p-1.5">
              <button
                onClick={() => setTab("run-up")}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "run-up" ? "bg-brand-gradient text-white shadow-lg" : "text-inkdim hover:text-ink"}`}
              >
                The Run Up
              </button>
              <button
                onClick={() => setTab("wheel")}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "wheel" ? "bg-brand-gradient text-white shadow-lg" : "text-inkdim hover:text-ink"}`}
              >
                The Vybe Wheel
              </button>
            </div>
          </div>
          <p className="text-inkdim mt-3 max-w-xl">
            Five stops between here and the gate — Homecoming, The Rush, Owambe Street, Detty
            December, and the door itself. Every point you earn carries straight into December.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {tab === "run-up" ? (
            <motion.div key="run-up" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <div className="glass-strong rounded-2xl p-2 sm:p-3">
                <RunUpGame
                  gateDistanceToday={gateDistanceToday}
                  levelProgress={profile?.levelProgress ?? []}
                  onGameOver={handleGameOver}
                />
              </div>
              {lastRun && (
                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  <Stat label="This run" value={`${lastRun.distanceM}m`} />
                  <Stat label="Reached" value={furthestLevel ? furthestLevel.name : "\u2014"} />
                  <Stat label="Stars earned" value={`${totalStars} \u2605`} highlight={totalStars > 0} />
                  {playerId ? (
                    <Stat
                      label="Points earned"
                      value={`+${lastRun.pointsEarned ?? 0}`}
                      sublabel={lastRun.starBonusPoints ? `incl. +${lastRun.starBonusPoints} for new stars` : undefined}
                      highlight
                    />
                  ) : (
                    <button
                      onClick={onNeedSignup}
                      className="glass rounded-xl px-4 py-3 text-left border-dashed border-brand-cyan/40 hover:border-brand-cyan/70 transition-colors"
                    >
                      <div className="text-xs text-inkdim">Join to save this</div>
                      <div className="font-semibold text-brand-cyan text-sm mt-0.5">Claim your points \u2192</div>
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="wheel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="glass-strong rounded-2xl py-12 px-6">
              <VybeWheel
                playerId={playerId}
                balance={profile?.balance ?? 0}
                spinCost={20}
                onSpinComplete={onProfileRefresh}
              />
              {!playerId && (
                <p className="text-center text-inkdim text-sm mt-7">
                  <button onClick={onNeedSignup} className="text-brand-cyan font-medium underline underline-offset-4">Join the list</button>
                  {" "}to start earning points you can spin with.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Stat({ label, value, sublabel, highlight }: { label: string; value: string; sublabel?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl px-4 py-3.5 ${highlight ? "glass-strong glow-cyan" : "glass"}`}>
      <div className="text-xs text-inkdim uppercase tracking-wide">{label}</div>
      <div className="font-serif text-xl font-semibold mt-1">{value}</div>
      {sublabel && <div className="text-[0.68rem] text-inkdim mt-0.5">{sublabel}</div>}
    </div>
  );
}
