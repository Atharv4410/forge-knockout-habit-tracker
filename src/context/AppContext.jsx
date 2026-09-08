import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadDB, saveDB, newId, resetDB, createDefaultDB } from "../lib/db.js";
import { todayISO } from "../lib/dates.js";
import { suggestAdjustments as computeAdjustments, coachResponse } from "../ai/index.js";

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [db, setDb] = useState(() => loadDB());

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const completeOnboarding = useCallback(({ name, primaryGoal, secondaryGoals, customGoalText, answers, acceptedHabits }) => {
    setDb((prev) => {
      const userId = prev.user?.id || newId();
      const now = todayISO();
      const habits = acceptedHabits.map((s) => ({
        id: newId(),
        userId,
        name: s.name,
        description: s.description,
        category: s.category,
        why: s.why,
        frequencyType: s.frequencyType,
        frequencyTarget: s.frequencyTarget ?? null,
        quantitative: !!s.quantitative,
        targetValue: s.targetValue ?? null,
        unit: s.unit ?? null,
        preferredTime: s.preferredTime,
        difficulty: s.difficulty,
        essential: !!s.essential,
        createdAt: now,
        active: true,
        archivedAt: null,
      }));
      return {
        ...prev,
        user: {
          id: userId,
          name,
          createdAt: prev.user?.createdAt || now,
          primaryGoal,
          secondaryGoals: secondaryGoals || [],
          customGoalText: customGoalText || "",
          onboardingAnswers: answers,
          onboarded: true,
          mode: "normal",
        },
        habits: [...prev.habits, ...habits],
      };
    });
  }, []);

  const addHabit = useCallback((input) => {
    setDb((prev) => ({
      ...prev,
      habits: [
        ...prev.habits,
        {
          id: newId(),
          userId: prev.user?.id,
          createdAt: todayISO(),
          active: true,
          archivedAt: null,
          frequencyTarget: null,
          quantitative: false,
          targetValue: null,
          unit: null,
          difficulty: "medium",
          essential: false,
          category: "custom",
          why: "",
          ...input,
        },
      ],
    }));
  }, []);

  const updateHabit = useCallback((habitId, patch) => {
    setDb((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === habitId ? { ...h, ...patch } : h)),
    }));
  }, []);

  const archiveHabit = useCallback((habitId) => {
    setDb((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === habitId ? { ...h, active: false, archivedAt: todayISO() } : h)),
    }));
  }, []);

  const upsertCheckin = useCallback((habitId, date, patch) => {
    setDb((prev) => {
      const existingIdx = prev.checkins.findIndex((c) => c.habitId === habitId && c.date === date);
      if (existingIdx === -1) {
        const checkin = {
          id: newId(),
          habitId,
          userId: prev.user?.id,
          date,
          completed: false,
          value: null,
          note: null,
          missReason: null,
          createdAt: new Date().toISOString(),
          ...patch,
        };
        return { ...prev, checkins: [...prev.checkins, checkin] };
      }
      const checkins = prev.checkins.slice();
      checkins[existingIdx] = { ...checkins[existingIdx], ...patch };
      return { ...prev, checkins };
    });
  }, []);

  const logCompletion = useCallback((habitId, { value, note, date } = {}) => {
    upsertCheckin(habitId, date || todayISO(), { completed: true, value: value ?? null, note: note ?? null, missReason: null });
  }, [upsertCheckin]);

  const undoCompletion = useCallback((habitId, date) => {
    setDb((prev) => ({
      ...prev,
      checkins: prev.checkins.filter((c) => !(c.habitId === habitId && c.date === (date || todayISO()))),
    }));
  }, []);

  const logMiss = useCallback((habitId, date, missReason) => {
    upsertCheckin(habitId, date, { completed: false, missReason, value: null });
  }, [upsertCheckin]);

  const refreshAdjustments = useCallback(() => {
    setDb((prev) => {
      const proposals = computeAdjustments(prev.habits, prev.checkins, prev.adjustments);
      if (proposals.length === 0) return prev;
      const now = new Date().toISOString();
      const newOnes = proposals.map((p) => ({ id: newId(), status: "pending", createdAt: now, resolvedAt: null, ...p }));
      return { ...prev, adjustments: [...prev.adjustments, ...newOnes] };
    });
  }, []);

  const resolveAdjustment = useCallback((adjustmentId, accept) => {
    setDb((prev) => {
      const adjustment = prev.adjustments.find((a) => a.id === adjustmentId);
      if (!adjustment) return prev;
      const habits = accept
        ? prev.habits.map((h) => (h.id === adjustment.habitId ? { ...h, ...adjustment.proposal } : h))
        : prev.habits;
      return {
        ...prev,
        habits,
        adjustments: prev.adjustments.map((a) =>
          a.id === adjustmentId ? { ...a, status: accept ? "accepted" : "dismissed", resolvedAt: new Date().toISOString() } : a,
        ),
      };
    });
  }, []);

  const sendCoachMessage = useCallback((text, context) => {
    setDb((prev) => {
      const now = new Date().toISOString();
      const userMsg = { id: newId(), role: "user", text, createdAt: now };
      const reply = coachResponse(text, context);
      const coachMsg = { id: newId(), role: "coach", text: reply, createdAt: new Date().toISOString() };
      return { ...prev, coachMessages: [...prev.coachMessages, userMsg, coachMsg] };
    });
  }, []);

  const applyNaturalLogMatches = useCallback((matches) => {
    setDb((prev) => {
      let checkins = prev.checkins.slice();
      const today = todayISO();
      for (const m of matches) {
        const idx = checkins.findIndex((c) => c.habitId === m.habitId && c.date === today);
        const patch = { completed: true, value: m.value ?? null, missReason: null };
        if (idx === -1) {
          checkins.push({ id: newId(), habitId: m.habitId, userId: prev.user?.id, date: today, note: null, createdAt: new Date().toISOString(), ...patch });
        } else {
          checkins[idx] = { ...checkins[idx], ...patch };
        }
      }
      return { ...prev, checkins };
    });
  }, []);

  const setMode = useCallback((mode) => {
    setDb((prev) => ({ ...prev, user: { ...prev.user, mode } }));
  }, []);

  const updateSettings = useCallback((patch) => {
    setDb((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const addBuddy = useCallback((buddy) => {
    setDb((prev) => ({ ...prev, buddies: [...prev.buddies, { id: newId(), shareStreak: true, shareConsistency: true, ...buddy }] }));
  }, []);

  const updateBuddy = useCallback((buddyId, patch) => {
    setDb((prev) => ({ ...prev, buddies: prev.buddies.map((b) => (b.id === buddyId ? { ...b, ...patch } : b)) }));
  }, []);

  const removeBuddy = useCallback((buddyId) => {
    setDb((prev) => ({ ...prev, buddies: prev.buddies.filter((b) => b.id !== buddyId) }));
  }, []);

  const resetAll = useCallback(() => {
    resetDB();
    setDb(createDefaultDB());
  }, []);

  const value = useMemo(
    () => ({
      db,
      user: db.user,
      habits: db.habits,
      checkins: db.checkins,
      adjustments: db.adjustments,
      coachMessages: db.coachMessages,
      buddies: db.buddies,
      settings: db.settings,
      completeOnboarding,
      addHabit,
      updateHabit,
      archiveHabit,
      logCompletion,
      undoCompletion,
      logMiss,
      refreshAdjustments,
      resolveAdjustment,
      sendCoachMessage,
      applyNaturalLogMatches,
      setMode,
      updateSettings,
      addBuddy,
      updateBuddy,
      removeBuddy,
      resetAll,
    }),
    [db, completeOnboarding, addHabit, updateHabit, archiveHabit, logCompletion, undoCompletion, logMiss, refreshAdjustments, resolveAdjustment, sendCoachMessage, applyNaturalLogMatches, setMode, updateSettings, addBuddy, updateBuddy, removeBuddy, resetAll],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
