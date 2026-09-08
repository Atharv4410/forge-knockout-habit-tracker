import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import Modal from "../components/ui/Modal.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import { MODES } from "../lib/format.js";
import { computeStreaks, overallConsistency, isRequiredDay, isSuccess } from "../lib/stats.js";
import { todayISO } from "../lib/dates.js";
import {
  notificationsSupported,
  pushSupported,
  permissionStatus,
  requestNotificationPermission,
  getExistingPushSubscription,
  subscribeToPush,
  syncPushSubscription,
  sendTestPush,
} from "../lib/notifications.js";

export default function Profile() {
  const { user, habits, checkins, buddies, settings, setMode, updateSettings, addBuddy, updateBuddy, removeBuddy, resetAll } = useApp();
  const showToast = useToast();
  const [permission, setPermission] = useState(permissionStatus());
  const [buddyName, setBuddyName] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [hasPushSubscription, setHasPushSubscription] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    if (permission === "granted") {
      getExistingPushSubscription().then((sub) => setHasPushSubscription(!!sub));
    }
  }, [permission]);

  function todaysIncompleteHabitNames() {
    const today = todayISO();
    return habits
      .filter((h) => h.active && (isRequiredDay(h, today) || h.frequencyType === "weekly_count"))
      .filter((h) => !isSuccess(h, checkins.find((c) => c.habitId === h.id && c.date === today)))
      .map((h) => h.name);
  }

  async function handleEnableNotifications() {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result !== "granted") {
      showToast("Notifications weren't allowed.");
      return;
    }
    if (!pushSupported()) {
      updateSettings({ notificationsEnabled: true });
      showToast("Reminders turned on (this browser doesn't support background push).");
      return;
    }
    setPushBusy(true);
    try {
      const subscription = await subscribeToPush();
      await syncPushSubscription(subscription, {
        reminderTime: settings.reminderTime,
        notificationsEnabled: true,
        incompleteHabitNames: todaysIncompleteHabitNames(),
      });
      updateSettings({ notificationsEnabled: true });
      setHasPushSubscription(true);
      showToast("Push notifications enabled.");
    } catch (err) {
      showToast(err.message || "Couldn't set up push notifications.");
    } finally {
      setPushBusy(false);
    }
  }

  async function handleSendTestPush() {
    setPushBusy(true);
    try {
      const subscription = await getExistingPushSubscription();
      if (!subscription) throw new Error("Not subscribed yet — enable reminders first.");
      await sendTestPush(subscription);
      showToast("Test push sent — check for it, even with this tab closed.");
    } catch (err) {
      showToast(err.message || "Test push failed.");
    } finally {
      setPushBusy(false);
    }
  }

  function handleAddBuddy(e) {
    e.preventDefault();
    if (!buddyName.trim()) return;
    addBuddy({ name: buddyName.trim(), streak: 0, weeklyConsistency: 0 });
    setBuddyName("");
  }

  function handleExport() {
    const data = localStorage.getItem("aht:db:v1") || "{}";
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atlas-export-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Exported your data.");
  }

  const myConsistency = overallConsistency(habits, checkins, 7);
  const myBestCurrentStreak = Math.max(0, ...habits.filter((h) => h.active).map((h) => computeStreaks(h, checkins).current), 0);

  return (
    <div className="page page-narrow animate-in">
      <div className="card card-pad row gap-16">
        <Avatar name={user.name} size={56} />
        <div className="stack gap-2">
          <span className="section-title">{user.name}</span>
          <span className="page-subtitle" style={{ margin: 0, textTransform: "capitalize" }}>Goal: {(user.primaryGoal || "").replace(/_/g, " ")}</span>
        </div>
      </div>

      <div className="stack gap-14">
        <span className="eyebrow">Preferences</span>

        <div className="card card-pad stack gap-14">
          <SectionHeader title="Life mode" />
          <p className="page-subtitle" style={{ margin: 0 }}>What's your mode today? Your plan and streaks stay intact either way.</p>
          <div className="stack gap-8">
            {MODES.map((m) => (
              <button key={m.key} type="button" className={"mode-card" + (user.mode === m.key ? " selected" : "")} onClick={() => setMode(m.key)}>
                <span className="mode-card-icon">{m.icon}</span>
                <span className="stack gap-2">
                  <span style={{ fontWeight: 750 }}>{m.label}</span>
                  <span className="mode-card-desc">{m.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="card card-pad stack gap-14">
          <SectionHeader title="Stay on track" />
          {!notificationsSupported() ? (
            <p className="page-subtitle" style={{ margin: 0 }}>Notifications aren't supported in this browser.</p>
          ) : (
            <>
              <p className="page-subtitle" style={{ margin: 0 }}>Get a gentle nudge if you still have something left to do today.</p>
              {permission !== "granted" ? (
                <button type="button" className="btn btn-secondary" style={{ alignSelf: "flex-start" }} disabled={pushBusy} onClick={handleEnableNotifications}>
                  {pushBusy ? "Setting up…" : "Enable reminders"}
                </button>
              ) : (
                <>
                  <label className="row-between" style={{ fontWeight: 700, fontSize: "0.92rem" }}>
                    Habit reminders
                    <input type="checkbox" checked={settings.notificationsEnabled} onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })} />
                  </label>
                  <div className="row-between" style={{ alignItems: "center" }}>
                    <span className="field-label">Reminder time</span>
                    <input type="time" className="input" style={{ width: 140 }} value={settings.reminderTime} onChange={(e) => updateSettings({ reminderTime: e.target.value })} />
                  </div>
                  {hasPushSubscription ? (
                    <>
                      <span className="badge badge-success" style={{ alignSelf: "flex-start" }}>✓ Notifications active</span>
                      <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }} disabled={pushBusy} onClick={handleSendTestPush}>
                        {pushBusy ? "Sending…" : "Send test notification"}
                      </button>
                      <p style={{ fontSize: "0.76rem", color: "var(--text-faint)", margin: 0 }}>
                        This is a real browser push — try closing this tab first, it should still arrive.
                      </p>
                    </>
                  ) : (
                    <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }} disabled={pushBusy} onClick={handleEnableNotifications}>
                      {pushBusy ? "Setting up…" : "Set up push"}
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="stack gap-14">
        <span className="eyebrow">Social</span>
        <div className="card card-pad stack gap-14">
          <SectionHeader title="Accountability partners" />
          <p className="page-subtitle" style={{ margin: 0 }}>Invite someone to compare progress with. Streaks and weekly consistency are shared — nothing else.</p>

          <div className="stack gap-10">
            <div className="row-between" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
              <div className="row gap-10">
                <Avatar name={user.name} size={34} ring />
                <span style={{ fontWeight: 700 }}>You</span>
              </div>
              <span className="streak-pill"><span className="streak-flame" aria-hidden="true">🔥</span> {myBestCurrentStreak} · {myConsistency != null ? `${Math.round(myConsistency * 100)}%` : "—"}</span>
            </div>
            {buddies.map((b) => (
              <div key={b.id} className="row-between" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
                <div className="row gap-10">
                  <Avatar name={b.name} size={34} />
                  <span style={{ fontWeight: 700 }}>{b.name}</span>
                </div>
                <div className="row gap-10">
                  <span className="streak-pill"><span className="streak-flame" aria-hidden="true">🔥</span> {b.streak} · {b.weeklyConsistency}%</span>
                  <button type="button" className="btn btn-ghost btn-sm btn-icon" aria-label={`Remove ${b.name}`} onClick={() => removeBuddy(b.id)}>×</button>
                </div>
              </div>
            ))}
          </div>

          <form className="row gap-8" onSubmit={handleAddBuddy}>
            <input className="input" placeholder="Friend's name" value={buddyName} onChange={(e) => setBuddyName(e.target.value)} />
            <button type="submit" className="btn btn-secondary">Invite</button>
          </form>
          <p style={{ fontSize: "0.76rem", color: "var(--text-faint)", margin: 0 }}>
            Demo mode — this device doesn't sync with your friend's account yet, so their streak is entered manually for now.
          </p>
          {buddies.map((b) => (
            <div key={`edit-${b.id}`} className="row gap-8" style={{ fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-muted)" }}>{b.name}'s streak</span>
              <input
                type="number"
                min={0}
                className="input"
                style={{ width: 70, minHeight: 34 }}
                value={b.streak}
                onChange={(e) => updateBuddy(b.id, { streak: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="stack gap-14">
        <span className="eyebrow">Data</span>
        <div className="card card-pad stack gap-12">
          <SectionHeader title="Your data" />
          <p className="page-subtitle" style={{ margin: 0 }}>Everything lives on this device only. Export a copy, or start over.</p>
          <div className="row gap-10 wrap">
            <button type="button" className="btn btn-secondary" onClick={handleExport}>Export data</button>
            <button type="button" className="btn btn-danger-ghost" onClick={() => setConfirmReset(true)}>Reset all data</button>
          </div>
        </div>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} labelledBy="reset-title">
        <h2 id="reset-title" className="section-title">Reset everything?</h2>
        <p className="page-subtitle" style={{ margin: 0 }}>This permanently deletes your habits, check-in history, and settings on this device. This can't be undone.</p>
        <div className="row gap-8" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={resetAll}>Reset</button>
        </div>
      </Modal>
    </div>
  );
}
