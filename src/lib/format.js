import { weekdayLabel, formatTime } from "./dates.js";

export function describeFrequency(habit) {
  if (habit.frequencyType === "daily") return "Every day";
  if (habit.frequencyType === "weekly_count") return `${habit.frequencyTarget}× per week`;
  if (habit.frequencyType === "specific_days") {
    return (habit.frequencyTarget || []).map(weekdayLabel).join(" / ");
  }
  return "";
}

export function describeTarget(habit) {
  if (!habit.quantitative) return "Completed / not completed";
  return `${habit.targetValue} ${habit.unit}`;
}

export function describeSchedule(habit) {
  const freq = describeFrequency(habit);
  const time = habit.preferredTime ? ` · Suggested time: ${formatTime(habit.preferredTime)}` : "";
  return freq + time;
}

export const MISS_REASONS = [
  { key: "no_time", label: "Didn't have time" },
  { key: "forgot", label: "Forgot" },
  { key: "too_tired", label: "Too tired" },
  { key: "not_feeling_it", label: "Didn't feel like it" },
  { key: "schedule_changed", label: "Schedule changed" },
  { key: "too_difficult", label: "Too difficult" },
  { key: "other", label: "Other" },
];

export function missReasonLabel(key) {
  return MISS_REASONS.find((r) => r.key === key)?.label || key;
}

export const MODES = [
  { key: "normal", label: "Normal", icon: "🙂", description: "Your full plan, as designed." },
  { key: "busy", label: "Busy", icon: "⏱️", description: "Only essential habits, reduced targets." },
  { key: "exam", label: "Exam / high workload", icon: "📖", description: "Prioritize the essentials, ease off the rest." },
  { key: "travel", label: "Travel", icon: "✈️", description: "Travel-friendly, essentials only." },
  { key: "recovery", label: "Recovery", icon: "🩹", description: "Lower-intensity, essentials only." },
];
