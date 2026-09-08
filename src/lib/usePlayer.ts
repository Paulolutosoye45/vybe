"use client";

import { useCallback, useEffect, useState } from "react";

export interface LevelProgressEntry {
  level: number;
  stars: number;
  bestDistanceM: number;
}

export interface PlayerProfile {
  firstName: string;
  queuePosition: number;
  referralCode: string;
  referralCount: number;
  streak: number;
  balance: number;
  ledger: { id: string; source: string; amount: number; createdAt: string }[];
  levelProgress: LevelProgressEntry[];
}

const STORAGE_KEY = "vybePlayerId";

export function usePlayer() {
  const [playerId, setPlayerIdState] = useState<string | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    setPlayerIdState(stored);
    setLoading(false);
  }, []);

  const refresh = useCallback(async (id?: string) => {
    const targetId = id ?? playerId;
    if (!targetId) return;
    try {
      const res = await fetch(`/api/player?playerId=${targetId}`);
      if (res.ok) setProfile(await res.json());
    } catch {
      // Network hiccup — non-fatal, the UI just keeps its last known state.
    }
  }, [playerId]);

  useEffect(() => {
    if (playerId) refresh(playerId);
  }, [playerId, refresh]);

  const setPlayerId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setPlayerIdState(id);
  }, []);

  return { playerId, profile, loading, refresh, setPlayerId };
}
