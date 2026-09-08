"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface LeaderboardData {
  global: { totalSignups: number; totalDistanceRunM: number; totalRuns: number; totalSpins: number };
  states: { state: string; totalDistanceM: number; totalRuns: number }[];
}

const TARGET = 5_000_000;

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/leaderboard");
        if (mounted && res.ok) setData(await res.json());
      } catch {}
    }
    load();
    const id = setInterval(load, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const pct = data ? Math.min(100, (data.global.totalDistanceRunM / TARGET) * 100) : 0;
  const maxState = data?.states[0]?.totalDistanceM || 1;

  return (
    <section className="section-pad">
      <div className="max-w-5xl mx-auto px-6 sm:px-8">
        <div className="glass-strong rounded-2xl p-7 sm:p-9">
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_8px_#7CC24A] animate-pulse" />
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">The nation is running too</h2>
          </div>
          <p className="text-inkdim max-w-lg mb-8 leading-relaxed">
            Every metre anyone runs adds to one number. Cover enough ground before 1 October and
            the gate opens a day early — for everyone.
          </p>

          <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06] mb-2.5">
            <motion.div
              className="h-full bg-brand-gradient rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-sm text-inkdim mb-10">
            <span className="font-medium text-ink">{(data?.global.totalDistanceRunM ?? 0).toLocaleString()}m</span>
            <span>Target: {TARGET.toLocaleString()}m</span>
          </div>

          <h3 className="font-serif text-lg font-semibold mb-5">States, running</h3>
          {!data?.states.length ? (
            <p className="text-inkdim text-sm">Join the list with your state to put it on the board.</p>
          ) : (
            <div className="space-y-0.5">
              {data.states.map((s, i) => (
                <div key={s.state} className="flex items-center gap-4 py-3 border-b border-white/[0.06] last:border-0">
                  <span className={`font-serif font-semibold w-6 text-sm ${i === 0 ? "text-brand-orange" : "text-inkdim"}`}>{i + 1}</span>
                  <span className="flex-1 text-sm font-medium">{s.state}</span>
                  <div className="flex-[2] h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-brand-gradient rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(4, (s.totalDistanceM / maxState) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-inkdim w-20 text-right tabular-nums">{s.totalDistanceM.toLocaleString()}m</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
