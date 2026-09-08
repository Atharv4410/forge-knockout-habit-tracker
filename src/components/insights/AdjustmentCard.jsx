export default function AdjustmentCard({ adjustment, habit, onAccept, onDismiss }) {
  if (!habit) return null;
  return (
    <div className="card card-pad stack gap-10">
      <div className="row-between wrap gap-8">
        <span style={{ fontWeight: 650 }}>{habit.name}</span>
        <span className="badge badge-accent">{adjustment.summary}</span>
      </div>
      <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{adjustment.reasonText}</p>
      <div className="row gap-8">
        <button type="button" className="btn btn-accent btn-sm" onClick={onAccept}>Accept</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onDismiss}>Keep current goal</button>
      </div>
    </div>
  );
}
