// Adaptive habit engine. Reads real struggle signals from lib/stats.js and
// proposes a concrete, reversible change. Never applied automatically —
// the caller must show these to the user for accept/dismiss.

import { findStrugglingHabits, timeOfDayPattern } from "../lib/stats.js";
import { timeBucket, addMinutesToTime } from "../lib/dates.js";

export function suggestAdjustments(habits, checkins, existingAdjustments = []) {
  const struggling = findStrugglingHabits(habits, checkins);
  const pendingHabitIds = new Set(
    existingAdjustments.filter((a) => a.status === "pending").map((a) => a.habitId),
  );
  const proposals = [];

  for (const item of struggling) {
    if (pendingHabitIds.has(item.habit.id)) continue;
    const habit = item.habit;

    if (item.kind === "weekly_count") {
      const newTarget = Math.max(1, item.target - 1);
      if (newTarget === item.target) continue;
      proposals.push({
        habitId: habit.id,
        type: "reduce_frequency",
        proposal: { frequencyTarget: newTarget },
        reasonText: `You've struggled with your ${item.target}×/week goal for ${item.counts.length} weeks in a row (${item.counts.join("/")} out of ${item.target}). I'd recommend temporarily reducing it to ${newTarget}×/week.`,
        summary: `Reduce to ${newTarget}×/week`,
      });
    } else if (item.kind === "rate") {
      const bucket = timeBucket(habit.preferredTime);
      const timePattern = timeOfDayPattern(habits, checkins, 14);
      const thisBucketRate = timePattern[bucket];
      const otherBuckets = Object.entries(timePattern).filter(([k]) => k !== bucket && timePattern[k] != null);
      const betterBucket = otherBuckets.sort((a, b) => b[1] - a[1])[0];

      if (betterBucket && thisBucketRate != null && betterBucket[1] - thisBucketRate > 0.2 && bucket === "evening") {
        const newTime = addMinutesToTime(habit.preferredTime, -120);
        proposals.push({
          habitId: habit.id,
          type: "shift_time",
          proposal: { preferredTime: newTime },
          reasonText: `You've completed this only ${Math.round(item.rate * 100)}% of the time over the last two weeks. Your ${betterBucket[0]} habits are going much better — moving this earlier might help it stick.`,
          summary: `Move to earlier in the day`,
        });
      } else {
        proposals.push({
          habitId: habit.id,
          type: "reduce_target",
          proposal: habit.quantitative
            ? { targetValue: Math.round(habit.targetValue * 0.75) }
            : { frequencyType: "specific_days", frequencyTarget: [1, 3, 5] },
          reasonText: `You've completed "${habit.name}" only ${Math.round(item.rate * 100)}% of the time over the last two weeks. Starting smaller tends to rebuild momentum faster than pushing through.`,
          summary: habit.quantitative ? "Reduce daily target" : "Cut back to 3 set days a week",
        });
      }
    }
  }

  return proposals;
}
