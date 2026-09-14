"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, ArrowRight } from "lucide-react";

interface Question {
  id: string;
  category: string;
  prompt: string;
  options: string[];
}

export default function NaijaNightSchool({
  playerId,
  onNeedSignup,
  onComplete,
}: {
  playerId: string | null;
  onNeedSignup: () => void;
  onComplete: (result: { pointsEarned: number; streak?: number; milestonesHit?: { days: number; grantsFreeze: boolean }[] }) => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ correctCount: number; pointsEarned: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/trivia${playerId ? `?playerId=${playerId}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setQuestions(data.questions);
        setAlreadyPlayed(data.alreadyPlayed);
        setPreviousScore(data.previousScore);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => { mounted = false; };
  }, [playerId]);

  function selectAnswer(questionId: string, index: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: index }));
    setTimeout(() => {
      if (step < questions.length - 1) setStep((s) => s + 1);
      else submitRound({ ...answers, [questionId]: index });
    }, 300);
  }

  async function submitRound(finalAnswers: Record<string, number>) {
    if (!playerId) { onNeedSignup(); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/trivia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          answers: questions.map((q) => ({ questionId: q.id, selectedIndex: finalAnswers[q.id] ?? -1 })),
        }),
      });
      const data = await res.json();
      setResult({ correctCount: data.correctCount, pointsEarned: data.pointsEarned });
      onComplete(data);
    } catch {
      // Non-fatal — the quiz UI still shows what was answered locally.
    }
    setSubmitting(false);
  }

  if (loading) {
    return <div className="glass-strong rounded-2xl p-10 text-center text-inkdim text-sm">Loading tonight&rsquo;s round&hellip;</div>;
  }

  if (alreadyPlayed && !result) {
    return (
      <div className="glass-strong rounded-2xl p-10 text-center">
        <GraduationCap size={28} className="text-brand-cyan mx-auto mb-3" />
        <p className="font-serif text-2xl font-semibold mb-1">Tonight&rsquo;s class is done</p>
        <p className="text-inkdim text-sm">
          You scored <span className="text-ink font-semibold">{previousScore} / 5</span> today. New round tomorrow.
        </p>
      </div>
    );
  }

  if (result) {
    const perfect = result.correctCount === 5;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-2xl p-10 text-center">
        <div className="text-4xl mb-3">{perfect ? "\u{1F393}" : result.correctCount >= 3 ? "\u{1F44F}" : "\u{1F4DA}"}</div>
        <p className="font-serif text-3xl font-semibold mb-2">{result.correctCount} / 5 correct</p>
        <p className="text-brand-cyan font-semibold mb-1">+{result.pointsEarned} points</p>
        <p className="text-inkdim text-sm">{perfect ? "Perfect round — top marks." : "Come back tomorrow for a new round."}</p>
      </motion.div>
    );
  }

  const q = questions[step];
  if (!q) return null;

  return (
    <div className="glass-strong rounded-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-brand-cyan">
          <GraduationCap size={15} /> {q.category}
        </div>
        <div className="text-xs text-inkdim">Question {step + 1} of {questions.length}</div>
      </div>
      <div className="flex gap-1.5 mb-6">
        {questions.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < step ? "bg-brand-cyan" : i === step ? "bg-brand-cyan/50" : "bg-white/10"}`} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
          <p className="font-serif text-xl sm:text-2xl font-semibold mb-6 leading-snug">{q.prompt}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                disabled={submitting}
                onClick={() => selectAnswer(q.id, i)}
                className={`glass rounded-xl px-5 py-4 text-left text-sm font-medium hover:border-brand-cyan/50 hover:bg-white/[0.06] transition-colors ${
                  answers[q.id] === i ? "border-brand-cyan bg-brand-cyan/10" : ""
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      {!playerId && (
        <p className="text-xs text-inkdim mt-6 flex items-center gap-1.5">
          Playing without an account — <button onClick={onNeedSignup} className="text-brand-cyan font-semibold inline-flex items-center gap-1">join to save your score <ArrowRight size={11} /></button>
        </p>
      )}
    </div>
  );
}
