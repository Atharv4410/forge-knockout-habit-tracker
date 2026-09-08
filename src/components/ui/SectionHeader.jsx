export default function SectionHeader({ title, action }) {
  return (
    <div className="section-header">
      <span className="section-title">{title}</span>
      {action}
    </div>
  );
}
