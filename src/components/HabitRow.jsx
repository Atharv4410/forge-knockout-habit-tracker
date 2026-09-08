import { todayISO } from "../lib/dates.js";

export default function HabitRow({ habit, onToggleToday, onDelete }) {
  const done = habit.checkIns.includes(todayISO());

  return (
    <li className="habit-row">
      <button
        type="button"
        className="habit-check"
        aria-pressed={done}
        onClick={() => onToggleToday(habit.id)}
      >
        <span className="habit-check-icon" aria-hidden="true">
          {done ? "✓" : ""}
        </span>
        <span className={done ? "habit-name habit-name-done" : "habit-name"}>
          {habit.name}
        </span>
      </button>
      <button
        type="button"
        className="habit-delete"
        aria-label={`Delete ${habit.name}`}
        onClick={() => onDelete(habit.id)}
      >
        ×
      </button>
    </li>
  );
}
