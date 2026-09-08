import { habitIcon } from "../../lib/habitIcons.js";
import { describeFrequency } from "../../lib/format.js";

export default function AdjustmentCard({ adjustment, habit, onAccept, onDismiss }) {
  if (!habit) return null;
  const keepLabel = adjustment.type === "reduce_frequency" ? `Keep ${describeFrequency(habit)}` : "Keep current goal";

  return (
    <div className="card card-pad stack gap-14" style={{ border: "1px solid var(--accent-soft-border)" }}>
      <span className="badge badge-ai" style={{ alignSelf: "flex-start" }}>🤖 I noticed something.</span>
      <div className="row gap-12">
        <div className="habit-icon" aria-hidden="true">{habitIcon(habit)}</div>
        <div className="stack gap-2">
          <span style={{ fontWeight: 750 }}>{habit.name}</span>
          <span className="micro">{describeFrequency(habit)}</span>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: "0.93rem", color: "var(--text-muted)", lineHeight: 1.55 }}>{adjustment.reasonText}</p>
      <div className="row-between wrap gap-10" style={{ background: "var(--surface-sunken)", borderRadius: "var(--r-md)", padding: "12px 14px" }}>
        <span className="micro" style={{ fontWeight: 700, color: "var(--text)" }}>Recommended</span>
        <span className="badge badge-accent">{adjustment.summary}</span>
      </div>
      <div className="row gap-8">
        <button type="button" className="btn btn-accent btn-sm" onClick={onAccept}>Accept</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onDismiss}>{keepLabel}</button>
      </div>
    </div>
  );
}
