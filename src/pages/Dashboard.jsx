import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import ProgressRing from "../components/ui/ProgressRing.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import HabitCard from "../components/habit/HabitCard.jsx";
import MissReasonPicker from "../components/habit/MissReasonPicker.jsx";
import { isRequiredDay, isSuccess, computeStreaks } from "../lib/stats.js";
import { todayISO, addDays, greetingForNow } from "../lib/dates.js";
import { parseNaturalLogEntry } from "../ai/index.js";
import { MODES } from "../lib/format.js";

export default function Dashboard() {
  const { user, habits, checkins, logCompletion, undoCompletion, logMiss, applyNaturalLogMatches, setMode, refreshAdjustments } = useApp();
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

  const missedYesterday = useMemo(() => {
    return activeHabits.filter((h) => {
      if (h.frequencyType === "weekly_count") return false;
      if (!isRequiredDay(h, yesterday)) return false;
      const c = checkinFor(h.id, yesterday);
      return !isSuccess(h, c) && !(c && c.missReason);
    });
  }, [activeHabits, yesterday, checkins]);

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
          title="Let's build your first system."
          body="Tell us what you want to improve and we'll create a starting plan — a handful of realistic habits, not a huge list."
          action={<button type="button" className="btn btn-accent" onClick={() => navigate("/onboarding")}>Build my plan</button>}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="row-between wrap gap-16">
        <div className="stack gap-4">
          <h1 className="page-title">{greetingForNow()}, {user.name}</h1>
          <p className="page-subtitle">
            {todaysHabits.length === 0 ? "Nothing scheduled for today." : `Today's progress · ${completedCount} / ${todaysHabits.length} completed`}
          </p>
        </div>
        {todaysHabits.length > 0 && (
          <ProgressRing value={completedCount / todaysHabits.length} label={`${completedCount}/${todaysHabits.length}`} size={76} strokeWidth={7} />
        )}
      </div>

      {user.mode !== "normal" && (
        <div className="card card-pad row-between wrap gap-12" style={{ background: "var(--accent-soft)", borderColor: "var(--accent-soft-border)" }}>
          <span style={{ fontWeight: 600, color: "var(--accent-strong)" }}>
            {MODES.find((m) => m.key === user.mode)?.icon} {MODES.find((m) => m.key === user.mode)?.label} mode is active — showing essential habits only.
          </span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMode("normal")}>Back to normal</button>
        </div>
      )}

      {missedYesterday.length > 0 && (
        <div className="card card-pad stack gap-10">
          <span className="section-title">No worries. Let's get back on track today.</span>
          <p className="page-subtitle" style={{ margin: 0 }}>You missed {missedYesterday.length === 1 ? "this" : "these"} yesterday — want to note what happened? It helps your plan adapt.</p>
          {missedYesterday.map((h) => (
            <div key={h.id} className="row-between" style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              <span style={{ fontWeight: 600, fontSize: "0.92rem" }}>{h.name}</span>
              <MissYesterdayInline habit={h} yesterday={yesterday} onSelect={(reason) => logMiss(h.id, yesterday, reason)} />
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleParse} className="card card-pad stack gap-10">
        <span className="section-title">Quick log</span>
        <p className="page-subtitle" style={{ margin: 0 }}>
          Describe what you did in plain language — "went to the gym and drank 2L of water" — and we'll match it to your habits.
        </p>
        <div className="row gap-8">
          <input className="input" value={logText} onChange={(e) => setLogText(e.target.value)} placeholder="e.g. Walked 8000 steps and read for 20 minutes" />
          <button type="submit" className="btn btn-secondary">Parse</button>
        </div>
        {pendingMatches && (
          <div className="stack gap-8" style={{ marginTop: 4, padding: 12, background: "var(--surface-sunken)", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>Found {pendingMatches.length} update{pendingMatches.length === 1 ? "" : "s"}. Save them?</span>
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

      <div className="stack gap-12">
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
  );
}

function MissYesterdayInline({ onSelect }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>What got in the way?</button>;
  }
  return <MissReasonPicker onCancel={() => setOpen(false)} onSelect={onSelect} />;
}
