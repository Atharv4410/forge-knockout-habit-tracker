// Weekly insight generation. Every number quoted here comes from lib/stats.js —
// this module only composes those facts into coach-like language. It never
// invents a percentage.

import {
  overallConsistency,
  weekdayPattern,
  timeOfDayPattern,
  trailingCompletionRate,
} from "../lib/stats.js";
import { weekdayLabel } from "../lib/dates.js";

function pct(n) {
  return n == null ? null : Math.round(n * 100);
}

export function generateWeeklyInsights(habits, checkins) {
  const active = habits.filter((h) => h.active);
  if (active.length === 0) return null;

  const consistency = pct(overallConsistency(habits, checkins, 7));
  const weekdayRates = weekdayPattern(habits, checkins, 2);
  const timeRates = timeOfDayPattern(habits, checkins, 14);

  const withData = weekdayRates.filter((d) => d.rate != null);
  let strongestRun = null;
  let weakestDays = [];
  if (withData.length > 0) {
    const sorted = [...withData].sort((a, b) => b.rate - a.rate);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    weakestDays = withData.filter((d) => d.rate === worst.rate).map((d) => weekdayLabel(d.weekday));
    strongestRun = findStrongestConsecutiveRun(weekdayRates);
  }

  const bullets = [];
  if (strongestRun) {
    bullets.push(`You were strongest ${strongestRun}.`);
  }
  const weekendRate = averageRate(weekdayRates.filter((d) => d.weekday === 6 || d.weekday === 7));
  const weekdayRate = averageRate(weekdayRates.filter((d) => d.weekday <= 5));
  if (weekendRate != null && weekdayRate != null && weekendRate < weekdayRate - 0.1) {
    bullets.push(`Your completion rate dropped on weekends (${pct(weekendRate)}% vs ${pct(weekdayRate)}% on weekdays).`);
  }

  if (timeRates.morning != null) bullets.push(`Your morning habits had a ${pct(timeRates.morning)}% completion rate.`);
  if (timeRates.evening != null) bullets.push(`Your evening habits had a ${pct(timeRates.evening)}% completion rate.`);

  let recommendation = null;
  if (
    timeRates.evening != null &&
    timeRates.morning != null &&
    timeRates.evening < timeRates.morning - 0.15
  ) {
    recommendation = {
      type: "shift_evening_earlier",
      text: "Move your evening habits earlier — they're consistently getting crowded out later in the day.",
    };
  } else if (weekendRate != null && weekdayRate != null && weekendRate < weekdayRate - 0.15) {
    recommendation = {
      type: "weekend_lighter_plan",
      text: "Consider a lighter weekend version of your plan — your weekday routine is working well.",
    };
  }

  return {
    consistency,
    weekdayRates,
    timeRates,
    bullets,
    recommendation,
  };
}

function averageRate(entries) {
  const withData = entries.filter((e) => e.rate != null);
  if (withData.length === 0) return null;
  return withData.reduce((a, b) => a + b.rate, 0) / withData.length;
}

function findStrongestConsecutiveRun(weekdayRates) {
  const withData = weekdayRates.filter((d) => d.rate != null);
  if (withData.length < 2) return null;
  const threshold = 0.7;
  let bestRun = [];
  let current = [];
  for (const d of weekdayRates) {
    if (d.rate != null && d.rate >= threshold) {
      current.push(d);
      if (current.length > bestRun.length) bestRun = current;
    } else {
      current = [];
    }
  }
  if (bestRun.length < 2) return null;
  return `${weekdayLabel(bestRun[0].weekday)}–${weekdayLabel(bestRun[bestRun.length - 1].weekday)}`;
}

export function analyzeHabitDifficulty(habit, checkins) {
  const rate = trailingCompletionRate(habit, checkins, 21);
  if (rate == null) return { level: "unknown", rate: null };
  if (rate >= 0.8) return { level: "comfortable", rate };
  if (rate >= 0.5) return { level: "moderate", rate };
  return { level: "hard", rate };
}
