import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import Modal from "../components/ui/Modal.jsx";
import HabitFields from "../components/habit/HabitFields.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import { describeFrequency, describeTarget } from "../lib/format.js";
import { computeStreaks, trailingCompletionRate } from "../lib/stats.js";
import { habitIcon } from "../lib/habitIcons.js";

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
    <div className="page animate-in">
      <div className="row-between wrap gap-16">
        <div className="stack gap-4">
          <h1 className="page-title">Your habits</h1>
          <p className="page-subtitle">{active.length} active</p>
        </div>
        <button type="button" className="btn btn-accent" onClick={openAdd}>+ New habit</button>
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon="🌱"
          title="Nothing here yet."
          body="Tell us what you're trying to improve and we'll build your starting system, or add one habit by hand."
          action={<button type="button" className="btn btn-accent" onClick={() => navigate("/onboarding")}>Build my plan →</button>}
        />
      ) : (
        <div className="stack gap-14">
          <SectionHeader title="Active" />
          <div className="stack gap-12 stagger">
            {active.map((h) => {
              const streaks = computeStreaks(h, checkins);
              const rate = trailingCompletionRate(h, checkins, 30);
              return (
                <div key={h.id} className="habit-card">
                  <div className="habit-icon" aria-hidden="true">{habitIcon(h)}</div>
                  <button type="button" className="habit-card-body" style={{ background: "none", border: "none", textAlign: "left", padding: 0, cursor: "pointer" }} onClick={() => navigate(`/app/habits/${h.id}`)}>
                    <span className="habit-card-name">{h.name}</span>
                    <span className="habit-card-meta">{describeFrequency(h)} · {describeTarget(h)}</span>
                    <span className="row gap-10" style={{ marginTop: 2 }}>
                      <span className="streak-pill"><span className="streak-flame" aria-hidden="true">🔥</span> {streaks.current}</span>
                      {rate != null && <span className="micro" style={{ fontWeight: 700 }}>{Math.round(rate * 100)}% complete</span>}
                    </span>
                  </button>
                  <div className="stack gap-6">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(h)}>Edit</button>
                    <button type="button" className="btn btn-danger-ghost btn-sm" onClick={() => setConfirmArchiveId(h.id)}>Archive</button>
                  </div>
                </div>
              );
            })}
          </div>
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
                    <span style={{ fontWeight: 700 }}>{h.name}</span>
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
            <h2 id="habit-modal-title" className="section-title">{modal.mode === "add" ? "Start a new habit" : "Edit habit"}</h2>
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
