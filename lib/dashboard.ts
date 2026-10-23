import {
  careOf,
  dateAfter,
  daysLeft,
  expiring,
  normalizeDate,
  reportData,
  todayVN,
} from "./domain";
import { matchesWorkFilter, workQueue } from "./work-queue";
import type { Customer } from "./types";

const openCustomer = (customer: Customer) =>
  customer.status !== "inactive" &&
  !["renewed", "declined"].includes(careOf(customer));
const vietnamDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const sortExpiry = (a: Customer, b: Customer) =>
  normalizeDate(a.expireDate).localeCompare(normalizeDate(b.expireDate)) ||
  a.name.localeCompare(b.name, "vi");

export function dashboardData(rows: Customer[], today = todayVN()) {
  const queue = workQueue(rows, today);
  const priority = queue.filter((item) => matchesWorkFilter(item, "all"));
  const calendar = Array.from({ length: 7 }, (_, offset) => {
    const date = dateAfter(offset, today);
    const customers = rows
      .filter(
        (customer) =>
          openCustomer(customer) &&
          normalizeDate(customer.followUpDate) === date,
      )
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
    return { date, customers };
  });
  const months = Array.from({ length: 6 }, (_, offset) => {
    const start = new Date(today + "T00:00:00Z");
    start.setUTCDate(1);
    start.setUTCMonth(start.getUTCMonth() + offset);
    const key = start.toISOString().slice(0, 7);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    end.setUTCDate(0);
    const customers = rows
      .filter(
        (customer) =>
          customer.status !== "inactive" &&
          (daysLeft(customer.expireDate, today) ?? -1) >= 0 &&
          normalizeDate(customer.expireDate).slice(0, 7) === key,
      )
      .sort(sortExpiry);
    return {
      key,
      label: `${key.slice(5)}/${key.slice(0, 4)}`,
      end: end.toISOString().slice(0, 10),
      customers,
    };
  });
  const soon30 = expiring(rows, 30, today);
  return {
    overdue: queue.filter((item) => matchesWorkFilter(item, "overdue")),
    soon7: expiring(rows, 7, today),
    uncontacted: soon30.filter(
      (customer) => careOf(customer) === "not_contacted",
    ),
    soon30,
    forecast: reportData(rows, today).forecast,
    missingPrice: soon30.filter((customer) => !Number(customer.price)).length,
    priority: priority.slice(0, 5),
    totalPriority: priority.length,
    calendar,
    months,
  };
}

function eventDay(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return normalizeDate(value);
  if (
    !normalizeDate(value.slice(0, 10)) ||
    !/(Z|[+-]\d{2}:\d{2})$/i.test(value)
  )
    return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? vietnamDay.format(date) : "";
}

export function careResults(
  rows: Customer[],
  days: 7 | 30 | 90,
  today = todayVN(),
) {
  const from = dateAfter(1 - days, today);
  const inPeriod = (value: unknown) => {
    const day = eventDay(value);
    return !!day && day >= from && day <= today;
  };
  const contacted = rows.filter((customer) =>
    (customer.careLogs || []).some(
      (log) =>
        log.type !== "appointment" &&
        log.type !== "zalo" &&
        !log.script &&
        ["called", "waiting", "zalo_sent", "renewed", "declined"].includes(
          log.status || "",
        ) &&
        inPeriod(log.createdAt),
    ),
  );
  const renewed = rows.filter(
    (customer) =>
      (customer.careLogs || []).some(
        (log) =>
          log.type !== "appointment" &&
          log.type !== "zalo" &&
          !log.script &&
          log.status === "renewed" &&
          inPeriod(log.createdAt),
      ) ||
      (customer.history || []).some(
        (entry) => !entry._isCurrent && inPeriod(entry.date || entry.addedAt),
      ),
  );
  return { from, to: today, contacted, renewed };
}
