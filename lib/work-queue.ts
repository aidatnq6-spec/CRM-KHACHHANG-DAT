import {
  careOf,
  daysLeft,
  fmtDate,
  normalizeDate,
  todayTasks,
  todayVN,
} from "./domain";
import type { CareLog, Customer } from "./types";

export type AppointmentGroup = "overdue" | "today" | "upcoming" | "none";
export type WorkFilter =
  "all" | "overdue" | "today" | "upcoming" | "expired" | "urgent" | "waiting";
type Reason = ReturnType<typeof todayTasks>[number];
export interface WorkItem {
  customer: Customer;
  reasons: Reason[];
  appointment: AppointmentGroup;
  title: string;
  detail: string;
  priority: number;
  days: number;
}

export function appointmentGroup(
  customer: Customer,
  today = todayVN(),
): AppointmentGroup {
  const days = daysLeft(customer.followUpDate, today);
  return days === null
    ? "none"
    : days < 0
      ? "overdue"
      : days === 0
        ? "today"
        : "upcoming";
}

export function workQueue(rows: Customer[], today = todayVN()): WorkItem[] {
  const grouped = new Map<string, WorkItem>();
  for (const reason of todayTasks(rows, today)) {
    const appointment = appointmentGroup(reason.customer, today);
    // Respect a promised future contact date, even when the service is expiring.
    if (appointment === "upcoming") continue;
    const item = grouped.get(reason.customer.id);
    if (item) item.reasons.push(reason);
    else
      grouped.set(reason.customer.id, {
        customer: reason.customer,
        reasons: [reason],
        appointment,
        title: reason.title,
        detail: reason.detail,
        priority: appointment === "overdue" ? 0 : reason.priority,
        days: reason.days,
      });
  }
  for (const customer of rows) {
    const days = daysLeft(customer.followUpDate, today);
    if (
      customer.status === "inactive" ||
      ["renewed", "declined"].includes(careOf(customer)) ||
      days === null ||
      days < 1 ||
      days > 7
    )
      continue;
    grouped.set(customer.id, {
      customer,
      reasons: [],
      appointment: "upcoming",
      title: `Hẹn ${fmtDate(customer.followUpDate)}`,
      detail: customer.followUpNote || "Liên hệ theo lịch hẹn",
      priority: 5,
      days,
    });
  }
  return [...grouped.values()].sort(
    (a, b) =>
      a.priority - b.priority ||
      a.days - b.days ||
      a.customer.name.localeCompare(b.customer.name, "vi") ||
      a.customer.id.localeCompare(b.customer.id),
  );
}

export function matchesWorkFilter(item: WorkItem, filter: WorkFilter) {
  if (filter === "upcoming") return item.appointment === "upcoming";
  if (item.appointment === "upcoming") return false;
  if (filter === "all") return true;
  if (filter === "overdue" || filter === "today")
    return item.appointment === filter;
  return item.reasons.some((reason) => reason.type === filter);
}

export function appointmentUpdate(
  date: string,
  note: string,
  today = todayVN(),
) {
  const normalized = normalizeDate(date),
    text = note.trim();
  if (!normalized || (daysLeft(normalized, today) ?? 0) < 1)
    throw new Error("Chọn ngày hẹn từ ngày mai trở đi.");
  if (!text)
    throw new Error("Nhập nội dung cần trao đổi trong lần hẹn tiếp theo.");
  if (text.length > 2000)
    throw new Error("Nội dung lịch hẹn không vượt quá 2.000 ký tự.");
  const log: CareLog = {
    type: "appointment",
    title: `Hẹn lại ${fmtDate(normalized)}: ${text}`,
    createdAt: new Date().toISOString(),
  };
  return { patch: { followUpDate: normalized, followUpNote: text }, log };
}

export function lastContact(customer: Customer) {
  const logs = customer.careLogs || [];
  const contact = logs
    .filter(
      (log) =>
        log.type !== "appointment" &&
        log.type !== "zalo" &&
        !log.script &&
        log.status &&
        log.status !== "not_contacted" &&
        Number.isFinite(Date.parse(log.createdAt || "")),
    )
    .sort((a, b) => Date.parse(b.createdAt!) - Date.parse(a.createdAt!))[0];
  if (contact) return { at: contact.createdAt!, note: contact.title || "" };
  // Legacy timestamps are usable unless a copy event has overwritten them.
  if (
    !logs.some((log) => log.type === "zalo" || log.script) &&
    customer.lastCareAt &&
    Number.isFinite(Date.parse(customer.lastCareAt))
  )
    return { at: customer.lastCareAt, note: customer.lastCareNote || "" };
  return null;
}
