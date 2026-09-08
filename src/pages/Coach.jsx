import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { isRequiredDay, isSuccess } from "../lib/stats.js";
import { todayISO } from "../lib/dates.js";

const PROMPTS = [
  "I keep missing my workouts.",
  "Can I make this habit easier?",
  "Why am I struggling?",
  "What should I focus on today?",
];

export default function Coach() {
  const { habits, checkins, user, coachMessages, sendCoachMessage } = useApp();
  const [text, setText] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [coachMessages.length]);

  function buildContext() {
    const today = todayISO();
    const todaysHabits = habits
      .filter((h) => h.active && (isRequiredDay(h, today) || h.frequencyType === "weekly_count"))
      .map((h) => ({ ...h, doneToday: isSuccess(h, checkins.find((c) => c.habitId === h.id && c.date === today)) }));
    return { habits, checkins, mode: user?.mode, todaysHabits };
  }

  function handleSend(message) {
    const trimmed = (message ?? text).trim();
    if (!trimmed) return;
    sendCoachMessage(trimmed, buildContext());
    setText("");
  }

  return (
    <div className="page" style={{ height: "calc(100vh - 140px)", display: "flex", flexDirection: "column" }}>
      <div className="stack gap-4">
        <h1 className="page-title">Coach</h1>
        <p className="page-subtitle">Ask about your actual habits and progress — answers are grounded in your real data.</p>
      </div>

      <div className="card card-pad stack gap-12" style={{ flex: 1, overflowY: "auto", minHeight: 260 }}>
        {coachMessages.length === 0 ? (
          <div className="stack gap-10">
            <p className="page-subtitle" style={{ margin: 0 }}>Try asking:</p>
            <div className="chip-grid">
              {PROMPTS.map((p) => (
                <button key={p} type="button" className="chip" onClick={() => handleSend(p)}>{p}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="stack gap-10">
            {coachMessages.map((m) => (
              <div key={m.id} className={`chat-bubble ${m.role}`}>{m.text}</div>
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      <form
        className="row gap-8"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask your coach anything…" />
        <button type="submit" className="btn btn-accent">Send</button>
      </form>
    </div>
  );
}
