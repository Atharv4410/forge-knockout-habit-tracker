import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import AdjustmentCard from "../components/insights/AdjustmentCard.jsx";
import { generateWeeklyInsights } from "../ai/index.js";
import { timeBucket, addMinutesToTime } from "../lib/dates.js";

export default function Insights() {
  const { habits, checkins, adjustments, updateHabit, resolveAdjustment } = useApp();
  const showToast = useToast();
  const [recommendationStatus, setRecommendationStatus] = useState(null);

  const active = habits.filter((h) => h.active);
  const insights = useMemo(() => generateWeeklyInsights(habits, checkins), [habits, checkins]);
  const pendingAdjustments = adjustments.filter((a) => a.status === "pending");

  if (active.length === 0 || !insights) {
    return (
      <div className="page">
        <EmptyState icon="🗓️" title="No insights yet" body="Once you've logged a week of check-ins, your patterns will show up here." />
      </div>
    );
  }

  function applyRecommendation() {
    if (insights.recommendation.type === "shift_evening_earlier") {
      const eveningHabits = active.filter((h) => timeBucket(h.preferredTime) === "evening");
      for (const h of eveningHabits) {
        updateHabit(h.id, { preferredTime: addMinutesToTime(h.preferredTime, -60) });
      }
      showToast(`Moved ${eveningHabits.length} evening habit${eveningHabits.length === 1 ? "" : "s"} an hour earlier.`);
    } else if (insights.recommendation.type === "weekend_lighter_plan") {
      const quantHabits = active.filter((h) => h.quantitative && h.frequencyType === "daily");
      for (const h of quantHabits) {
        updateHabit(h.id, { targetValue: Math.max(1, Math.round(h.targetValue * 0.85)) });
      }
      showToast("Lightened your daily targets a little.");
    }
    setRecommendationStatus("applied");
  }

  return (
    <div className="page">
      <div className="stack gap-4">
        <h1 className="page-title">Your week</h1>
        <p className="page-subtitle">{insights.consistency != null ? `${insights.consistency}% consistency` : "Still gathering data"}</p>
      </div>

      {insights.bullets.length > 0 && (
        <div className="card card-pad stack gap-10">
          {insights.bullets.map((b, i) => (
            <p key={i} style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.5 }}>{b}</p>
          ))}
        </div>
      )}

      {insights.recommendation && (
        <div className="card card-pad stack gap-12" style={{ borderColor: "var(--accent-soft-border)", background: "var(--accent-soft)" }}>
          <span className="section-title" style={{ color: "var(--accent-strong)" }}>Recommendation</span>
          <p style={{ margin: 0, fontSize: "0.95rem" }}>{insights.recommendation.text}</p>
          {recommendationStatus ? (
            <span className="badge badge-success" style={{ alignSelf: "flex-start" }}>Applied</span>
          ) : (
            <div className="row gap-8">
              <button type="button" className="btn btn-accent btn-sm" onClick={applyRecommendation}>Apply recommendation</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRecommendationStatus("kept")}>Keep current plan</button>
            </div>
          )}
        </div>
      )}

      <div className="stack gap-14">
        <span className="section-title">Adaptive suggestions</span>
        {pendingAdjustments.length === 0 ? (
          <p className="page-subtitle">Nothing to adjust right now — your plan matches how things are actually going.</p>
        ) : (
          pendingAdjustments.map((a) => (
            <AdjustmentCard
              key={a.id}
              adjustment={a}
              habit={habits.find((h) => h.id === a.habitId)}
              onAccept={() => {
                resolveAdjustment(a.id, true);
                showToast("Plan updated.");
              }}
              onDismiss={() => resolveAdjustment(a.id, false)}
            />
          ))
        )}
      </div>
    </div>
  );
}
