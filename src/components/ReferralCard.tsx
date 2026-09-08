"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, PartyPopper } from "lucide-react";

export default function ReferralCard({ queuePosition, referralCode }: { queuePosition: number; referralCode: string }) {
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
      <p className="text-inkdim text-[15px] leading-relaxed mb-6">
        Bring a friend and move up <span className="text-ink font-medium">10 spots</span> for every one who joins.
      </p>
      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          readOnly
          value={link}
          className="flex-1 glass rounded-lg text-inkdim text-sm px-4 py-3 outline-none min-w-0 truncate"
        />
        <button
          onClick={copy}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all shrink-0 ${
            copied ? "bg-brand-green text-night" : "bg-brand-gradient text-white"
          }`}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </motion.div>
  );
}
