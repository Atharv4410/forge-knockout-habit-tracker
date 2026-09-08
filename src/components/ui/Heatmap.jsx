import { heatmapData } from "../../lib/stats.js";
import { isToday, formatDateHuman } from "../../lib/dates.js";

function levelFor(habit, day) {
  if (day.date === "__pad__") return "future";
  if (!day.required) return "0";
  if (day.completed) {
    if (habit.quantitative && habit.targetValue) {
      const ratio = (day.checkin?.value ?? 0) / habit.targetValue;
      if (ratio >= 1) return "3";
      if (ratio >= 0.5) return "2";
      return "1";
    }
    return "3";
  }
  if (isToday(day.date)) return "0";
  return "missed";
}

export default function Heatmap({ habit, checkins, weeksBack = 20, onSelectDay }) {
  const days = heatmapData(habit, checkins, weeksBack);
  // pad the front so the grid starts on a Monday-aligned column
  const firstWeekday = (new Date(days[0].date).getDay() + 6) % 7;
  const padded = Array.from({ length: firstWeekday }, () => ({ date: "__pad__" })).concat(days);

  return (
    <div>
      <div className="heatmap-grid" role="grid" aria-label={`${habit.name} history`}>
        {padded.map((day, i) => {
          const level = levelFor(habit, day);
          const title = day.date === "__pad__" ? "" : `${formatDateHuman(day.date)} — ${day.completed ? "done" : day.required ? "missed" : "not scheduled"}`;
          const levelClass = level === "future" ? "future" : level === "missed" ? "missed" : `level-${level}`;
          return (
            <button
              key={day.date === "__pad__" ? `pad-${i}` : day.date}
              type="button"
              className={`heatmap-cell ${levelClass}`}
              title={title}
              aria-label={title}
              disabled={day.date === "__pad__"}
              onClick={() => day.date !== "__pad__" && onSelectDay?.(day)}
            />
          );
        })}
      </div>
      <div className="row gap-8" style={{ marginTop: 10, fontSize: "0.75rem", color: "var(--text-faint)" }}>
        <span>Less</span>
        <span className="heatmap-cell level-0" style={{ cursor: "default" }} />
        <span className="heatmap-cell level-1" style={{ cursor: "default" }} />
        <span className="heatmap-cell level-2" style={{ cursor: "default" }} />
        <span className="heatmap-cell level-3" style={{ cursor: "default" }} />
        <span>More</span>
        <span className="row gap-4" style={{ marginLeft: 10 }}>
          <span className="heatmap-cell missed" style={{ cursor: "default" }} />
          Missed
        </span>
      </div>
    </div>
  );
}
