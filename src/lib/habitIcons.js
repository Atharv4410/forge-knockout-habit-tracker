// Purely presentational: derives a display icon from a habit's name/category.
// Never stored — computed at render time, so it never touches the data model.
const KEYWORD_ICONS = [
  [/steps|walk/i, "🚶"],
  [/workout|gym|strength|train|lift/i, "🏋️"],
  [/run|jog/i, "🏃"],
  [/stretch|mobility|yoga/i, "🧘"],
  [/water|hydrat/i, "💧"],
  [/sleep|wind[- ]down|wake/i, "😴"],
  [/read/i, "📚"],
  [/study|focus|deep work|review/i, "🧠"],
  [/screen|phone/i, "📵"],
  [/meal|eat|protein|veg|cook|diet|nutrition/i, "🥗"],
  [/journal|reflect|gratitude/i, "📝"],
  [/breath|meditat/i, "🌬️"],
];

const CATEGORY_ICONS = {
  activity: "🏃",
  nutrition: "🥗",
  sleep: "😴",
  focus: "🧠",
  routine: "🌅",
  recovery: "🧘",
  custom: "✨",
};

export function habitIcon(habit) {
  for (const [pattern, icon] of KEYWORD_ICONS) {
    if (pattern.test(habit.name)) return icon;
  }
  return CATEGORY_ICONS[habit.category] || "✨";
}
