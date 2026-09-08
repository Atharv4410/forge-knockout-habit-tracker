// Natural-language quick logging. Deliberately conservative: it only proposes
// matches it's reasonably confident about, and the caller must always confirm
// before anything is written to check-ins.

const WORKOUT_WORDS = ["gym", "workout", "trained", "training", "lifted", "exercise"];

export function parseNaturalLogEntry(text, habits) {
  const t = text.toLowerCase();
  const active = habits.filter((h) => h.active);
  const matches = [];
  const claimedHabitIds = new Set();

  function claim(habit, value, confidence) {
    if (claimedHabitIds.has(habit.id)) return;
    claimedHabitIds.add(habit.id);
    matches.push({
      habitId: habit.id,
      habitName: habit.name,
      value,
      completed: true,
      confidence,
    });
  }

  // quantitative: liters of water
  const waterMatch = t.match(/(\d+(?:\.\d+)?)\s?(l|liter|litre)/);
  if (waterMatch) {
    const habit = active.find((h) => h.unit === "L");
    if (habit) claim(habit, Number(waterMatch[1]), "high");
  }

  // quantitative: steps
  const stepsMatch = t.match(/(\d{3,6})\s?steps/);
  if (stepsMatch) {
    const habit = active.find((h) => h.unit === "steps");
    if (habit) claim(habit, Number(stepsMatch[1]), "high");
  }

  // quantitative: minutes, tied to a reading/study/focus habit
  const minMatch = t.match(/(\d+)\s?(min|minute)/);
  if (minMatch) {
    const habit = active.find(
      (h) => h.unit === "min" && (t.includes("read") || t.includes("study") || t.includes("focus") || t.includes(h.name.toLowerCase().split(" ")[0])),
    );
    if (habit) claim(habit, Number(minMatch[1]), "high");
  }

  // quantitative: hours, tied to sleep
  const hrsMatch = t.match(/(\d+(?:\.\d+)?)\s?(hr|hour)/);
  if (hrsMatch) {
    const habit = active.find((h) => h.unit === "hrs");
    if (habit) claim(habit, Number(hrsMatch[1]), "high");
  }

  // binary: workout / gym
  if (WORKOUT_WORDS.some((w) => t.includes(w))) {
    const habit = active.find((h) => !h.quantitative && /workout|gym|training/.test(h.name.toLowerCase()));
    if (habit) claim(habit, null, "medium");
  }

  // binary: generic name-keyword match for anything not already claimed
  for (const habit of active) {
    if (claimedHabitIds.has(habit.id) || habit.quantitative) continue;
    const keyword = habit.name.toLowerCase().split(" ").find((w) => w.length > 3);
    if (keyword && t.includes(keyword)) claim(habit, null, "medium");
  }

  return matches;
}
