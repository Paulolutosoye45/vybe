"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Play, X, CheckCircle2, ExternalLink, Trophy } from "lucide-react";
import { BLUUTV_VIDEOS, BLUUTV_BLURB, BLUUTV_CHANNEL_URL, thumbnailUrl, embedUrl, watchUrl } from "@/lib/bluutv";

const TOTAL_EPISODES = BLUUTV_VIDEOS.filter((v) => v.kind === "episode").length;

export default function BluuTVGallery({
  playerId,
  watchedVideoIds,
  seriesCompleted,
  onNeedSignup,
  onWatched,
}: {
  playerId: string | null;
  watchedVideoIds: string[];
  seriesCompleted?: boolean;
  onNeedSignup: () => void;
  onWatched: (videoId: string, pointsEarned: number, seriesJustCompleted?: boolean) => void;
}) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const watched = new Set(watchedVideoIds);
  const watchedEpisodeCount = BLUUTV_VIDEOS.filter((v) => v.kind === "episode" && watched.has(v.id)).length;

  async function openVideo(id: string) {
    if (!playerId) {
      onNeedSignup();
      return;
    }
    setPlayingId(id);
    try {
      const res = await fetch("/api/video-watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, videoId: id }),
      });
      const data = await res.json();
      if (!data.alreadyWatched && data.pointsEarned > 0) {
        onWatched(id, data.pointsEarned, data.seriesJustCompleted);
      }
      if (data.seriesJustCompleted) setJustCompleted(true);
    } catch {
      // Playback already started client-side regardless — recording the
      // watch is a bonus, not a gate on actually seeing the video.
    }
  }

  const playing = BLUUTV_VIDEOS.find((v) => v.id === playingId);

  return (
    <section id="bluutv" className="section-pad border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto px-6 sm:px-8">
        <div className="flex items-end justify-between flex-wrap gap-5 mb-3">
          <div>
            <span className="text-xs font-semibold tracking-[0.16em] text-brand-gold uppercase">Powered by FirstBank</span>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight mt-2">Watch BLUU TV</h2>
          </div>
          <a
            href={BLUUTV_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-inkdim hover:text-brand-cyan flex items-center gap-1.5 transition-colors"
          >
            Full channel on YouTube <ExternalLink size={12} />
          </a>
        </div>
        <p className="text-inkdim max-w-2xl mb-8 text-[15px] leading-relaxed">{BLUUTV_BLURB}</p>

        {playerId && (
          <AnimatePresence>
            {(seriesCompleted || justCompleted) ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-strong rounded-xl px-5 py-4 mb-6 flex items-center gap-3"
                style={{ borderColor: "rgba(224,173,15,0.4)" }}
              >
                <Trophy size={18} className="text-brand-gold shrink-0" />
                <span className="text-sm font-semibold">Series complete — all {TOTAL_EPISODES} episodes watched. +150 bonus points banked.</span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-xs">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(watchedEpisodeCount / TOTAL_EPISODES) * 100}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full bg-brand-gradient rounded-full"
                  />
                </div>
                <span className="text-xs text-inkdim shrink-0">{watchedEpisodeCount} of {TOTAL_EPISODES} episodes watched</span>
              </div>
            )}
          </AnimatePresence>
        )}

        {!playerId && (
          <button
            onClick={onNeedSignup}
            className="w-full glass rounded-xl px-5 py-4 mb-6 flex items-center gap-3 text-left hover:border-brand-gold/40 transition-colors"
          >
            <Lock size={16} className="text-brand-gold shrink-0" />
            <span className="text-sm">
              <span className="font-semibold">Sign up to watch</span>
              <span className="text-inkdim"> — free, and it's how we remember you next time. No re-signing in.</span>
            </span>
          </button>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {BLUUTV_VIDEOS.map((v, i) => {
            const isWatched = watched.has(v.id);
            const locked = !playerId;
            return (
              <motion.button
                key={v.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
                onClick={() => openVideo(v.id)}
                className="relative rounded-xl overflow-hidden glass group text-left"
              >
                <div className="relative aspect-video bg-night">
                  <Image
                    src={thumbnailUrl(v.youtubeId)}
                    alt={v.title}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className={`object-cover transition-transform duration-300 ${locked ? "opacity-40 blur-[1px]" : "group-hover:scale-105"}`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
                    {locked ? (
                      <Lock size={22} className="text-white/90" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                        <Play size={16} className="text-night ml-0.5" fill="currentColor" />
                      </div>
                    )}
                  </div>
                  {v.isFinale && (
                    <span className="absolute top-2 left-2 bg-brand-red text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                      FINALE
                    </span>
                  )}
                  {isWatched && !locked && (
                    <span className="absolute top-2 right-2 bg-night/70 rounded-full p-1">
                      <CheckCircle2 size={14} className="text-brand-green" />
                    </span>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <div className="text-xs font-semibold truncate">{v.title}</div>
                  <div className="text-[10px] text-inkdim mt-0.5">{v.kind === "trailer" ? "Trailer" : "Episode"}</div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {playing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
            onClick={() => setPlayingId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-white">{playing.title}</span>
                <button onClick={() => setPlayingId(null)} className="text-white/70 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
                <iframe
                  src={embedUrl(playing.youtubeId)}
                  title={playing.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              <a
                href={watchUrl(playing.youtubeId)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-white/50 hover:text-white/80 mt-2 inline-block"
              >
                Having trouble? Open on YouTube &rarr;
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
