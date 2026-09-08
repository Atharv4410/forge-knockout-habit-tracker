// Pure, deterministic statistics over habits + check-ins.
// Nothing here talks to the AI layer — this module produces the structured
// facts that the AI layer is later handed. The AI never invents a number.

import {
  todayISO,
  addDays,
  isoWeekday,
  startOfWeek,
  weekKey,
  timeBucket,
  daysBetween,
} from "./dates.js";

export function isRequiredDay(habit, dateISO) {
  if (dateISO < habit.createdAt) return false;
  if (habit.frequencyType === "daily") return true;
  if (habit.frequencyType === "specific_days") {
    return habit.frequencyTarget.includes(isoWeekday(dateISO));
  }
  // weekly_count habits aren't "required" on any specific day
  return false;
}

export function checkinsForHabit(checkins, habitId) {
  return checkins.filter((c) => c.habitId === habitId);
}

export function isSuccess(habit, checkin) {
  if (!checkin) return false;
  if (habit.quantitative && habit.targetValue != null) {
    return (checkin.value ?? 0) >= habit.targetValue;
  }
  return !!checkin.completed;
}

function successDateSet(habit, checkins) {
  const set = new Set();
  for (const c of checkins) {
    if (c.habitId === habit.id && isSuccess(habit, c)) set.add(c.date);
  }
  return set;
}

function weeklyCounts(habit, checkins) {
  // week key (Monday ISO date) -> number of successful check-ins that week
  const counts = new Map();
  for (const c of checkinsForHabit(checkins, habit.id)) {
    if (!isSuccess(habit, c)) continue;
    const wk = weekKey(c.date);
    counts.set(wk, (counts.get(wk) ?? 0) + 1);
  }
  return counts;
}

export function computeStreaks(habit, checkins) {
  if (habit.frequencyType === "weekly_count") {
    return weeklyCountStreaks(habit, checkins);
  }
  return dailyStyleStreaks(habit, checkins);
}

function dailyStyleStreaks(habit, checkins) {
  const done = successDateSet(habit, checkins);
  const today = todayISO();

  let current = 0;
  let cursor = today;
  let firstIteration = true;
  let guard = 0;
  while (cursor >= habit.createdAt && guard < 3650) {
    guard++;
    if (isRequiredDay(habit, cursor)) {
      if (done.has(cursor)) {
        current++;
      } else if (firstIteration && cursor === today) {
        // today isn't over yet — don't break the streak on an unfinished day
      } else {
        break;
      }
    }
    firstIteration = false;
    cursor = addDays(cursor, -1);
  }

  // best streak: walk forward across the whole history
  let best = 0;
  let running = 0;
  let d = habit.createdAt;
  let guard2 = 0;
  while (d <= today && guard2 < 3650) {
    guard2++;
    if (isRequiredDay(habit, d)) {
      if (done.has(d)) {
        running++;
        best = Math.max(best, running);
      } else if (d !== today) {
        running = 0;
      }
    }
    d = addDays(d, 1);
  }

  return { current, best };
}

function weeklyCountStreaks(habit, checkins) {
  const counts = weeklyCounts(habit, checkins);
  const target = habit.frequencyTarget || 1;
  const thisWeek = weekKey(todayISO());

  let current = 0;
  let wk = thisWeek;
  let first = true;
  let guard = 0;
  while (wk >= startOfWeek(habit.createdAt) && guard < 520) {
    guard++;
    const met = (counts.get(wk) ?? 0) >= target;
    if (met) {
      current++;
    } else if (first && wk === thisWeek) {
      // current week still in progress — don't break yet
    } else {
      break;
    }
    first = false;
    wk = addDays(wk, -7);
  }

  let best = 0;
  let running = 0;
  let w = startOfWeek(habit.createdAt);
  let guard2 = 0;
  while (w <= thisWeek && guard2 < 520) {
    guard2++;
    const met = (counts.get(w) ?? 0) >= target;
    if (met) {
      running++;
      best = Math.max(best, running);
    } else if (w !== thisWeek) {
      running = 0;
    }
    w = addDays(w, 7);
  }

  return { current, best };
}

