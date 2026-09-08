import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { GOALS, generateHabits, planSummary } from "../ai/index.js";
import { describeSchedule } from "../lib/format.js";
import { habitIcon } from "../lib/habitIcons.js";
import HabitFields from "../components/habit/HabitFields.jsx";

const STEP_LABELS = ["Welcome", "Your goal", "Your routine", "Your plan"];

const LIFESTYLE_QUESTIONS = [
  { key: "activityLevel", label: "How active are you currently?", options: [{ v: "sedentary", l: "Not very active" }, { v: "light", l: "Somewhat active" }, { v: "active", l: "Very active" }] },
  { key: "timeAvailable", label: "How much time can you realistically dedicate each day?", options: [{ v: "low", l: "Under 15 min" }, { v: "medium", l: "15–30 min" }, { v: "high", l: "30+ min" }] },
  { key: "gymAccess", label: "Do you have access to a gym?", options: [{ v: "yes", l: "Yes" }, { v: "no", l: "No" }] },
  { key: "ambition", label: "How ambitious do you want your plan to be?", options: [{ v: "gentle", l: "Gentle" }, { v: "balanced", l: "Balanced" }, { v: "ambitious", l: "Ambitious" }] },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useApp();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState(null);
  const [secondaryGoals, setSecondaryGoals] = useState([]);
  const [customGoalText, setCustomGoalText] = useState("");
  const [answers, setAnswers] = useState({ activityLevel: "light", timeAvailable: "medium", wakeTime: "07:00", sleepTime: "23:00", gymAccess: "yes", ambition: "balanced" });
  const [suggestions, setSuggestions] = useState([]);
  const [removed, setRemoved] = useState(() => new Set());
  const [overrides, setOverrides] = useState({});
  const [editingId, setEditingId] = useState(null);

  const acceptedCount = suggestions.filter((s) => !removed.has(s.suggestionId)).length;

  function goToPlan() {
    const generated = generateHabits({ primaryGoal, secondaryGoals, customGoalText, answers });
    setSuggestions(generated);
    setRemoved(new Set());
    setOverrides({});
    setStep(3);
  }

  function finish() {
    const acceptedHabits = suggestions
      .filter((s) => !removed.has(s.suggestionId))
      .map((s) => ({ ...s, ...overrides[s.suggestionId] }));
    completeOnboarding({ name: name.trim(), primaryGoal, secondaryGoals, customGoalText, answers, acceptedHabits });
    navigate("/app");
  }

  const canContinue =
    step === 0 ? name.trim().length > 0 :
    step === 1 ? !!primaryGoal && (primaryGoal !== "custom" || customGoalText.trim().length > 0) :
    step === 2 ? true : acceptedCount > 0;

  return (
    <div className="onboarding-shell">
      <div className="onboarding-progress" style={{ maxWidth: 640, width: "100%" }}>
        <div className="onboarding-progress-fill" style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }} />
      </div>
      <div className="onboarding-card">
        <span className="eyebrow">Step {step + 1} of {STEP_LABELS.length} · {STEP_LABELS[step]}</span>

        {step === 0 && (
          <div className="stack gap-16">
            <h1 className="display-2">What should we call you?</h1>
            <p className="page-subtitle">Just a first name — everything else stays on this device.</p>
            <input
              className="input"
              autoFocus
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              onKeyDown={(e) => e.key === "Enter" && canContinue && setStep(1)}
            />
          </div>
        )}

        {step === 1 && (
          <div className="stack gap-20">
            <h1 className="display-2">What do you want to improve?</h1>
            <p className="page-subtitle">Pick one primary goal. You can add a secondary focus too, if you like.</p>
            <div className="goal-grid">
              {GOALS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  className={"goal-option" + (primaryGoal === g.key ? " selected" : "")}
                  onClick={() => setPrimaryGoal(g.key)}
                >
                  <span className="goal-option-icon">{g.icon}</span>
                  {g.label}
                </button>
              ))}
            </div>
            {primaryGoal === "custom" && (
              <input className="input" placeholder="Describe what you want to work on" value={customGoalText} onChange={(e) => setCustomGoalText(e.target.value)} />
            )}

            {primaryGoal && (
              <div className="stack gap-10">
                <span className="section-title" style={{ fontSize: "0.95rem" }}>Secondary focus (optional)</span>
                <div className="chip-grid">
                  {GOALS.filter((g) => g.key !== primaryGoal && g.key !== "custom").map((g) => {
                    const selected = secondaryGoals.includes(g.key);
                    return (
                      <button
                        key={g.key}
                        type="button"
                        className={"chip" + (selected ? " chip-selected" : "")}
                        onClick={() =>
                          setSecondaryGoals((prev) =>
                            selected ? prev.filter((k) => k !== g.key) : prev.length < 2 ? [...prev, g.key] : prev,
                          )
                        }
                      >
                        {g.icon} {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="stack gap-24">
            <h1 className="display-2">Tell us about your routine</h1>
            <p className="page-subtitle">Just enough to build a realistic starting plan.</p>
            {LIFESTYLE_QUESTIONS.map((q) => (
              <div className="stack gap-10" key={q.key}>
                <span className="field-label" style={{ fontSize: "0.92rem", color: "var(--text)" }}>{q.label}</span>
                <div className="chip-grid">
                  {q.options.map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      className={"chip" + (answers[q.key] === opt.v ? " chip-selected" : "")}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.key]: opt.v }))}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="row gap-16 wrap">
              <div className="stack gap-6" style={{ flex: 1, minWidth: 140 }}>
                <span className="field-label">What time do you wake up?</span>
                <input type="time" className="input" value={answers.wakeTime} onChange={(e) => setAnswers((prev) => ({ ...prev, wakeTime: e.target.value }))} />
              </div>
              <div className="stack gap-6" style={{ flex: 1, minWidth: 140 }}>
                <span className="field-label">What time do you usually sleep?</span>
                <input type="time" className="input" value={answers.sleepTime} onChange={(e) => setAnswers((prev) => ({ ...prev, sleepTime: e.target.value }))} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="stack gap-20">
            <h1 className="display-2">Here's your starting system.</h1>
            <p className="page-subtitle">{planSummary({ primaryGoal, answers })}</p>
            <div className="stack gap-14 stagger">
              {suggestions.map((s) => {
                const isRemoved = removed.has(s.suggestionId);
                const merged = { ...s, ...overrides[s.suggestionId] };
                const isEditing = editingId === s.suggestionId;
                return (
                  <div key={s.suggestionId} className={"suggestion-card" + (isRemoved ? " removed" : "")}>
                    <div className="suggestion-head">
                      <div className="row gap-12">
                        <div className="habit-icon" aria-hidden="true" style={{ width: 40, height: 40, fontSize: "1.15rem" }}>{habitIcon(merged)}</div>
                        <div className="stack gap-4">
                          <span className="suggestion-name">{merged.name}</span>
                          <span className="suggestion-meta">{describeSchedule(merged)} {merged.quantitative ? `· Target: ${merged.targetValue} ${merged.unit}` : ""}</span>
                        </div>
                      </div>
                      <span className={"badge" + (merged.difficulty === "hard" ? " badge-danger" : merged.difficulty === "medium" ? " badge-warning" : " badge-success")}>{merged.difficulty}</span>
                    </div>
                    {!isRemoved && <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>{merged.description}</p>}
                    {!isRemoved && (
                      <div className="suggestion-why"><strong>Why: </strong>{merged.why}</div>
                    )}

                    {isEditing && !isRemoved && (
                      <div style={{ marginTop: 6 }}>
                        <HabitFields draft={merged} onChange={(next) => setOverrides((prev) => ({ ...prev, [s.suggestionId]: next }))} compact />
                      </div>
                    )}

                    {!isRemoved && (
                      <div className="suggestion-actions">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingId(isEditing ? null : s.suggestionId)}>
                          {isEditing ? "Done editing" : "Edit"}
                        </button>
                        <button type="button" className="btn btn-danger-ghost btn-sm" onClick={() => setRemoved((prev) => new Set(prev).add(s.suggestionId))}>
                          Remove
                        </button>
                      </div>
                    )}
                    {isRemoved && (
                      <div className="suggestion-actions">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRemoved((prev) => { const next = new Set(prev); next.delete(s.suggestionId); return next; })}>
                          Undo remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="section-title" style={{ fontSize: "0.95rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Built around your current routine.
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-faint)", margin: 0 }}>
              These are personalized recommendations, not medical or professional advice — adjust anything that doesn't fit you.
            </p>
          </div>
        )}

        <div className="row-between" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-ghost" style={{ visibility: step === 0 ? "hidden" : "visible" }} onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
          {step < 2 && (
            <button type="button" className="btn btn-primary" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
              Continue
            </button>
          )}
          {step === 2 && (
            <button type="button" className="btn btn-primary" disabled={!canContinue} onClick={goToPlan}>
              Build my plan
            </button>
          )}
          {step === 3 && (
            <button type="button" className="btn btn-accent" disabled={!canContinue} onClick={finish}>
              Start my plan ({acceptedCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
