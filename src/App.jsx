import { useEffect, useState } from "react";
import AddHabitForm from "./components/AddHabitForm.jsx";
import HabitList from "./components/HabitList.jsx";
import { loadHabits, saveHabits } from "./lib/storage.js";
import { todayISO } from "./lib/dates.js";

export default function App() {
  const [habits, setHabits] = useState(() => loadHabits());

  useEffect(() => {
    saveHabits(habits);
  }, [habits]);

  function handleAddHabit(name) {
    const newHabit = {
      id: crypto.randomUUID(),
      name,
      createdAt: todayISO(),
      checkIns: [],
    };
    setHabits((prev) => [...prev, newHabit]);
  }

  function handleToggleToday(habitId) {
    const today = todayISO();
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
        const isDone = habit.checkIns.includes(today);
        return {
          ...habit,
          checkIns: isDone
            ? habit.checkIns.filter((d) => d !== today)
            : [...habit.checkIns, today],
        };
      }),
    );
  }

  function handleDelete(habitId) {
    setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
  }

  return (
    <main className="app">
      <h1>Today</h1>
      <AddHabitForm onAddHabit={handleAddHabit} />
      <HabitList
        habits={habits}
        onToggleToday={handleToggleToday}
        onDelete={handleDelete}
      />
    </main>
  );
}
