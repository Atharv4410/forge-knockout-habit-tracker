import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import Heatmap from "../components/ui/Heatmap.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import { computeStreaks, trailingCompletionRate } from "../lib/stats.js";
import { describeFrequency, describeTarget, missReasonLabel } from "../lib/format.js";
import { formatDateHuman } from "../lib/dates.js";
import { habitIcon } from "../lib/habitIcons.js";

export default function HabitDetail() {
  const { habitId } = useParams();
  const navigate = useNavigate();
  const { habits, checkins } = useApp();
  const [selectedDay, setSelectedDay] = useState(null);

  const habit = habits.find((h) => h.id === habitId);
  if (!habit) {
    return (
      <div className="page">
        <p className="page-subtitle">Habit not found.</p>
        <button type="button" className="btn btn-secondary" onClick={() => navigate("/app/habits")}>Back to habits</button>
      </div>
    );
  }

  const streaks = computeStreaks(habit, checkins);
  const rate = trailingCompletionRate(habit, checkins, 30);
  const others = habits.filter((h) => h.id !== habit.id);

  return (
    <div className="page page-narrow animate-in">
      <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => navigate("/app/habits")}>← Back to habits</button>

      <div className="row-between wrap gap-16">
        <div className="row gap-14">
          <div className="habit-icon" style={{ width: 52, height: 52, fontSize: "1.5rem" }} aria-hidden="true">{habitIcon(habit)}</div>
          <div className="stack gap-4">
            <h1 className="page-title">{habit.name}</h1>
            <p className="page-subtitle">{describeFrequency(habit)} · {describeTarget(habit)}</p>
          </div>
        </div>
        {others.length > 0 && (
          <select className="select" style={{ width: 220 }} value={habit.id} onChange={(e) => navigate(`/app/habits/${e.target.value}`)}>
            <option value={habit.id}>{habit.name}</option>
            {others.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="stat-grid">
        <StatCard label="Current streak" value={`🔥 ${streaks.current}`} />
        <StatCard label="Best streak" value={`🏆 ${streaks.best}`} />
        <StatCard label="30-day consistency" value={rate != null ? `${Math.round(rate * 100)}%` : "—"} />
      </div>

      <div className="card card-pad stack gap-14">
        <span className="section-title">History</span>
        <Heatmap habit={habit} checkins={checkins} weeksBack={20} onSelectDay={setSelectedDay} />
      </div>

      {selectedDay && (
        <div className="card card-pad stack gap-8">
          <div className="row-between">
            <span className="section-title" style={{ fontSize: "0.95rem" }}>{formatDateHuman(selectedDay.date)}</span>
            <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setSelectedDay(null)} aria-label="Close">×</button>
          </div>
          {selectedDay.checkin ? (
            <div className="stack gap-4" style={{ fontSize: "0.9rem" }}>
              <span>{selectedDay.completed ? "✅ Completed" : "❌ Not completed"}</span>
              {habit.quantitative && selectedDay.checkin.value != null && <span>Logged: {selectedDay.checkin.value} {habit.unit}</span>}
              {selectedDay.checkin.missReason && <span>Reason: {missReasonLabel(selectedDay.checkin.missReason)}</span>}
            </div>
          ) : (
            <span className="page-subtitle" style={{ margin: 0 }}>{selectedDay.required ? "No check-in recorded." : "Not scheduled this day."}</span>
          )}
        </div>
      )}
    </div>
  );
}
