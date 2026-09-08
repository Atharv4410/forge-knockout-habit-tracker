// Date utilities. All "dateISO" values are local calendar days in "YYYY-MM-DD" form —
// deliberately not full timestamps, since habits are tracked per calendar day.

export function todayISO() {
  return toISO(new Date());
}

export function toISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISO(dateISO) {
  const [year, month, day] = dateISO.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateISO, delta) {
  const d = parseISO(dateISO);
  d.setDate(d.getDate() + delta);
  return toISO(d);
}

// ISO weekday: Monday = 1 ... Sunday = 7
export function isoWeekday(dateISO) {
  const day = parseISO(dateISO).getDay();
  return day === 0 ? 7 : day;
}

export function startOfWeek(dateISO) {
  const wd = isoWeekday(dateISO);
  return addDays(dateISO, -(wd - 1));
}

export function weekKey(dateISO) {
  return startOfWeek(dateISO);
}

export function isToday(dateISO) {
  return dateISO === todayISO();
}

export function isBefore(a, b) {
  return a < b;
}

export function isAfter(a, b) {
  return a > b;
}

export function rangeDays(startISO, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(addDays(startISO, i));
  return out;
}

export function daysBetween(startISO, endISO) {
  const ms = parseISO(endISO) - parseISO(startISO);
  return Math.round(ms / 86400000);
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export function weekdayLabel(isoWeekdayNum) {
  return WEEKDAY_LABELS[isoWeekdayNum - 1];
}

export function formatDateHuman(dateISO) {
  const d = parseISO(dateISO);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatMonthYear(dateISO) {
  const d = parseISO(dateISO);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function formatTime(timeHHMM) {
  if (!timeHHMM) return "";
  const [h, m] = timeHHMM.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function addMinutesToTime(timeHHMM, minutes) {
  const [h, m] = timeHHMM.split(":").map(Number);
  let total = h * 60 + m + minutes;
  total = ((total % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function timeBucket(timeHHMM) {
  if (!timeHHMM) return "anytime";
  const hour = Number(timeHHMM.split(":")[0]);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
