import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import Modal from "../components/ui/Modal.jsx";
import HabitFields from "../components/habit/HabitFields.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { describeFrequency, describeTarget } from "../lib/format.js";
import { computeStreaks } from "../lib/stats.js";

const BLANK_DRAFT = {
  name: "",
  description: "",
  category: "custom",
  why: "",
  frequencyType: "daily",
  frequencyTarget: null,
  quantitative: false,
  targetValue: null,
  unit: null,
  preferredTime: "08:00",
  difficulty: "medium",
  essential: false,
};

export default function Habits() {
  const { habits, checkins, addHabit, updateHabit, archiveHabit } = useApp();
  const navigate = useNavigate();
  const showToast = useToast();

  const [modal, setModal] = useState(null); // { mode: 'add'|'edit', draft, habitId }
  const [confirmArchiveId, setConfirmArchiveId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const active = habits.filter((h) => h.active);
  const archived = habits.filter((h) => !h.active);

  function openAdd() {
    setModal({ mode: "add", draft: { ...BLANK_DRAFT } });
  }
  function openEdit(habit) {
    setModal({ mode: "edit", draft: { ...habit }, habitId: habit.id });
  }
  function saveModal() {
    if (!modal.draft.name.trim()) {
      showToast("Give the habit a name first.");
      return;
    }
    if (modal.mode === "add") {
      addHabit(modal.draft);
      showToast("Habit added.");
    } else {
      updateHabit(modal.habitId, modal.draft);
      showToast("Habit updated.");
    }
    setModal(null);
  }

  return (
    <div className="page">
      <div className="row-between wrap gap-16">
        <div className="stack gap-4">
          <h1 className="page-title">Your habits</h1>
          <p className="page-subtitle">{active.length} active</p>
        </div>
        <button type="button" className="btn btn-accent" onClick={openAdd}>+ Add habit</button>
      </div>

      {active.length === 0 ? (
        <EmptyState icon="🌱" title="No active habits" body="Add one manually, or build a full plan from your goal." action={<button type="button" className="btn btn-accent" onClick={() => navigate("/onboarding")}>Build my plan</button>} />
      ) : (
        <div className="stack gap-12">
          {active.map((h) => {
            const streaks = computeStreaks(h, checkins);
            return (
              <div key={h.id} className="card card-pad row-between wrap gap-12">
                <button type="button" className="stack gap-4" style={{ background: "none", border: "none", textAlign: "left", flex: 1, minWidth: 200 }} onClick={() => navigate(`/app/habits/${h.id}`)}>
                  <span style={{ fontWeight: 650 }}>{h.name}</span>
                  <span className="page-subtitle" style={{ margin: 0 }}>{describeFrequency(h)} · {describeTarget(h)}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-faint)" }}>🔥 {streaks.current} current · 🏆 {streaks.best} best</span>
                </button>
                <div className="row gap-8">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(h)}>Edit</button>
                  <button type="button" className="btn btn-danger-ghost btn-sm" onClick={() => setConfirmArchiveId(h.id)}>Archive</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {archived.length > 0 && (
        <div className="stack gap-10">
          <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setShowArchived((s) => !s)}>
            {showArchived ? "Hide" : "Show"} archived ({archived.length})
          </button>
          {showArchived && (
            <div className="stack gap-8">
              {archived.map((h) => (
                <div key={h.id} className="card card-pad row-between" style={{ opacity: 0.6 }}>
                  <button type="button" style={{ background: "none", border: "none", textAlign: "left" }} onClick={() => navigate(`/app/habits/${h.id}`)}>
                    <span style={{ fontWeight: 600 }}>{h.name}</span>
                    <span className="page-subtitle" style={{ margin: 0, display: "block" }}>Archived {h.archivedAt}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} labelledBy="habit-modal-title">
        {modal && (
          <>
            <h2 id="habit-modal-title" className="section-title">{modal.mode === "add" ? "Add a habit" : "Edit habit"}</h2>
            <HabitFields draft={modal.draft} onChange={(next) => setModal((m) => ({ ...m, draft: next }))} />
            <div className="row gap-8" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="btn btn-accent" onClick={saveModal}>Save</button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!confirmArchiveId} onClose={() => setConfirmArchiveId(null)} labelledBy="archive-modal-title">
        <h2 id="archive-modal-title" className="section-title">Archive this habit?</h2>
        <p className="page-subtitle" style={{ margin: 0 }}>It'll be removed from your daily list, but its history and streaks stay intact.</p>
        <div className="row gap-8" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmArchiveId(null)}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              archiveHabit(confirmArchiveId);
              setConfirmArchiveId(null);
              showToast("Habit archived.");
            }}
          >
            Archive
          </button>
        </div>
      </Modal>
    </div>
  );
}
