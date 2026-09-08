import HabitRow from "./HabitRow.jsx";

export default function HabitList({ habits, onToggleToday, onDelete }) {
  if (habits.length === 0) {
    return <p className="empty-state">Add a habit to get started</p>;
  }

  return (
    <ul className="habit-list">
      {habits.map((habit) => (
        <HabitRow
          key={habit.id}
          habit={habit}
          onToggleToday={onToggleToday}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
