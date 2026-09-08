import { MISS_REASONS } from "../../lib/format.js";

export default function MissReasonPicker({ onSelect, onCancel }) {
  return (
    <div className="stack gap-8" style={{ marginTop: 8, padding: "12px", background: "var(--surface-sunken)", borderRadius: "var(--radius-md)" }}>
      <div className="row-between">
        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>What got in the way?</span>
        <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={onCancel} aria-label="Cancel">×</button>
      </div>
      <div className="chip-grid">
        {MISS_REASONS.map((r) => (
          <button key={r.key} type="button" className="chip" onClick={() => onSelect(r.key)}>
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
