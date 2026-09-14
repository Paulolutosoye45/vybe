"use client";

import { motion } from "framer-motion";
import { Flame, Snowflake } from "lucide-react";

const MILESTONES = [3, 7, 14, 30];

export default function DailyStreakCard({
  streak,
  playedToday,
  streakFreezes = 0,
  onPlayClick,
}: {
  streak: number;
  playedToday: boolean;
  streakFreezes?: number;
  onPlayClick: () => void;
}) {
  const days = Array.from({ length: 7 }).map((_, i) => {
    const offset = 6 - i;
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const isToday = offset === 0;
    const lit = playedToday ? offset < streak : offset < streak && !isToday;
    return { label: d.toLocaleDateString("en-US", { weekday: "narrow" }), isToday, lit };
  });

  const nextMilestone = MILESTONES.find((m) => m > streak);
  const daysToGo = nextMilestone ? nextMilestone - streak : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="glass-strong rounded-2xl p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex items-center gap-3.5 shrink-0">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              streak > 0 ? "bg-gradient-to-br from-brand-gold to-brand-orange" : "glass"
            }`}
          >
            <Flame size={26} className={streak > 0 ? "text-night" : "text-inkdim"} fill={streak > 0 ? "currentColor" : "none"} />
          </div>
          <div>
            <div className="text-2xl font-bold leading-none">
              {streak} <span className="text-base font-medium text-inkdim">day{streak === 1 ? "" : "s"}</span>
            </div>
            <div className="text-xs text-inkdim mt-1">
              {playedToday ? "You\u2019re set for today \u2713" : "Play today to keep it going"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:ml-2">
          {days.map((d, i) => (
            <div
              key={i}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                d.lit
                  ? "bg-gradient-to-br from-brand-gold to-brand-orange text-night"
                  : d.isToday
                    ? "border-2 border-dashed border-brand-cyan/50 text-brand-cyan"
                    : "glass text-inkdim"
              }`}
            >
              {d.lit ? <Flame size={13} fill="currentColor" /> : d.label}
            </div>
          ))}
        </div>

        {!playedToday && (
          <button
            onClick={onPlayClick}
            className="sm:ml-auto bg-brand-gradient rounded-lg px-5 py-2.5 text-sm font-semibold text-night shrink-0"
          >
            Play now &rarr;
          </button>
        )}
      </div>

      {(streakFreezes > 0 || nextMilestone) && (
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.06] text-xs text-inkdim flex-wrap">
          {streakFreezes > 0 && (
            <span className="flex items-center gap-1.5">
              <Snowflake size={13} className="text-brand-cyan" />
              <span className="text-ink font-semibold">{streakFreezes}</span> freeze{streakFreezes === 1 ? "" : "s"} banked — covers one missed day
            </span>
          )}
          {nextMilestone && (
            <span>
              <span className="text-ink font-semibold">{daysToGo}</span> more day{daysToGo === 1 ? "" : "s"} to your {nextMilestone}-day badge
              {[7, 14, 30].includes(nextMilestone) ? " + a streak freeze" : ""}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