// Completion rate over a trailing window ending yesterday (today is excluded —
// the day isn't over, so it can't yet count as a miss).
export function trailingCompletionRate(habit, checkins, days = 14) {
  const end = addDays(todayISO(), -1);
  const start = addDays(end, -(days - 1));

  if (habit.frequencyType === "weekly_count") {
    const counts = weeklyCounts(habit, checkins);
    const weeks = new Set();
    for (let d = start; d <= end; d = addDays(d, 1)) weeks.add(weekKey(d));
    let total = 0;
    let earned = 0;
    for (const wk of weeks) {
      if (wk < startOfWeek(habit.createdAt)) continue;
      total += habit.frequencyTarget;
      earned += Math.min(counts.get(wk) ?? 0, habit.frequencyTarget);
    }
    return total === 0 ? null : earned / total;
  }

  const done = successDateSet(habit, checkins);
  let required = 0;
  let completed = 0;
  for (let d = start; d <= end; d = addDays(d, 1)) {
    if (!isRequiredDay(habit, d)) continue;
    required++;
    if (done.has(d)) completed++;
  }
  return required === 0 ? null : completed / required;
}

export function habitLastNWeeksCounts(habit, checkins, weeks = 3) {
  const counts = weeklyCounts(habit, checkins);
  const thisWeek = weekKey(todayISO());
  const out = [];
  for (let i = weeks; i >= 1; i--) {
    const wk = addDays(thisWeek, -7 * i);
    out.push(counts.get(wk) ?? 0);
  }
  return out;
}

export function overallConsistency(habits, checkins, days = 14) {
  const active = habits.filter((h) => h.active);
  const rates = active
    .map((h) => trailingCompletionRate(h, checkins, days))
    .filter((r) => r != null);
  if (rates.length === 0) return null;
  return rates.reduce((a, b) => a + b, 0) / rates.length;
}

export function weekdayPattern(habits, checkins, weeks = 3) {
  const days = weeks * 7;
  const end = addDays(todayISO(), -1);
  const start = addDays(end, -(days - 1));
  const buckets = Array.from({ length: 7 }, () => ({ required: 0, completed: 0 }));

  for (const habit of habits.filter((h) => h.active && h.frequencyType !== "weekly_count")) {
    const done = successDateSet(habit, checkins);
    for (let d = start; d <= end; d = addDays(d, 1)) {
      if (!isRequiredDay(habit, d)) continue;
      const idx = isoWeekday(d) - 1;
      buckets[idx].required++;
      if (done.has(d)) buckets[idx].completed++;
    }
  }

  return buckets.map((b, i) => ({
    weekday: i + 1,
    rate: b.required === 0 ? null : b.completed / b.required,
    required: b.required,
    completed: b.completed,
  }));
}

export function timeOfDayPattern(habits, checkins, days = 14) {
  const end = addDays(todayISO(), -1);
  const start = addDays(end, -(days - 1));
  const buckets = { morning: { required: 0, completed: 0 }, afternoon: { required: 0, completed: 0 }, evening: { required: 0, completed: 0 } };

  for (const habit of habits.filter((h) => h.active && h.frequencyType !== "weekly_count")) {
    const bucket = timeBucket(habit.preferredTime);
    if (!buckets[bucket]) continue;
    const done = successDateSet(habit, checkins);
    for (let d = start; d <= end; d = addDays(d, 1)) {
      if (!isRequiredDay(habit, d)) continue;
      buckets[bucket].required++;
      if (done.has(d)) buckets[bucket].completed++;
    }
  }

  const result = {};
  for (const [key, b] of Object.entries(buckets)) {
    result[key] = b.required === 0 ? null : b.completed / b.required;
  }
  return result;
}

