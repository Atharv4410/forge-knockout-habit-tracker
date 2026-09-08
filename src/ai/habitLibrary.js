// Knowledge base the recommendation engine draws from. Each goal maps to a set
// of candidate habit templates; generateHabits() personalizes these against
// the user's onboarding answers rather than returning them verbatim.

export const GOALS = [
  { key: "lose_weight", label: "Lose weight", icon: "⚖️" },
  { key: "gain_muscle", label: "Gain muscle", icon: "💪" },
  { key: "sleep_better", label: "Sleep better", icon: "🌙" },
  { key: "more_active", label: "Become more active", icon: "🏃" },
  { key: "eat_healthier", label: "Eat healthier", icon: "🥗" },
  { key: "study_better", label: "Study better", icon: "📚" },
  { key: "reduce_screen_time", label: "Reduce screen time", icon: "📵" },
  { key: "morning_routine", label: "Build a morning routine", icon: "🌅" },
  { key: "improve_consistency", label: "Improve consistency", icon: "🎯" },
  { key: "custom", label: "Custom goal", icon: "✨" },
];

// frequencyTarget: daily -> null, weekly_count -> number, specific_days -> [1..7] (Mon=1)
export const TEMPLATES = {
  lose_weight: [
    { key: "steps", name: "Walk 7,000 steps", description: "Movement adds up more than any single workout.", category: "activity", frequencyType: "daily", quantitative: true, targetValue: 7000, unit: "steps", timeOfDay: "evening", difficulty: "medium", essential: true, why: "Daily movement is the single biggest lever for sustainable weight loss." },
    { key: "workout", name: "Workout", description: "A structured session — gym, home, or cardio.", category: "activity", frequencyType: "weekly_count", frequencyTarget: 3, quantitative: false, timeOfDay: "morning", difficulty: "hard", essential: true, why: "Structured training preserves muscle while you lose fat." },
    { key: "water", name: "Drink 2.5L water", description: "Track your water intake through the day.", category: "nutrition", frequencyType: "daily", quantitative: true, targetValue: 2.5, unit: "L", timeOfDay: "afternoon", difficulty: "easy", essential: false, why: "Hydration curbs snacking driven by mistaken thirst signals." },
    { key: "protein_meal", name: "Eat a protein-forward meal", description: "One meal a day built around a protein source.", category: "nutrition", frequencyType: "daily", quantitative: false, timeOfDay: "afternoon", difficulty: "medium", essential: false, why: "Protein keeps you fuller for longer on a calorie deficit." },
  ],
  gain_muscle: [
    { key: "workout", name: "Strength workout", description: "A structured resistance training session.", category: "activity", frequencyType: "weekly_count", frequencyTarget: 4, quantitative: false, timeOfDay: "morning", difficulty: "hard", essential: true, why: "Progressive overload is what actually builds muscle." },
    { key: "protein", name: "Hit your protein target", description: "Track whether you hit your daily protein goal.", category: "nutrition", frequencyType: "daily", quantitative: false, timeOfDay: "evening", difficulty: "medium", essential: true, why: "Muscle repair needs a protein surplus, every day, not just on training days." },
    { key: "sleep", name: "Get 7+ hours of sleep", description: "Recovery happens while you sleep.", category: "sleep", frequencyType: "daily", quantitative: true, targetValue: 7, unit: "hrs", timeOfDay: "evening", difficulty: "medium", essential: false, why: "Growth hormone release peaks during deep sleep." },
    { key: "stretch", name: "Mobility / stretch", description: "10 minutes of mobility work.", category: "recovery", frequencyType: "weekly_count", frequencyTarget: 3, quantitative: false, timeOfDay: "evening", difficulty: "easy", essential: false, why: "Mobility work keeps joints healthy under heavier loads." },
  ],
  sleep_better: [
    { key: "wind_down", name: "Start a wind-down routine", description: "Screens off, lights dim, something calm.", category: "sleep", frequencyType: "daily", quantitative: false, timeOfDay: "evening", difficulty: "medium", essential: true, why: "A consistent wind-down cues your body that sleep is coming." },
    { key: "consistent_wake", name: "Wake up at a consistent time", description: "Same wake time, weekday or weekend.", category: "sleep", frequencyType: "daily", quantitative: false, timeOfDay: "morning", difficulty: "medium", essential: true, why: "A fixed wake time anchors your whole circadian rhythm." },
    { key: "caffeine_cutoff", name: "No caffeine after 2pm", description: "Track whether you kept a caffeine cutoff.", category: "sleep", frequencyType: "daily", quantitative: false, timeOfDay: "afternoon", difficulty: "easy", essential: false, why: "Caffeine's half-life is long enough to fragment sleep hours later." },
  ],
  more_active: [
    { key: "steps", name: "Walk 7,000 steps", description: "Track total steps for the day.", category: "activity", frequencyType: "daily", quantitative: true, targetValue: 7000, unit: "steps", timeOfDay: "evening", difficulty: "medium", essential: true, why: "A realistic starting point based on typical current activity." },
    { key: "workout", name: "Workout", description: "Any structured exercise session.", category: "activity", frequencyType: "weekly_count", frequencyTarget: 3, quantitative: false, timeOfDay: "morning", difficulty: "hard", essential: true, why: "A few structured sessions a week build real fitness, not just movement." },
    { key: "lunch_walk", name: "10-minute walk after lunch", description: "A short walk to break up sitting.", category: "activity", frequencyType: "weekly_count", frequencyTarget: 5, quantitative: false, timeOfDay: "afternoon", difficulty: "easy", essential: false, why: "Post-meal walks are an easy way to add activity without needing motivation." },
    { key: "stretch", name: "Stretch", description: "5-10 minutes of stretching.", category: "recovery", frequencyType: "daily", quantitative: false, timeOfDay: "evening", difficulty: "easy", essential: false, why: "Keeps you moving on rest days without adding real fatigue." },
  ],
  eat_healthier: [
    { key: "veggies", name: "Eat a vegetable with two meals", description: "Track whether you added vegetables.", category: "nutrition", frequencyType: "daily", quantitative: false, timeOfDay: "afternoon", difficulty: "easy", essential: true, why: "A simple, low-friction way to shift the balance of what you eat." },
    { key: "cook", name: "Cook a meal at home", description: "Home-cooked meals over takeout.", category: "nutrition", frequencyType: "weekly_count", frequencyTarget: 4, quantitative: false, timeOfDay: "evening", difficulty: "medium", essential: false, why: "Cooking at home gives you control over what actually goes in your food." },
    { key: "water", name: "Drink 2L water", description: "Track your water intake.", category: "nutrition", frequencyType: "daily", quantitative: true, targetValue: 2, unit: "L", timeOfDay: "afternoon", difficulty: "easy", essential: false, why: "Staying hydrated reduces mindless snacking." },
  ],
  study_better: [
    { key: "focus_block", name: "Deep work block", description: "One uninterrupted study block, phone away.", category: "focus", frequencyType: "daily", quantitative: true, targetValue: 45, unit: "min", timeOfDay: "morning", difficulty: "hard", essential: true, why: "One real focus block beats hours of distracted studying." },
    { key: "review", name: "Review notes", description: "Quick review of what you covered.", category: "focus", frequencyType: "weekly_count", frequencyTarget: 5, quantitative: false, timeOfDay: "evening", difficulty: "medium", essential: true, why: "Spaced review is what actually moves things into long-term memory." },
    { key: "sleep", name: "Get 7+ hours of sleep", description: "Sleep is when memory consolidation happens.", category: "sleep", frequencyType: "daily", quantitative: true, targetValue: 7, unit: "hrs", timeOfDay: "evening", difficulty: "medium", essential: false, why: "Sleep-deprived studying has sharply diminishing returns." },
  ],
  reduce_screen_time: [
    { key: "screen_budget", name: "Stay under your screen budget", description: "Track whether you kept phone time in check.", category: "focus", frequencyType: "daily", quantitative: false, timeOfDay: "evening", difficulty: "medium", essential: true, why: "A visible daily target is more effective than a vague intention." },
    { key: "phone_free_morning", name: "Phone-free first 30 minutes", description: "No phone in the first half hour after waking.", category: "focus", frequencyType: "daily", quantitative: false, timeOfDay: "morning", difficulty: "medium", essential: true, why: "How you start the morning sets the tone for how you reach for your phone all day." },
    { key: "offline_hobby", name: "Do something offline", description: "20 minutes of a screen-free hobby.", category: "focus", frequencyType: "weekly_count", frequencyTarget: 4, quantitative: false, timeOfDay: "evening", difficulty: "easy", essential: false, why: "Replacing the habit works better than just trying to suppress it." },
  ],
  morning_routine: [
    { key: "wake_time", name: "Wake up at a consistent time", description: "Same wake time every day.", category: "routine", frequencyType: "daily", quantitative: false, timeOfDay: "morning", difficulty: "medium", essential: true, why: "Consistency is the foundation every other morning habit builds on." },
    { key: "morning_movement", name: "5 minutes of movement", description: "Stretch, walk, or light exercise right after waking.", category: "routine", frequencyType: "daily", quantitative: false, timeOfDay: "morning", difficulty: "easy", essential: true, why: "Movement first thing wakes up your body faster than caffeine alone." },
    { key: "no_phone_morning", name: "Phone-free first 30 minutes", description: "Delay checking your phone.", category: "routine", frequencyType: "daily", quantitative: false, timeOfDay: "morning", difficulty: "medium", essential: false, why: "Protects your morning from being hijacked by everyone else's priorities." },
  ],
  improve_consistency: [
    { key: "one_habit", name: "Show up for your one habit", description: "A single anchor habit, done daily, no matter how small.", category: "routine", frequencyType: "daily", quantitative: false, timeOfDay: "morning", difficulty: "easy", essential: true, why: "One tiny habit done consistently rebuilds trust in your own follow-through." },
    { key: "weekly_review", name: "Weekly check-in with yourself", description: "5 minutes reviewing what worked this week.", category: "routine", frequencyType: "weekly_count", frequencyTarget: 1, quantitative: false, timeOfDay: "evening", difficulty: "easy", essential: false, why: "Reflection is what turns a streak into a system." },
  ],
};

// naive keyword routing for free-typed custom goals
export function inferGoalKeyFromText(text) {
  const t = text.toLowerCase();
  if (/sleep/.test(t)) return "sleep_better";
  if (/muscle|strength|lift|gym/.test(t)) return "gain_muscle";
  if (/weight|fat|lean/.test(t)) return "lose_weight";
  if (/active|run|fit|walk|steps/.test(t)) return "more_active";
  if (/eat|diet|nutrition|food/.test(t)) return "eat_healthier";
  if (/study|school|exam|learn|focus/.test(t)) return "study_better";
  if (/screen|phone|social media|scroll/.test(t)) return "reduce_screen_time";
  if (/morning/.test(t)) return "morning_routine";
  return "improve_consistency";
}
