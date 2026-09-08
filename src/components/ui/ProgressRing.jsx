export default function ProgressRing({
  value,
  size = 88,
  strokeWidth = 8,
  label,
  sublabel,
  trackColor = "var(--border)",
  fillColor = "var(--accent)",
  labelColor = "var(--text)",
  sublabelColor = "var(--text-muted)",
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value || 0));
  const offset = circumference * (1 - clamped);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} className="progress-ring" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.24, fontWeight: 800, letterSpacing: "-0.02em", color: labelColor }}>{label}</span>
        {sublabel && <span style={{ fontSize: size * 0.11, color: sublabelColor, fontWeight: 600 }}>{sublabel}</span>}
      </div>
    </div>
  );
}
