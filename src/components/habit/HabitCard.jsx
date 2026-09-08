import { useState } from "react";
import { describeFrequency, describeTarget } from "../../lib/format.js";
import MissReasonPicker from "./MissReasonPicker.jsx";

export default function HabitCard({ habit, todayCheckin, streak, onComplete, onUndo, onMiss, onAddAmount }) {
  const [showMiss, setShowMiss] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const done = !!todayCheckin?.completed && (!habit.quantitative || (todayCheckin.value ?? 0) >= habit.targetValue);
  const currentValue = todayCheckin?.value ?? 0;
  const missed = todayCheckin && todayCheckin.completed === false && todayCheckin.missReason;

  function handleAdd() {
    const n = Number(amountInput);
    if (!amountInput || Number.isNaN(n) || n <= 0) return;
    onAddAmount(currentValue + n);
    setAmountInput("");
  }

  return (
    <div className={"habit-card" + (done ? " done" : "")}>
      {habit.quantitative ? (
        <div className="habit-check-btn done-static" style={{ borderColor: done ? "var(--success)" : undefined, background: done ? "var(--success)" : "transparent", color: done ? "#fff" : "var(--text-muted)" }} aria-hidden="true">
          {done ? "✓" : Math.round(((currentValue / habit.targetValue) || 0) * 100) + "%"}
        </div>
      ) : (
        <button
          type="button"
          className={"habit-check-btn" + (done ? " done" : "")}
          aria-pressed={done}
          aria-label={done ? `Mark ${habit.name} not done` : `Mark ${habit.name} done`}
          onClick={() => (done ? onUndo() : onComplete())}
        >
          {done ? "✓" : ""}
        </button>
      )}

      <div className="habit-card-body">
        <span className={"habit-card-name" + (done ? " done-text" : "")}>{habit.name}</span>
        <span className="habit-card-meta">
          <span>{describeFrequency(habit)}</span>
          {habit.quantitative && <span>· {currentValue} / {describeTarget(habit)}</span>}
          {streak > 0 && (
            <span className="streak-pill">🔥 {streak} day{streak === 1 ? "" : "s"}</span>
          )}
        </span>

        {habit.quantitative && (
          <div className="quant-progress-track">
            <div className="quant-progress-fill" style={{ width: `${Math.min(100, Math.round((currentValue / habit.targetValue) * 100))}%` }} />
          </div>
        )}

        {missed && (
          <span className="badge badge-warning" style={{ alignSelf: "flex-start", marginTop: 4 }}>Missed · logged</span>
        )}

        {showMiss && (
          <MissReasonPicker
            onCancel={() => setShowMiss(false)}
            onSelect={(reason) => {
              onMiss(reason);
              setShowMiss(false);
            }}
          />
        )}
      </div>

      {habit.quantitative ? (
        <div className="row gap-6">
          <input
            type="number"
            min={0}
            step="any"
            className="input"
            style={{ width: 64, minHeight: 40, padding: "0 8px" }}
            placeholder="0"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            aria-label={`Log amount for ${habit.name}`}
          />
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleAdd}>+ Log</button>
        </div>
      ) : (
        !done && !showMiss && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowMiss(true)}>
            Skip
          </button>
        )
      )}
    </div>
  );
}
