"use client";

import { motion } from "framer-motion";
import { Flame, Sparkles } from "lucide-react";
import { PlayerProfile } from "@/lib/usePlayer";

const SOURCE_LABELS: Record<string, string> = {
  signup_bonus: "Joining the list",
  run_up: "The Run Up",
  wheel_spin: "The Vybe Wheel",
  referral_bonus: "A friend joined via your link",
  daily_streak: "Daily streak bonus",
};

export default function RewardsPanel({ profile }: { profile: PlayerProfile }) {
  return (
    <div className="glass-strong rounded-2xl p-7 sm:p-8">
      <div className="flex items-center justify-between flex-wrap gap-5 mb-7">
        <div>
          <div className="text-xs text-inkdim uppercase tracking-[0.14em] font-semibold">Your Vybe Points</div>
          <motion.div
            key={profile.balance}
            initial={{ opacity: 0.4, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="font-serif text-5xl font-semibold grad-text mt-1"
          >
            {profile.balance.toLocaleString()}
          </motion.div>
        </div>
        {profile.streak >= 2 && (
          <div className="flex items-center gap-2 glass rounded-full px-4 py-2.5">
            <Flame size={16} className="text-brand-orange" />
            <span className="text-sm font-semibold">{profile.streak} day streak</span>
          </div>
        )}
      </div>

      <p className="text-inkdim text-sm mb-5 flex items-center gap-2 leading-relaxed">
        <Sparkles size={14} className="text-brand-cyan shrink-0" />
        This is the same ledger the full Passport uses in December — nothing here gets left behind.
      </p>

      <div className="space-y-0.5">
        {profile.ledger.slice(0, 6).map((entry) => (
          <div key={entry.id} className="flex justify-between text-sm py-2.5 border-b border-white/[0.06] last:border-0">
            <span className="text-inkdim">{SOURCE_LABELS[entry.source] ?? entry.source}</span>
            <span className={entry.amount >= 0 ? "text-brand-green font-semibold" : "text-inkdim"}>
              {entry.amount >= 0 ? "+" : ""}{entry.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
