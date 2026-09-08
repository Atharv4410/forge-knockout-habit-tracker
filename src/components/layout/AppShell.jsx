import { NavLink } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import Avatar from "../ui/Avatar.jsx";

const SIDEBAR_ITEMS = [
  { to: "/app", label: "Home", icon: "⌂", end: true },
  { to: "/app/habits", label: "Habits", icon: "✓" },
  { to: "/app/progress", label: "Progress", icon: "◎" },
  { to: "/app/insights", label: "Insights", icon: "◇" },
  { to: "/app/coach", label: "Coach", icon: "✦" },
  { to: "/app/profile", label: "Profile", icon: "▤" },
];

// Mobile keeps the five core destinations — Insights is reached from the Home
// "Coach says" card and the Progress page instead, so the bar stays uncluttered.
const BOTTOM_NAV_ITEMS = SIDEBAR_ITEMS.filter((item) => item.to !== "/app/insights");

export default function AppShell({ children }) {
  const { user } = useApp();
  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">A</span>
          Atlas
        </div>
        <nav className="sidebar-nav">
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
            >
              <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className="sidebar-footer">
            <Avatar name={user.name} size={32} />
            <div className="stack" style={{ minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-faint)", textTransform: "capitalize" }}>{user.mode} mode</span>
            </div>
          </div>
        )}
      </aside>

      <div className="main-area">{children}</div>

      <nav className="bottom-nav">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => "bottom-nav-link" + (isActive ? " active" : "")}
          >
            <span className="bottom-nav-icon" aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
