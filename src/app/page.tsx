"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Hero from "@/components/Hero";
import GameArcade from "@/components/GameArcade";
import RewardsPanel from "@/components/RewardsPanel";
import Leaderboard from "@/components/Leaderboard";
import WaitlistForm from "@/components/WaitlistForm";
import ReferralCard from "@/components/ReferralCard";
import Footer from "@/components/Footer";
import { usePlayer } from "@/lib/usePlayer";
import { gateDistanceToday } from "@/lib/gate";
import Image from "next/image";

const OPENS = [
  { n: "01", title: "Homecoming", body: "Flying in or driving home — FirstBank meets you at the journey, not just the arrival." },
  { n: "02", title: "The List", body: "Every festival, market and hidden gem this December, curated state by state." },
  { n: "03", title: "Every door in the city", body: "The way you bank starts opening doors you couldn't get through before." },
  { n: "04", title: "Your December, wrapped", body: "At the end of it all, a recap that's entirely yours — worth keeping, worth sharing." },
];



type NavLink = { label: string; targetId: string };

const NAV_LINKS: NavLink[] = [
  { label: "Arcade", targetId: "arcade" },
  { label: "Leaderboard", targetId: "leaderboard" },
  { label: "Launch", targetId: "launch" },
  { label: "Waitlist", targetId: "waitlist" },
];

function Navbar({
  playerId,
  onJoinClick,
}: {
  playerId: string | null;
  onJoinClick: () => void;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  function handleLinkClick(targetId: string) {
    setIsMenuOpen(false);
    document.body.style.overflow = ""; // unlock scroll immediately, don't wait on the effect

    requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
    });
  }

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${isScrolled ? "bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/[0.06]" : "bg-transparent"
        }`}
    >
      <nav className="max-w-6xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/diav-logo.webp"
              alt="December Issa Vybe, powered in part by FirstBank"
              width={50}
              height={20}
              priority
              className="drop-shadow-[0_8px_30px_rgba(47,184,224,0.25)]"
            />
          </div>
        </div>



        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.targetId}>
              <button
                onClick={() => handleLinkClick(link.targetId)}
                className="text-sm text-inkdim hover:text-white transition-colors"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-4">
          {playerId && (
            <span className="text-xs text-inkdim px-3 py-1.5 rounded-full border border-white/[0.08]">
              In queue
            </span>
          )}
          <button
            onClick={onJoinClick}
            className="text-sm font-semibold px-4 py-2 rounded-full bg-brand-cyan text-black hover:opacity-90 transition-opacity"
          >
            Join waitlist
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden relative w-9 h-9 flex items-center justify-center shrink-0"
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          <span
            className={`absolute h-[1.5px] w-5 bg-white transition-transform duration-300 ${isMenuOpen ? "rotate-45" : "-translate-y-1.5"
              }`}
          />
          <span
            className={`absolute h-[1.5px] w-5 bg-white transition-opacity duration-200 ${isMenuOpen ? "opacity-0" : "opacity-100"
              }`}
          />
          <span
            className={`absolute h-[1.5px] w-5 bg-white transition-transform duration-300 ${isMenuOpen ? "-rotate-45" : "translate-y-1.5"
              }`}
          />
        </button>
      </nav>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-b border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-md"
          >
            <ul className="px-6 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.targetId}>
                  <button
                    onClick={() => handleLinkClick(link.targetId)}
                    className="w-full text-left py-3 text-base text-inkdim hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li className="pt-2">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onJoinClick();
                  }}
                  className="w-full text-center text-sm font-semibold px-4 py-3 rounded-full bg-brand-cyan text-black"
                >
                  Join waitlist
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const referredByCode = searchParams.get("ref");
  const { playerId, profile, setPlayerId, refresh } = usePlayer();
  const [justJoined, setJustJoined] = useState<{ queuePosition: number; referralCode: string } | null>(null);
  const gate = gateDistanceToday();

  function scrollToArcade() {
    document.getElementById("arcade")?.scrollIntoView();
  }
  function scrollToWaitlist() {
    document.getElementById("waitlist")?.scrollIntoView();
  }

  function handleSignupSuccess(id: string, queuePosition: number, referralCode: string) {
    setPlayerId(id);
    setJustJoined({ queuePosition, referralCode });
    refresh(id);
  }

  return (
    <main id="top">
      <Navbar playerId={playerId} onJoinClick={scrollToWaitlist} />

      {/* Offset for the fixed navbar */}
      <div className="pt-16">
        <Hero onPlayClick={scrollToArcade} onJoinClick={scrollToWaitlist} />

        <section id="arcade">
          <GameArcade
            playerId={playerId}
            profile={profile}
            gateDistanceToday={gate}
            onNeedSignup={scrollToWaitlist}
            onProfileRefresh={() => playerId && refresh(playerId)}
          />
        </section>

        {profile && (
          <section className="max-w-5xl mx-auto px-6 sm:px-8 pb-4">
            <RewardsPanel profile={profile} />
          </section>
        )}

        <section id="leaderboard">
          <Leaderboard />
        </section>

        <section id="waitlist" className="section-pad border-t border-white/[0.06]">
          <div className="max-w-3xl  mx-auto px-6 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="text-center">
                <span className="text-xs mx-auto text-center font-semibold tracking-[0.16em] text-brand-cyan uppercase">
                  No cost. No catch.
                </span>
              </div>

              <h2 className="font-serif text-center mx-auto text-3xl sm:text-4xl md:text-5xl font-semibold mb-4 mt-2 max-w-lg tracking-tight">
                Claim your place before the door opens
              </h2>
              <p className="text-inkdim max-w-lg text-center mx-auto mb-10 text-[15px] leading-relaxed">
                Just an account you&rsquo;ll actually use. Positions are held in the order people
                join — bring a friend and yours moves up.
              </p>

              {justJoined ? (
                <ReferralCard queuePosition={justJoined.queuePosition} referralCode={justJoined.referralCode} />
              ) : (
                <WaitlistForm referredByCode={referredByCode} onSuccess={handleSignupSuccess} />
              )}
            </motion.div>
          </div>
        </section>

        <section id="launch" className="section-pad border-t border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6 sm:px-8">
            <div className="mb-10">
              <span className="text-xs font-semibold tracking-[0.16em] text-brand-cyan uppercase">
                The 1 October launch
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold mt-2 max-w-lg tracking-tight">
                What opens on 1 October
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {OPENS.map((o, i) => (
                <motion.div
                  key={o.n}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4 }}
                  className="glass rounded-2xl p-6 min-h-[180px] sm:min-h-[210px] flex flex-col justify-between hover:border-brand-cyan/30 transition-colors"
                >
                  <span className="font-serif text-sm font-semibold grad-text">{o.n}</span>
                  <div>
                    <h3 className="font-serif text-lg font-semibold mt-4 mb-2">{o.title}</h3>
                    <p className="text-sm text-inkdim leading-relaxed">{o.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
