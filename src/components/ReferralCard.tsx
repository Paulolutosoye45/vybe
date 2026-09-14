"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, PartyPopper, TrendingUp, Gift, Trophy } from "lucide-react";

const TIERS = [
  { count: 3, reward: 200 },
  { count: 5, reward: 500 },
  { count: 10, reward: 1500 },
];

export default function ReferralCard({
  queuePosition,
  referralCode,
  referralCount = 0,
}: {
  queuePosition: number;
  referralCode: string;
  referralCount?: number;
}) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}?ref=${referralCode}` : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — the input is still selectable manually
    }
  }

  const nextTier = TIERS.find((t) => t.count > referralCount);
  const toGo = nextTier ? nextTier.count - referralCount : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-strong glow-cyan rounded-2xl p-8 max-w-xl"
    >
      <div className="flex items-center gap-2 text-brand-cyan text-xs font-semibold tracking-[0.14em] uppercase mb-3">
        <PartyPopper size={14} />
        You&rsquo;re on the list
      </div>
      <p className="font-serif text-5xl font-semibold grad-text mb-4">#{queuePosition.toLocaleString()}</p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="glass rounded-xl p-4">
          <TrendingUp size={16} className="text-brand-cyan mb-2" />
          <div className="text-sm font-semibold">You move up 10 spots</div>
          <div className="text-xs text-inkdim mt-0.5">+150 points, every time</div>
        </div>
        <div className="glass rounded-xl p-4">
          <Gift size={16} className="text-brand-gold mb-2" />
          <div className="text-sm font-semibold">They start with 100</div>
          <div className="text-xs text-inkdim mt-0.5">Signup bonus, on us</div>
        </div>
      </div>

      {/* referral tiers — the ladder, not just the flat per-referral reward */}
      <div className="glass rounded-xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={14} className="text-brand-gold" />
          <span className="text-xs font-semibold uppercase tracking-wide text-inkdim">Referral tiers</span>
        </div>
        <div className="flex items-center gap-2">
          {TIERS.map((t) => {
            const reached = referralCount >= t.count;
            return (
              <div key={t.count} className={`flex-1 rounded-lg py-2.5 text-center ${reached ? "bg-brand-gold/15 border border-brand-gold/40" : "bg-white/[0.03] border border-white/10"}`}>
                <div className={`text-xs font-bold ${reached ? "text-brand-gold" : "text-inkdim"}`}>{t.count} friends</div>
                <div className="text-[10px] text-inkdim mt-0.5">+{t.reward} pts</div>
              </div>
            );
          })}
        </div>
        {nextTier && (
          <p className="text-xs text-inkdim mt-3">
            <span className="text-ink font-semibold">{toGo}</span> more referral{toGo === 1 ? "" : "s"} to unlock +{nextTier.reward} points.
          </p>
        )}
      </div>

      {referralCount > 0 && (
        <div className="flex items-center gap-2 mb-5 text-sm">
          <span className="w-2 h-2 rounded-full bg-brand-green shrink-0" />
          <span>
            <span className="font-semibold">{referralCount}</span>{" "}
            {referralCount === 1 ? "friend has" : "friends have"} joined through your link so far.
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          readOnly
          value={link}
          className="flex-1 glass rounded-lg text-inkdim text-sm px-4 py-3 outline-none min-w-0 truncate"
        />
        <button
          onClick={copy}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all shrink-0 ${
            copied ? "bg-brand-green text-night" : "bg-brand-gradient text-night"
          }`}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </motion.div>
  );
}
