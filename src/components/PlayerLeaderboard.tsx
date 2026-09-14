"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame } from "lucide-react";

interface LeaderRow {
  rank: number;
  username: string;
  state: string;
  totalStars: number;
  bestDistanceM: number;
  streak: number;
}
interface LeaderboardData {
  top: LeaderRow[];
  you: (LeaderRow & { rank: number }) | null;
}

const MEDAL = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];

export default function PlayerLeaderboard({ playerId }: { playerId: string | null }) {
  const [data, setData] = useState<LeaderboardData | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const url = playerId ? `/api/leaderboard/players?playerId=${playerId}` : "/api/leaderboard/players";
        const res = await fetch(url);
        if (mounted && res.ok) setData(await res.json());
      } catch {}
    }
    load();
    const id = setInterval(load, 20000);
    return () => { mounted = false; clearInterval(id); };
  }, [playerId]);

  return (
    <div className="glass-strong rounded-2xl p-6 sm:p-7">
      <div className="flex items-center gap-2 mb-1">
        <Trophy size={16} className="text-brand-orange" />
        <h3 className="font-serif text-xl font-semibold">Leaderboard</h3>
      </div>
      <p className="text-inkdim text-sm mb-5">
        Ranked by total stars, player by player — completion beats a lucky sprint, and everyone&rsquo;s racing everyone, not their state.
      </p>

      {!data?.top.length ? (
        <p className="text-inkdim text-sm">Nobody&rsquo;s earned a star yet. Be the first.</p>
      ) : (
        <div className="space-y-0.5">
          <div className="hidden sm:flex items-center gap-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-inkdim">
            <span className="w-7"></span>
            <span className="flex-1">Player</span>
            <span className="w-12 text-center">Streak</span>
            <span className="w-16 text-right">Best run</span>
            <span className="w-14 text-right">Stars</span>
          </div>
          {data.top.map((row) => (
            <motion.div
              key={row.rank}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: row.rank * 0.03 }}
              className="flex items-center gap-3 py-2.5 border-b border-white/[0.06] last:border-0"
            >
              <span className="w-7 text-center font-serif font-semibold text-sm text-inkdim">
                {row.rank <= 3 ? MEDAL[row.rank - 1] : row.rank}
              </span>
              <span className="flex-1 text-sm font-medium truncate">@{row.username}</span>
              <span className="w-12 flex items-center justify-center gap-0.5 text-xs text-inkdim">
                {row.streak > 0 && <Flame size={11} className="text-brand-gold" fill="currentColor" />}
                {row.streak > 0 ? row.streak : "\u2014"}
              </span>
              <span className="text-xs text-inkdim w-16 text-right tabular-nums hidden sm:inline">{row.bestDistanceM.toLocaleString()}m</span>
              <span className="text-sm font-semibold text-brand-orange w-14 text-right tabular-nums">{row.totalStars}{"\u2605"}</span>
            </motion.div>
          ))}
          {data.you && (
            <div className="flex items-center gap-3 py-2.5 mt-2 pt-3 border-t border-brand-cyan/25">
              <span className="w-7 text-center font-serif font-semibold text-sm text-brand-cyan">{data.you.rank}</span>
              <span className="flex-1 text-sm font-medium">You</span>
              <span className="w-12 flex items-center justify-center gap-0.5 text-xs text-brand-cyan">
                {data.you.streak > 0 && <Flame size={11} className="text-brand-gold" fill="currentColor" />}
                {data.you.streak > 0 ? data.you.streak : "\u2014"}
              </span>
              <span className="text-xs text-inkdim w-16 text-right tabular-nums hidden sm:inline">{data.you.bestDistanceM.toLocaleString()}m</span>
              <span className="text-sm font-semibold text-brand-cyan w-14 text-right tabular-nums">{data.you.totalStars}{"\u2605"}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
