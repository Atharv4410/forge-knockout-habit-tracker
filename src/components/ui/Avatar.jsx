const PALETTE = [
  ["#4f46e5", "#7a3ff0"],
  ["#1f9bd6", "#17c9c1"],
  ["#ff6b35", "#ff3b6b"],
  ["#17a367", "#5fd48f"],
  ["#e0a100", "#ffcf4d"],
];

function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function Avatar({ name, size = 40, ring = false }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const [from, to] = colorFor(name || "?");
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        boxShadow: ring ? `0 0 0 2.5px var(--surface), 0 0 0 4px ${from}55` : undefined,
      }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
