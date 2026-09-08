import { useApp } from "../context/AppContext.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import ProgressRing from "../components/ui/ProgressRing.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import {
  overallConsistency,
  trailingCompletionRate,
  computeStreaks,
  computeXP,
  computeLevel,
  xpForLevel,
  computeAchievements,
  habitLastNWeeksCounts,
} from "../lib/stats.js";
export default function Progress() {
  const { habits, checkins } = useApp();
  const active = habits.filter((h) => h.active);

  if (active.length === 0) {
    return (
      <div className="page">
        <EmptyState icon="📈" title="Nothing to show yet" body="Once you've got a few habits running, your progress dashboard fills in here." />
      </div>
    );
  }

  const weekConsistency = overallConsistency(habits, checkins, 7);
  const monthConsistency = overallConsistency(habits, checkins, 30);
  const trend = weekConsistency != null && monthConsistency != null ? weekConsistency - monthConsistency : null;

  const rated = active
    .map((h) => ({ habit: h, rate: trailingCompletionRate(h, checkins, 30) }))
    .filter((r) => r.rate != null);
  const strongest = rated.length ? rated.reduce((a, b) => (b.rate > a.rate ? b : a)) : null;
  const weakest = rated.length ? rated.reduce((a, b) => (b.rate < a.rate ? b : a)) : null;

  let bestCurrentStreak = { habit: null, current: 0 };
  let bestEverStreak = { habit: null, best: 0 };
  for (const h of active) {
    const s = computeStreaks(h, checkins);
    if (s.current > bestCurrentStreak.current) bestCurrentStreak = { habit: h, current: s.current };
    if (s.best > bestEverStreak.best) bestEverStreak = { habit: h, best: s.best };
  }

  const xp = computeXP(habits, checkins);
  const level = computeLevel(xp);
  const xpFloor = xpForLevel(level);
  const xpCeil = xpForLevel(level + 1);
  const levelProgress = (xp - xpFloor) / (xpCeil - xpFloor);
  const achievements = computeAchievements(habits, checkins);

  const goalHabits = active.filter((h) => h.quantitative || h.frequencyType === "weekly_count").slice(0, 4);

  return (
    <div className="page">
      <div className="stack gap-4">
        <h1 className="page-title">Progress</h1>
        <p className="page-subtitle">A grounded view of what's actually happening — every number here comes from your check-in history.</p>
      </div>

      <div className="card card-pad row gap-24 wrap" style={{ alignItems: "center" }}>
        <ProgressRing value={monthConsistency || 0} label={monthConsistency != null ? `${Math.round(monthConsistency * 100)}%` : "—"} sublabel="consistency" size={104} strokeWidth={9} />
        <div className="stack gap-6" style={{ flex: 1, minWidth: 200 }}>
          <span className="section-title">Overall consistency</span>
          <p className="page-subtitle" style={{ margin: 0 }}>
            {monthConsistency == null
              ? "Still gathering data — keep checking in."
              : trend == null
              ? `${Math.round(monthConsistency * 100)}% over the last 30 days.`
              : `${Math.round(monthConsistency * 100)}% over the last 30 days, ${trend >= 0 ? "trending up" : "cooling off"} recently.`}
          </p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Best current streak" value={bestCurrentStreak.habit ? `🔥 ${bestCurrentStreak.current}` : "—"} sub={bestCurrentStreak.habit?.name} />
        <StatCard label="Best streak ever" value={bestEverStreak.habit ? `🏆 ${bestEverStreak.best}` : "—"} sub={bestEverStreak.habit?.name} />
        <StatCard label="Weekly completion" value={weekConsistency != null ? `${Math.round(weekConsistency * 100)}%` : "—"} />
        <StatCard label="Monthly completion" value={monthConsistency != null ? `${Math.round(monthConsistency * 100)}%` : "—"} />
        <StatCard label="Strongest habit" value={strongest ? `${Math.round(strongest.rate * 100)}%` : "—"} sub={strongest?.habit.name} />
        <StatCard label="Weakest habit" value={weakest ? `${Math.round(weakest.rate * 100)}%` : "—"} sub={weakest?.habit.name} />
      </div>

      {goalHabits.length > 0 && (
        <div className="card card-pad stack gap-14">
          <span className="section-title">Goal progress</span>
          {goalHabits.map((h) => (
            <GoalProgressRow key={h.id} habit={h} checkins={checkins} />
          ))}
        </div>
      )}

      <div className="card card-pad stack gap-16">
        <div className="row-between">
          <span className="section-title">Level {level}</span>
          <span className="badge badge-accent">{xp} XP</span>
        </div>
        <div className="quant-progress-track" style={{ height: 8 }}>
          <div className="quant-progress-fill" style={{ width: `${Math.round((levelProgress || 0) * 100)}%` }} />
        </div>
        <span className="page-subtitle" style={{ margin: 0 }}>{Math.max(0, xpCeil - xp)} XP to level {level + 1}</span>

        {achievements.length > 0 && (
          <div className="chip-grid">
            {achievements.map((a) => (
              <span key={a.key} className="badge badge-success" style={{ fontSize: "0.82rem", padding: "6px 12px" }}>
                {a.icon} {a.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GoalProgressRow({ habit, checkins }) {
  if (habit.frequencyType === "weekly_count") {
    const counts = habitLastNWeeksCounts(habit, checkins, 1);
    const current = counts[0] ?? 0;
    return (
      <div className="row-between">
        <span style={{ fontWeight: 600, fontSize: "0.92rem" }}>{habit.name}</span>
        <span className="page-subtitle" style={{ margin: 0 }}>{current}× → {habit.frequencyTarget}× / week</span>
      </div>
    );
  }
  const recent = checkins.filter((c) => c.habitId === habit.id && c.value != null).slice(-7);
  const avg = recent.length ? recent.reduce((a, b) => a + b.value, 0) / recent.length : 0;
  return (
    <div className="row-between">
      <span style={{ fontWeight: 600, fontSize: "0.92rem" }}>{habit.name}</span>
      <span className="page-subtitle" style={{ margin: 0 }}>{Math.round(avg)} → {habit.targetValue} {habit.unit}</span>
    </div>
  );
}
