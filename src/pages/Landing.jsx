import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { useEffect } from "react";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useApp();

  useEffect(() => {
    if (user?.onboarded) navigate("/app", { replace: true });
  }, [user, navigate]);

  return (
    <div className="landing-hero">
      <span className="badge badge-accent">AI-powered habit coach</span>
      <h1 className="landing-title">Tell us what you want to become.<br />We'll build the habits to get you there.</h1>
      <p className="landing-sub">
        Pick a goal. Atlas designs a starting plan, tracks whether you actually did it, and adapts the plan as it learns
        your routine — not a generic habit checklist.
      </p>
      <button type="button" className="btn btn-accent" style={{ minHeight: 52, padding: "0 32px", fontSize: "1.02rem" }} onClick={() => navigate("/onboarding")}>
        Build my plan →
      </button>
      <div className="row gap-24 wrap" style={{ justifyContent: "center", marginTop: 8, color: "var(--text-faint)", fontSize: "0.85rem" }}>
        <span>No account needed to try it</span>
        <span>·</span>
        <span>Your data stays on this device</span>
      </div>
    </div>
  );
}