export function findStrugglingHabits(habits, checkins) {
  const struggling = [];
  for (const habit of habits.filter((h) => h.active)) {
    if (habit.frequencyType === "weekly_count") {
      const weeksOfData = daysBetween(habit.createdAt, todayISO()) / 7;
      if (weeksOfData < 3) continue;
      const counts = habitLastNWeeksCounts(habit, checkins, 3);
      const target = habit.frequencyTarget;
      const avgRatio = counts.reduce((a, b) => a + b, 0) / (3 * target);
      if (avgRatio <= 0.66) {
        struggling.push({ habit, kind: "weekly_count", counts, target, avgRatio });
      }
    } else {
      const rate = trailingCompletionRate(habit, checkins, 14);
      if (rate != null && rate < 0.5) {
        struggling.push({ habit, kind: "rate", rate });
      }
    }
  }
  return struggling;
}

export function missReasonBreakdown(checkins, habitId) {
  const counts = {};
  for (const c of checkins) {
    if (habitId && c.habitId !== habitId) continue;
    if (c.completed === false && c.missReason) {
      counts[c.missReason] = (counts[c.missReason] ?? 0) + 1;
    }
  }
  return counts;
}

// weekOffset shifts the visible window back in time by that many weeks (0 = ending today).
export function heatmapData(habit, checkins, weeksBack = 20, weekOffset = 0) {
  const today = todayISO();
  const anchor = addDays(today, -7 * weekOffset);
  const start = addDays(startOfWeek(anchor), -7 * (weeksBack - 1));
  const end = weekOffset === 0 ? today : addDays(startOfWeek(anchor), 6);
  const days = [];
  const done = successDateSet(habit, checkins);
  const byDate = new Map(checkinsForHabit(checkins, habit.id).map((c) => [c.date, c]));
  for (let d = start; d <= end; d = addDays(d, 1)) {
    days.push({
      date: d,
      required: isRequiredDay(habit, d) || habit.frequencyType === "weekly_count",
      completed: done.has(d),
      checkin: byDate.get(d) ?? null,
    });
  }
  return days;
}

const DIFFICULTY_XP = { easy: 5, medium: 10, hard: 15 };

export function computeXP(habits, checkins) {
  const byId = new Map(habits.map((h) => [h.id, h]));
  let xp = 0;
  for (const c of checkins) {
    const habit = byId.get(c.habitId);
    if (!habit) continue;
    if (isSuccess(habit, c)) xp += DIFFICULTY_XP[habit.difficulty] ?? 8;
  }
  return xp;
}

export function computeLevel(xp) {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

export function xpForLevel(level) {
  return Math.pow(level - 1, 2) * 50;
}

export function computeAchievements(habits, checkins) {
  const achievements = [];
  if (checkins.some((c) => c.completed)) achievements.push({ key: "first_checkin", label: "First Step", icon: "🌱" });

  let maxCurrent = 0;
  let maxBest = 0;
  for (const h of habits) {
    const s = computeStreaks(h, checkins);
    maxCurrent = Math.max(maxCurrent, s.current);
    maxBest = Math.max(maxBest, s.best);
  }
  if (maxBest >= 7) achievements.push({ key: "week_streak", label: "7-Day Streak", icon: "🔥" });
  if (maxBest >= 30) achievements.push({ key: "month_streak", label: "30-Day Streak", icon: "🏆" });

  const week = overallConsistency(habits, checkins, 7);
  if (week != null && week >= 0.99) achievements.push({ key: "perfect_week", label: "Perfect Week", icon: "💯" });

  const month = overallConsistency(habits, checkins, 30);
  if (month != null && month >= 0.8) achievements.push({ key: "consistency_champion", label: "Consistency Champion", icon: "⭐" });

  return achievements;
}

export function weeklyChallenge(habits, checkins) {
  const today = todayISO();
  const start = startOfWeek(today);
  const active = habits.filter((h) => h.active && h.frequencyType !== "weekly_count");
  let daysFullyDone = 0;
  let daysElapsed = 0;
  for (let d = start; d <= today; d = addDays(d, 1)) {
    const requiredToday = active.filter((h) => isRequiredDay(h, d));
    if (requiredToday.length === 0) continue;
    daysElapsed++;
    const done = requiredToday.every((h) => {
      const c = checkins.find((ci) => ci.habitId === h.id && ci.date === d);
      return isSuccess(h, c);
    });
    if (done) daysFullyDone++;
  }
  return { completed: daysFullyDone, target: Math.max(daysElapsed, 1), daysElapsed };
}
