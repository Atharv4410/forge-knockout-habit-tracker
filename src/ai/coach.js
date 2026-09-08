// Coach chat responses. Pattern-matches the user's message and answers using
// real context (habits, stats, mode) rather than a generic canned reply.

import {
  overallConsistency,
  trailingCompletionRate,
  findStrugglingHabits,
  computeStreaks,
} from "../lib/stats.js";
import { formatTime } from "../lib/dates.js";

function findMentionedHabit(habits, text) {
  const t = text.toLowerCase();
  return habits.find((h) => h.active && t.includes(h.name.toLowerCase().split(" ")[0]));
}

export function coachResponse(message, context) {
  const { habits, checkins, mode, todaysHabits } = context;
  const text = message.toLowerCase();
  const active = habits.filter((h) => h.active);

  if (active.length === 0) {
    return "You don't have any active habits yet — head to your plan and build your first system, then I can actually help you tune it.";
  }

  if (/miss(ing|ed)?/.test(text)) {
    const mentioned = findMentionedHabit(habits, text);
    const struggling = findStrugglingHabits(habits, checkins);
    const target = mentioned
      ? struggling.find((s) => s.habit.id === mentioned.id)
      : struggling[0];
    if (target) {
      const h = target.habit;
      const detail =
        target.kind === "weekly_count"
          ? `you've hit ${target.counts.join("/")} out of ${target.target} the last few weeks`
          : `you've completed it about ${Math.round(target.rate * 100)}% of the time recently`;
      return `I see it too — "${h.name}" has been tough, ${detail}. Want me to suggest a lighter version of it? Open the Insights tab and I'll have a concrete adjustment ready.`;
    }
    return "Good news — nothing you're tracking is in real trouble right now. If one specific habit feels hard, tell me its name and I'll dig into the numbers.";
  }

  if (/easier/.test(text)) {
    const struggling = findStrugglingHabits(habits, checkins);
    if (struggling.length > 0) {
      const h = struggling[0].habit;
      return `The habit fighting you most right now is "${h.name}". I'd suggest lowering its target for a couple of weeks to rebuild momentum — check Insights, there's a specific adjustment waiting for your approval.`;
    }
    if (mode !== "busy") {
      return `Everything's tracking reasonably well. If this week is genuinely lighter on time, try switching to Busy Mode from your profile — it trims your plan down to essentials only.`;
    }
    return "You're already in Busy Mode, which is the lightest built-in setting. If it's still too much, tell me which specific habit to cut back.";
  }

  if (/why.*(struggl|hard|fail)/.test(text)) {
    const struggling = findStrugglingHabits(habits, checkins);
    if (struggling.length === 0) return "Nothing stands out as a clear struggle right now — your consistency has been solid across the board.";
    const h = struggling[0].habit;
    return `"${h.name}" is your weak point right now. It's scheduled for ${formatTime(h.preferredTime)} — if that time of day tends to be unpredictable for you, that's usually the root cause more than motivation.`;
  }

  if (/(focus|today|priorit)/.test(text)) {
    const remaining = (todaysHabits || []).filter((h) => !h.doneToday);
    if (remaining.length === 0) return "You've already completed everything on today's plan. Nothing left to focus on — that's a clean day.";
    const atRisk = remaining
      .map((h) => ({ h, streak: computeStreaks(h, checkins).current }))
      .sort((a, b) => b.streak - a.streak)[0];
    return `Prioritize "${atRisk.h.name}" — you've got a ${atRisk.streak}-day streak riding on it. After that: ${remaining
      .filter((r) => r.id !== atRisk.h.id)
      .map((r) => r.name)
      .join(", ") || "nothing else pending"}.`;
  }

  if (/(easier this week|lighten|tone it down)/.test(text)) {
    return "I can do that. Switch to Busy Mode from your profile — it keeps only your essential habits visible for the week without losing your history or streaks on the rest.";
  }

  const consistency = overallConsistency(habits, checkins, 14);
  if (consistency != null) {
    return `Overall you're at ${Math.round(consistency * 100)}% consistency over the last two weeks. Ask me things like "why am I struggling" or "what should I focus on today" and I'll look at your actual data before answering.`;
  }
  return "I'm still gathering data on your routine — check in on a few more days and I'll be able to spot real patterns.";
}
