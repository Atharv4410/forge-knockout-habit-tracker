import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import ProgressRing from "../components/ui/ProgressRing.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import HabitCard from "../components/habit/HabitCard.jsx";
import MissReasonPicker from "../components/habit/MissReasonPicker.jsx";
import { isRequiredDay, isSuccess, computeStreaks, overallConsistency } from "../lib/stats.js";
import { todayISO, addDays, greetingForNow } from "../lib/dates.js";
import { parseNaturalLogEntry, generateWeeklyInsights } from "../ai/index.js";
import { MODES } from "../lib/format.js";

export default function Dashboard() {
  const { user, habits, checkins, adjustments, buddies, logCompletion, undoCompletion, logMiss, applyNaturalLogMatches, setMode, refreshAdjustments } = useApp();
  const navigate = useNavigate();
  const showToast = useToast();
  const today = todayISO();
  const yesterday = addDays(today, -1);

  useEffect(() => {
    refreshAdjustments();
  }, [refreshAdjustments]);

  const activeHabits = habits.filter((h) => h.active);

  const todaysHabits = useMemo(() => {
    const list = activeHabits.filter((h) => isRequiredDay(h, today) || h.frequencyType === "weekly_count");
    const scoped = user?.mode && user.mode !== "normal" ? list.filter((h) => h.essential) : list;
    return scoped.slice().sort((a, b) => (a.preferredTime || "").localeCompare(b.preferredTime || ""));
  }, [activeHabits, today, user?.mode]);

  const checkinFor = (habitId, date) => checkins.find((c) => c.habitId === habitId && c.date === date);

  const completedCount = todaysHabits.filter((h) => isSuccess(h, checkinFor(h.id, today))).length;
  const remaining = todaysHabits.length - completedCount;
  const dayRatio = todaysHabits.length === 0 ? 0 : completedCount / todaysHabits.length;

  const missedYesterday = useMemo(() => {
    return activeHabits.filter((h) => {
      if (h.frequencyType === "weekly_count") return false;
      if (!isRequiredDay(h, yesterday)) return false;
      const c = checkinFor(h.id, yesterday);
      return !isSuccess(h, c) && !(c && c.missReason);
    });
  }, [activeHabits, yesterday, checkins]);

  const myConsistency = overallConsistency(habits, checkins, 7);
  const myStreak = Math.max(0, ...activeHabits.map((h) => computeStreaks(h, checkins).current), 0);

  const insights = useMemo(() => generateWeeklyInsights(habits, checkins), [habits, checkins]);
  const pendingAdjustments = adjustments.filter((a) => a.status === "pending");
  const coach = useMemo(() => {
    if (pendingAdjustments.length > 0) {
      return { headline: "I noticed something.", body: pendingAdjustments[0].reasonText };
    }
    if (insights?.recommendation) return { headline: "Coach says", body: insights.recommendation.text };
    if (insights?.bullets?.length) return { headline: "Coach says", body: insights.bullets[0] };
    return { headline: "Coach says", body: "Log a few more days and I'll start spotting real patterns in your routine." };
  }, [pendingAdjustments, insights]);

  const [logText, setLogText] = useState("");
  const [pendingMatches, setPendingMatches] = useState(null);
  const [checkedMatch, setCheckedMatch] = useState({});

  function handleParse(e) {
    e.preventDefault();
    if (!logText.trim()) return;
    const matches = parseNaturalLogEntry(logText, habits);
    if (matches.length === 0) {
      showToast("Couldn't match that to a habit — try naming it directly.");
      return;
    }
    setPendingMatches(matches);
    setCheckedMatch(Object.fromEntries(matches.map((m) => [m.habitId, true])));
  }

  function confirmMatches() {
    const toApply = pendingMatches.filter((m) => checkedMatch[m.habitId]);
    applyNaturalLogMatches(toApply);
    showToast(`Logged ${toApply.length} update${toApply.length === 1 ? "" : "s"}.`);
    setPendingMatches(null);
    setLogText("");
  }

  if (habits.length === 0) {
    return (
      <div className="page">
        <EmptyState
          icon="🌱"
          title="Nothing here yet."
          body="Tell us what you're trying to improve and we'll build your starting system — a handful of realistic habits, not a huge list."
          action={<button type="button" className="btn btn-accent" onClick={() => navigate("/onboarding")}>Build my plan →</button>}
        />
      </div>
    );
  }

  return (
    <div className="page animate-in">
      <div className="stack gap-4">
        <span className="eyebrow">{greetingForNow()}</span>
        <h1 className="page-title">{user.name}.</h1>
      </div>

      {user.mode !== "normal" && (
        <div className="card card-pad row-between wrap gap-12" style={{ background: "var(--accent-soft)", borderColor: "var(--accent-soft-border)" }}>
          <span style={{ fontWeight: 700, color: "var(--accent-strong)" }}>
            {MODES.find((m) => m.key === user.mode)?.icon} {MODES.find((m) => m.key === user.mode)?.label} mode — showing essentials only.
          </span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMode("normal")}>Back to normal</button>
        </div>
      )}

      <div className="card card-dark hero-day-card">
        {todaysHabits.length > 0 && (
          <ProgressRing
            value={dayRatio}
            label={`${Math.round(dayRatio * 100)}%`}
            size={104}
            strokeWidth={9}
            trackColor="rgba(255,255,255,0.14)"
            fillColor="#ffffff"
            labelColor="#ffffff"
          />
        )}
        <div className="hero-day-copy">
          <span className="eyebrow" style={{ color: "var(--text-on-dark-faint)" }}>Your day</span>
          <span className="display-2" style={{ color: "var(--text-on-dark)" }}>
            {completedCount} / {todaysHabits.length || 0}
          </span>
          <span style={{ color: "var(--text-on-dark-muted)", fontWeight: 600, fontSize: "0.94rem" }}>
            {todaysHabits.length === 0 ? "Nothing scheduled today." : remaining === 0 ? "All done — nice work." : `${remaining} habit${remaining === 1 ? "" : "s"} left`}
          </span>
        </div>
      </div>

      {missedYesterday.length > 0 && (
        <div className="card card-pad stack gap-10">
          <span className="section-title">No worries. Let's get back on track today.</span>
          <p className="page-subtitle" style={{ margin: 0 }}>You missed {missedYesterday.length === 1 ? "this" : "these"} yesterday — want to note what happened? It helps your plan adapt.</p>
          {missedYesterday.map((h) => (
            <div key={h.id} className="row-between" style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>{h.name}</span>
              <MissYesterdayInline onSelect={(reason) => logMiss(h.id, yesterday, reason)} />
            </div>
          ))}
        </div>
      )}

      <div className="stack gap-14">
        <SectionHeader title="Today's habits" />
        <div className="stack gap-12 stagger">
          {todaysHabits.length === 0 ? (
            <EmptyState icon="✨" title="Nothing due today" body="Enjoy the rest — check the Habits tab to see everything on your plan." />
          ) : (
            todaysHabits.map((h) => {
              const c = checkinFor(h.id, today);
              const streak = computeStreaks(h, checkins).current;
              return (
                <HabitCard
                  key={h.id}
                  habit={h}
                  todayCheckin={c}
                  streak={streak}
                  onComplete={() => logCompletion(h.id)}
                  onUndo={() => undoCompletion(h.id, today)}
                  onMiss={(reason) => logMiss(h.id, today, reason)}
                  onAddAmount={(value) => logCompletion(h.id, { value })}
                />
              );
            })
          )}
        </div>
      </div>

      <details className="card card-pad stack gap-10" style={{ cursor: "pointer" }}>
        <summary className="section-title" style={{ listStyle: "none", cursor: "pointer" }}>Quick log</summary>
        <p className="page-subtitle" style={{ margin: "6px 0 0" }}>
          Describe what you did in plain language — "went to the gym and drank 2L of water" — and we'll match it to your habits.
        </p>
        <form onSubmit={handleParse} className="stack gap-10">
          <div className="row gap-8">
            <input className="input" value={logText} onChange={(e) => setLogText(e.target.value)} placeholder="e.g. Walked 8000 steps and read for 20 minutes" />
            <button type="submit" className="btn btn-secondary">Parse</button>
          </div>
          {pendingMatches && (
            <div className="stack gap-8" style={{ padding: 12, background: "var(--surface-sunken)", borderRadius: "var(--r-md)" }}>
              <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>Found {pendingMatches.length} update{pendingMatches.length === 1 ? "" : "s"}. Save them?</span>
              {pendingMatches.map((m) => (
                <label key={m.habitId} className="row gap-8" style={{ fontSize: "0.9rem" }}>
                  <input type="checkbox" checked={!!checkedMatch[m.habitId]} onChange={(e) => setCheckedMatch((prev) => ({ ...prev, [m.habitId]: e.target.checked }))} />
                  {m.habitName} {m.value != null ? `→ ${m.value}` : "→ completed"}
                </label>
              ))}
              <div className="row gap-8">
                <button type="button" className="btn btn-accent btn-sm" onClick={confirmMatches}>Confirm</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPendingMatches(null)}>Cancel</button>
              </div>
            </div>
          )}
        </form>
      </details>

      <div className="stack gap-14">
        <SectionHeader title="Your people" action={<button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate("/app/profile")}>Manage</button>} />
        <div className="card card-pad stack gap-14">
          <div className="row-between">
            <div className="row gap-10">
              <Avatar name={user.name} size={38} ring />
              <span style={{ fontWeight: 700, fontSize: "0.94rem" }}>You</span>
            </div>
            <span className="streak-pill"><span className="streak-flame" aria-hidden="true">🔥</span> {myStreak} · {myConsistency != null ? `${Math.round(myConsistency * 100)}%` : "—"}</span>
          </div>
          {buddies.length === 0 ? (
            <div className="row-between wrap gap-10" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <span className="page-subtitle" style={{ margin: 0 }}>Better together — add an accountability partner.</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate("/app/profile")}>Add a friend</button>
            </div>
          ) : (
            buddies.map((b) => (
              <div key={b.id} className="row-between" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <div className="row gap-10">
                  <Avatar name={b.name} size={38} />
                  <span style={{ fontWeight: 700, fontSize: "0.94rem" }}>{b.name}</span>
                </div>
                <span className="streak-pill"><span className="streak-flame" aria-hidden="true">🔥</span> {b.streak} · {b.weeklyConsistency}%</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card card-pad stack gap-10" style={{ background: "var(--ai-soft)", border: "1px solid #e2d9ff" }}>
        <span className="badge badge-ai" style={{ alignSelf: "flex-start" }}>🤖 {coach.headline}</span>
        <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.5 }}>{coach.body}</p>
        <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => navigate("/app/insights")}>
          View insight →
        </button>
      </div>
    </div>
  );
}

function MissYesterdayInline({ onSelect }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>What got in the way?</button>;
  }
  return <MissReasonPicker onCancel={() => setOpen(false)} onSelect={onSelect} />;
}
