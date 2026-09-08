import { useState } from "react";

const MAX_LENGTH = 80;

export default function AddHabitForm({ onAddHabit }) {
  const [name, setName] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAddHabit(trimmed);
    setName("");
  }

  return (
    <form className="add-habit-form" onSubmit={handleSubmit}>
      <label htmlFor="habit-name">Add a habit</label>
      <div className="add-habit-row">
        <input
          id="habit-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_LENGTH}
          placeholder="e.g. Drink a glass of water"
          autoComplete="off"
        />
        <button type="submit">Add</button>
      </div>
    </form>
  );
}
