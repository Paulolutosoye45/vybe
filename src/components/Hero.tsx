"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import CountdownTimer from "./CountdownTimer";

const VIDEO_URL =
  process.env.NEXT_PUBLIC_HERO_VIDEO_URL ||
  "https://decemberissavybe.com/wp-content/uploads/2025/11/2022395-hd_1920_1080_30fps.mp4";

export default function Hero({
  onPlayClick,
  onJoinClick,
}: {
  onPlayClick: () => void;
  onJoinClick: () => void;
}) {
  return (
    <section className="relative min-h-[94vh] flex flex-col justify-center overflow-hidden">
      {/* Real video background — muted/looped/autoplay. The aurora field
          behind everything means this still reads rich even before the
          video decodes, and degrades gracefully if it never does. */}
      <div className="absolute inset-0 z-0">
        <video
          className="w-full h-full object-cover opacity-[0.35] motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-night/40 via-night/75 to-night" />
      </div>

      <div className="relative z-10   px-6 sm:px-8 w-full pt-10 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          

          {/* <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[0.16em] text-brand-cyan border border-brand-cyan/30 bg-brand-cyan/[0.06] backdrop-blur-sm rounded-full px-4 py-2 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan shadow-[0_0_10px_#2FB8E0] animate-pulse" />
            ACCESS IS THE VYBE
          </div> */}

          <h1 className="font-serif font-semibold leading-[0.96] text-[13vw] sm:text-6xl  md:text-7xl lg:text-[5.5rem] text-center mb-7 tracking-tight">
            The door is <span className="grad-text">locked.</span>
            <br />
            For now.
          </h1>

          <p className="text-inkdim text-lg sm:text-xl text-center mx-auto leading-relaxed max-w-3xl mb-10 font-light">
            On <span className="font-bold text-ink">1 October 2026</span>, First Bank throws open Nigeria&rsquo;s biggest December yet. Run the
            gate, spin for points, and bring someone with you —{" "}
            <span className="text-ink font-medium">every friend who joins moves you closer to the front.</span>
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 mb-12">
            <motion.button
              whileHover={{ y: -3, boxShadow: "0 20px 50px -12px rgba(47,184,224,0.55)" }}
              whileTap={{ scale: 0.97 }}
              onClick={onPlayClick}
              className="bg-brand-gradient text-white font-semibold px-8 py-4 rounded-xl shadow-[0_12px_36px_-10px_rgba(60,100,200,0.65)] flex items-center gap-2.5 text-[15px]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play &amp; earn points
            </motion.button>
            <motion.button
              whileHover={{ y: -2, borderColor: "rgba(148,163,196,0.5)" }}
              onClick={onJoinClick}
              className="glass text-ink font-semibold px-8 py-4 rounded-xl text-[15px]"
            >
              Join the list
            </motion.button>
          </div>

          <CountdownTimer />
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-night to-transparent z-10" />
    </section>
  );
}
