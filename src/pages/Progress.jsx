import { useApp } from "../context/AppContext.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import ProgressRing from "../components/ui/ProgressRing.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import {
  overallConsistency,
  trailingCompletionRate,
  computeStreaks,
  computeXP,
  computeLevel,
  xpForLevel,
  computeAchievements,
  habitLastNWeeksCounts,
  weekdayPattern,
} from "../lib/stats.js";
import { weekdayLabel } from "../lib/dates.js";

const ACHIEVEMENT_DEFS = [
  { key: "first_checkin", label: "First Step", icon: "🌱" },
  { key: "week_streak", label: "7-Day Streak", icon: "🔥" },
  { key: "month_streak", label: "30-Day Streak", icon: "🏆" },
  { key: "perfect_week", label: "Perfect Week", icon: "💯" },
  { key: "consistency_champion", label: "Consistency Champion", icon: "⭐" },
];

export default function Progress() {
  const { habits, checkins } = useApp();
  const active = habits.filter((h) => h.active);

  if (active.length === 0) {
    return (
      <div className="page">
        <EmptyState icon="📈" title="Today is day one." body="Once you've got a few habits running, your progress fills in here." />
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
  const unlocked = new Set(computeAchievements(habits, checkins).map((a) => a.key));

  const goalHabits = active.filter((h) => h.quantitative || h.frequencyType === "weekly_count").slice(0, 4);
  const weekdayRates = weekdayPattern(habits, checkins, 3);
  const maxRate = Math.max(0.2, ...weekdayRates.map((d) => d.rate || 0));

  return (
    <div className="page animate-in">
      <div className="stack gap-4">
        <h1 className="page-title">Your progress</h1>
        <p className="page-subtitle">Every number here comes straight from your check-in history.</p>
      </div>

      <div className="card card-dark hero-day-card">
        <ProgressRing
          value={monthConsistency || 0}
          label={monthConsistency != null ? `${Math.round(monthConsistency * 100)}%` : "—"}
          size={104}
          strokeWidth={9}
          trackColor="rgba(255,255,255,0.14)"
          fillColor="#ffffff"
          labelColor="#ffffff"
        />
        <div className="hero-day-copy">
          <span className="eyebrow" style={{ color: "var(--text-on-dark-faint)" }}>Consistency</span>
          <span className="display-2" style={{ color: "var(--text-on-dark)" }}>
            {monthConsistency != null ? `${Math.round(monthConsistency * 100)}%` : "—"}
          </span>
          <span style={{ color: "var(--text-on-dark-muted)", fontWeight: 600, fontSize: "0.94rem" }}>
            {monthConsistency == null
              ? "Still gathering data — keep checking in."
              : trend == null
              ? "over the last 30 days"
              : `${trend >= 0 ? "trending up" : "cooling off"} recently`}
          </span>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Current streak" value={bestCurrentStreak.habit ? `🔥 ${bestCurrentStreak.current}` : "—"} sub={bestCurrentStreak.habit?.name} />
        <StatCard label="Best streak" value={bestEverStreak.habit ? `🏆 ${bestEverStreak.best}` : "—"} sub={bestEverStreak.habit?.name} />
        <StatCard label="XP" value={`⚡ ${xp.toLocaleString()}`} sub={`Level ${level}`} />
        <StatCard
          label="This week"
          value={weekConsistency != null ? `📈 ${Math.round(weekConsistency * 100)}%` : "—"}
          sub={trend != null ? `${trend >= 0 ? "+" : ""}${Math.round(trend * 100)}% vs month` : undefined}
        />
      </div>

      <div className="card card-pad stack gap-16">
        <SectionHeader title="Your trends" />
        <div className="row gap-10" style={{ alignItems: "flex-end", height: 84 }}>
          {weekdayRates.map((d) => (
            <div key={d.weekday} className="stack gap-6" style={{ flex: 1, alignItems: "center" }}>
              <div
                title={d.rate != null ? `${Math.round(d.rate * 100)}%` : "No data"}
                style={{
                  width: "100%",
                  maxWidth: 22,
                  height: Math.max(4, ((d.rate ?? 0) / maxRate) * 56),
                  borderRadius: 6,
                  background: d.rate == null ? "var(--surface-sunken)" : "linear-gradient(180deg, var(--accent), #7a3ff0)",
                }}
              />
              <span className="micro">{weekdayLabel(d.weekday)[0]}</span>
            </div>
          ))}
        </div>
        {strongest && weakest && strongest.habit.id !== weakest.habit.id && (
          <p className="page-subtitle" style={{ margin: 0 }}>
            Strongest: <strong style={{ color: "var(--text)" }}>{strongest.habit.name}</strong> ({Math.round(strongest.rate * 100)}%) · Weakest: <strong style={{ color: "var(--text)" }}>{weakest.habit.name}</strong> ({Math.round(weakest.rate * 100)}%)
          </p>
        )}
      </div>

      {goalHabits.length > 0 && (
        <div className="card card-pad stack gap-14">
          <SectionHeader title="Goal progress" />
          {goalHabits.map((h) => (
            <GoalProgressRow key={h.id} habit={h} checkins={checkins} />
          ))}
        </div>
      )}

      <div className="card card-pad stack gap-16">
        <div className="row-between">
          <span className="section-title">Level {level} · Consistency Builder</span>
          <span className="badge badge-xp">⚡ {xp.toLocaleString()} XP</span>
        </div>
        <div className="quant-progress-track" style={{ height: 8 }}>
          <div className="quant-progress-fill" style={{ width: `${Math.round((levelProgress || 0) * 100)}%` }} />
        </div>
        <span className="page-subtitle" style={{ margin: 0 }}>{Math.max(0, xpCeil - xp)} XP to level {level + 1}</span>

        <div className="chip-grid" style={{ marginTop: 4 }}>
          {ACHIEVEMENT_DEFS.map((a) => {
            const isUnlocked = unlocked.has(a.key);
            return (
              <div
                key={a.key}
                className="stack gap-4"
                style={{
                  alignItems: "center",
                  width: 92,
                  padding: "14px 8px",
                  borderRadius: "var(--r-lg)",
                  border: "1px solid " + (isUnlocked ? "var(--accent-soft-border)" : "var(--border)"),
                  background: isUnlocked ? "var(--accent-soft)" : "var(--surface-sunken)",
                  opacity: isUnlocked ? 1 : 0.55,
                }}
              >
                <span style={{ fontSize: "1.5rem", filter: isUnlocked ? "none" : "grayscale(1)" }}>{a.icon}</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, textAlign: "center", lineHeight: 1.25 }}>{a.label}</span>
              </div>
            );
          })}
        </div>
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
        <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>{habit.name}</span>
        <span className="page-subtitle" style={{ margin: 0 }}>{current}× → {habit.frequencyTarget}× / week</span>
      </div>
    );
  }
  const recent = checkins.filter((c) => c.habitId === habit.id && c.value != null).slice(-7);
  const avg = recent.length ? recent.reduce((a, b) => a + b.value, 0) / recent.length : 0;
  return (
    <div className="row-between">
      <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>{habit.name}</span>
      <span className="page-subtitle" style={{ margin: 0 }}>{Math.round(avg)} → {habit.targetValue} {habit.unit}</span>
    </div>
  );
}
