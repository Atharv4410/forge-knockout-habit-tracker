import { weekdayLabel } from "../../lib/dates.js";

const UNITS = ["L", "steps", "min", "hrs", "pages", "reps"];

export default function HabitFields({ draft, onChange, compact }) {
  function set(patch) {
    onChange({ ...draft, ...patch });
  }

  return (
    <div className="stack gap-16">
      <div className="stack gap-6">
        <label className="field-label" htmlFor="habit-name">Name</label>
        <input
          id="habit-name"
          className="input"
          value={draft.name}
          maxLength={60}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. Evening walk"
        />
      </div>

      {!compact && (
        <div className="stack gap-6">
          <label className="field-label" htmlFor="habit-desc">Description</label>
          <textarea
            id="habit-desc"
            className="textarea"
            value={draft.description || ""}
            maxLength={140}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="A short note on what this habit involves"
          />
        </div>
      )}

      <div className="stack gap-6">
        <span className="field-label">Frequency</span>
        <div className="chip-grid">
          {[
            { key: "daily", label: "Every day" },
            { key: "weekly_count", label: "X times per week" },
            { key: "specific_days", label: "Specific days" },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={"chip" + (draft.frequencyType === opt.key ? " chip-selected" : "")}
              onClick={() =>
                set({
                  frequencyType: opt.key,
                  frequencyTarget: opt.key === "weekly_count" ? draft.frequencyTarget && typeof draft.frequencyTarget === "number" ? draft.frequencyTarget : 3 : opt.key === "specific_days" ? (Array.isArray(draft.frequencyTarget) ? draft.frequencyTarget : [1, 3, 5]) : null,
                })
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        {draft.frequencyType === "weekly_count" && (
          <div className="row gap-8" style={{ marginTop: 4 }}>
            <input
              type="number"
              min={1}
              max={7}
              className="input"
              style={{ width: 80 }}
              value={draft.frequencyTarget || 1}
              onChange={(e) => set({ frequencyTarget: Math.min(7, Math.max(1, Number(e.target.value) || 1)) })}
            />
            <span className="page-subtitle" style={{ margin: 0 }}>times per week — success means hitting this count by week's end.</span>
          </div>
        )}

        {draft.frequencyType === "specific_days" && (
          <div className="chip-grid" style={{ marginTop: 4 }}>
            {[1, 2, 3, 4, 5, 6, 7].map((wd) => {
              const selected = (draft.frequencyTarget || []).includes(wd);
              return (
                <button
                  key={wd}
                  type="button"
                  className={"chip" + (selected ? " chip-selected" : "")}
                  onClick={() => {
                    const current = draft.frequencyTarget || [];
                    const next = selected ? current.filter((d) => d !== wd) : [...current, wd].sort();
                    set({ frequencyTarget: next.length ? next : [wd] });
                  }}
                >
                  {weekdayLabel(wd)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="stack gap-6">
        <label className="row gap-8" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
          <input type="checkbox" checked={!!draft.quantitative} onChange={(e) => set({ quantitative: e.target.checked, targetValue: e.target.checked ? draft.targetValue || 1 : null, unit: e.target.checked ? draft.unit || "min" : null })} />
          Track a specific amount (e.g. litres, steps, minutes)
        </label>
        {draft.quantitative && (
          <div className="row gap-8">
            <input
              type="number"
              min={0}
              step="any"
              className="input"
              style={{ width: 100 }}
              value={draft.targetValue ?? ""}
              onChange={(e) => set({ targetValue: Number(e.target.value) })}
            />
            <select className="select" style={{ width: 120 }} value={draft.unit || "min"} onChange={(e) => set({ unit: e.target.value })}>
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="row gap-16 wrap">
        <div className="stack gap-6" style={{ flex: 1, minWidth: 140 }}>
          <label className="field-label" htmlFor="habit-time">Suggested time</label>
          <input id="habit-time" type="time" className="input" value={draft.preferredTime || "08:00"} onChange={(e) => set({ preferredTime: e.target.value })} />
        </div>
        <div className="stack gap-6" style={{ flex: 1, minWidth: 140 }}>
          <label className="field-label" htmlFor="habit-difficulty">Difficulty</label>
          <select id="habit-difficulty" className="select" value={draft.difficulty || "medium"} onChange={(e) => set({ difficulty: e.target.value })}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <label className="row gap-8" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
        <input type="checkbox" checked={!!draft.essential} onChange={(e) => set({ essential: e.target.checked })} />
        Essential — keep this even in Busy, Exam, Travel or Recovery mode
      </label>
    </div>
  );
}
