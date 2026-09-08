import { TEMPLATES, inferGoalKeyFromText } from "./habitLibrary.js";
import { addMinutesToTime } from "../lib/dates.js";

const DIFFICULTY_ORDER = { easy: 0, medium: 1, hard: 2 };
function shiftDifficulty(difficulty, delta) {
  const order = ["easy", "medium", "hard"];
  const idx = Math.min(2, Math.max(0, order.indexOf(difficulty) + delta));
  return order[idx];
}

function resolveTime(timeOfDay, answers) {
  const wake = answers.wakeTime || "07:00";
  const sleep = answers.sleepTime || "23:00";
  if (timeOfDay === "morning") return addMinutesToTime(wake, 30);
  if (timeOfDay === "evening") return addMinutesToTime(sleep, -90);
  return "13:00";
}

function personalize(template, answers, { ambitionDelta = 0 } = {}) {
  const habit = { ...template };
  habit.preferredTime = resolveTime(template.timeOfDay, answers);
  delete habit.timeOfDay;

  const ambition = answers.ambition || "balanced";
  const timeAvailable = answers.timeAvailable || "medium";
  const activityLevel = answers.activityLevel || "light";

  let ambitionShift = ambitionDelta;
  if (ambition === "ambitious") ambitionShift += 1;
  if (ambition === "gentle") ambitionShift -= 1;

  if (habit.key === "workout" && answers.gymAccess === "no") {
    habit.name = "Home workout";
    habit.description = "A bodyweight or equipment-free training session at home.";
  }

  if (habit.frequencyType === "weekly_count") {
    let target = habit.frequencyTarget;
    if (activityLevel === "sedentary" && habit.category === "activity") target -= 1;
    target += ambitionShift;
    if (timeAvailable === "low") target -= 1;
    habit.frequencyTarget = Math.min(6, Math.max(1, target));
  }

  if (habit.quantitative && habit.targetValue != null) {
    let factor = 1;
    if (ambition === "ambitious") factor += 0.15;
    if (ambition === "gentle") factor -= 0.15;
    if (timeAvailable === "low" && habit.unit === "min") factor -= 0.35;
    if (timeAvailable === "low" && habit.unit === "steps") factor -= 0.2;
    if (activityLevel === "sedentary" && habit.unit === "steps") factor -= 0.25;
    if (activityLevel === "active" && habit.unit === "steps") factor += 0.2;

    let value = habit.targetValue * factor;
    if (habit.unit === "steps") value = Math.round(value / 500) * 500;
    else if (habit.unit === "min") value = Math.round(value / 5) * 5;
    else value = Math.round(value * 10) / 10;
    habit.targetValue = Math.max(habit.unit === "steps" ? 2000 : 1, value);
  }

  habit.difficulty = shiftDifficulty(habit.difficulty, -ambitionShift > 0 ? 0 : 0);
  if (ambition === "gentle") habit.difficulty = shiftDifficulty(habit.difficulty, -1);
  if (ambition === "ambitious") habit.difficulty = shiftDifficulty(habit.difficulty, 1);

  return habit;
}

// answers: { activityLevel, timeAvailable, wakeTime, sleepTime, gymAccess, ambition }
export function generateHabits({ primaryGoal, secondaryGoals = [], customGoalText, answers = {} }) {
  const primaryKey = primaryGoal === "custom" ? inferGoalKeyFromText(customGoalText || "") : primaryGoal;
  const primaryTemplates = TEMPLATES[primaryKey] || TEMPLATES.improve_consistency;

  const suggestions = primaryTemplates.map((t) => personalize(t, answers));

  for (const secondary of secondaryGoals.slice(0, 2)) {
    const secKey = secondary === "custom" ? inferGoalKeyFromText(customGoalText || "") : secondary;
    const templates = TEMPLATES[secKey] || [];
    const pick = templates.find((t) => !suggestions.some((s) => s.key === t.key));
    if (pick) suggestions.push(personalize(pick, answers, { ambitionDelta: -1 }));
  }

  const trimmed = suggestions
    .sort((a, b) => Number(b.essential) - Number(a.essential) || DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty])
    .slice(0, 7);

  return trimmed.map((s, i) => ({
    suggestionId: `sugg_${i}_${s.key}`,
    ...s,
  }));
}

export function planSummary({ primaryGoal, answers = {} }) {
  const label = (TEMPLATES[primaryGoal] ? primaryGoal : "your goal").replace(/_/g, " ");
  const ambition = answers.ambition || "balanced";
  const pace = ambition === "ambitious" ? "an ambitious pace" : ambition === "gentle" ? "an easy, low-pressure pace" : "a steady, realistic pace";
  return `Based on your goal, schedule, and current routine, here's where I'd start — at ${pace}. You can accept, edit, or remove anything before it becomes part of your plan.`;
}
