"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LAUNCH = new Date(
  process.env.NEXT_PUBLIC_LAUNCH_DATE || "2026-10-01T00:00:00+01:00"
);

type RemainingTime = {
  d: number;
  h: number;
  m: number;
  s: number;
  done: boolean;
};

function getRemaining(): RemainingTime {
  const diff = LAUNCH.getTime() - Date.now();

  if (diff <= 0) {
    return { d: 0, h: 0, m: 0, s: 0, done: true };
  }

  const totalSec = Math.floor(diff / 1000);

  return {
    d: Math.floor(totalSec / 86400),
    h: Math.floor((totalSec % 86400) / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
    done: false,
  };
}

function Digit({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const padded = String(value).padStart(2, "0");

  return (
    <div className="glass rounded-xl px-3.5 py-3 sm:px-4 sm:py-3.5 text-center min-w-[64px] sm:min-w-[72px]">
      <div className="relative h-8 sm:h-9 overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={padded}
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{
              duration: 0.28,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute inset-0 font-serif text-2xl sm:text-3xl font-semibold tabular-nums grad-text"
          >
            {padded}
          </motion.span>
        </AnimatePresence>
      </div>

      <span className="block text-[0.62rem] tracking-[0.14em] text-inkdim uppercase mt-1.5">
        {label}
      </span>
    </div>
  );
}

export default function CountdownTimer() {
  // Static initial value — same on server and client
  const [t, setT] = useState<RemainingTime>({
    d: 0,
    h: 0,
    m: 0,
    s: 0,
    done: false,
  });

  useEffect(() => {
    // Calculate immediately after hydration
    setT(getRemaining());

    const id = setInterval(() => {
      setT(getRemaining());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <span className="text-xs font-semibold tracking-[0.16em] text-inkdim uppercase">
        The door opens in
      </span>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <Digit value={t.d} label="Days" />
        <Digit value={t.h} label="Hrs" />
        <Digit value={t.m} label="Min" />
        <Digit value={t.s} label="Sec" />
      </div>
    </div>
  );
}