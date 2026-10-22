import type {
  CareStatus,
  Customer,
  CustomerPatch,
  HistoryEntry,
} from "./types";
export const careLabels: Record<CareStatus, string> = {
  not_contacted: "Chưa liên hệ",
  zalo_sent: "Đã nhắn Zalo",
  called: "Đã gọi",
  waiting: "Chờ phản hồi",
  renewed: "Đã gia hạn",
  declined: "Từ chối",
};
export const statusLabels: Record<string, string> = {
  active: "Còn hạn",
  expiring: "Sắp hết hạn",
  expired: "Đã hết hạn",
  inactive: "Ngừng hoạt động",
  unknown: "Chưa rõ hạn",
};
export const careOf = (k: Customer): CareStatus =>
  k.careStatus && k.careStatus in careLabels ? k.careStatus : "not_contacted";
export function todayVN(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function normalizeDate(raw: unknown): string {
  if (raw == null || raw === "") return "";
  if (raw instanceof Date)
    return Number.isFinite(raw.getTime()) ? raw.toISOString().slice(0, 10) : "";
  if (typeof raw === "number") {
    const d = new Date(Math.round((raw - 25569) * 86400000));
    return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : "";
  }
  let s = String(raw).trim();
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);
  if (dmy) {
    const y = Number(dmy[3]);
    s = `${dmy[3].length === 2 ? (y <= 49 ? 2000 + y : 1900 + y) : y}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  } else {
    const ymd = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (ymd)
      s = `${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`;
  }
  return validDate(s) ? s : "";
}
export function daysLeft(value: unknown, today = todayVN()): number | null {
  const s = normalizeDate(value);
  return s && validDate(today)
    ? Math.round(
        (Date.parse(s + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) /
          86400000,
      )
    : null;
}
export function dateAfter(days: number, today = todayVN()) {
  return new Date(Date.parse(today + "T00:00:00Z") + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function fmtDate(value: unknown) {
  const s = normalizeDate(
    typeof value === "string" ? value.slice(0, 10) : value,
  );
  return s ? s.split("-").reverse().join("/") : value ? String(value) : "—";
}
export const money = (value: unknown) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
export const pkgLabel = (value: unknown) =>
  ({ "1": "Gói 1 năm", "2": "Gói 2 năm", "3": "Gói 3 năm" })[
    String(value) as "1"
  ] || String(value || "Chưa có gói");
export function statusOf(k: Customer, today = todayVN()) {
  if (k.status === "inactive") return "inactive";
  const d = daysLeft(k.expireDate, today);
  return d === null
    ? "unknown"
    : d < 0
      ? "expired"
      : d <= 30
        ? "expiring"
        : "active";
}
export function expiring(rows: Customer[], within = 30, today = todayVN()) {
  return rows
    .filter((k) => {
      const d = daysLeft(k.expireDate, today);
      return k.status !== "inactive" && d !== null && d >= 0 && d <= within;
    })
    .sort(
      (a, b) =>
        daysLeft(a.expireDate, today)! - daysLeft(b.expireDate, today)! ||
        a.name.localeCompare(b.name, "vi"),
    );
}
export const normalizeText = (v: unknown) =>
  String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
export function phoneDigits(v: unknown) {
  const s = String(v || "").match(/(?:\+?84|0)[\d .()-]{8,}/)?.[0] || "";
  return s.replace(/\D/g, "").replace(/^84/, "0");
}
export function matchesSearch(k: Customer, q: string) {
  return normalizeText(
    [
      k.name,
      k.customId,
      k.bizName,
      k.mst,
      k.phone,
      k.contact,
      k.note,
      k.note2,
    ].join(" "),
  ).includes(normalizeText(q));
}
export function nextFollowUp(
  status: CareStatus,
  today = todayVN(),
): CustomerPatch | null {
  if (status === "renewed" || status === "declined")
    return { followUpDate: "", followUpNote: "" };
  const rule = {
    zalo_sent: [2, "Tự động: kiểm tra phản hồi sau khi nhắn Zalo"],
    called: [3, "Tự động: gọi lại sau cuộc gọi chăm sóc"],
    waiting: [1, "Tự động: nhắc lại khách đang chờ phản hồi"],
  }[status as "called"];
  return rule
    ? {
        followUpDate: dateAfter(Number(rule[0]), today),
        followUpNote: String(rule[1]),
      }
    : null;
}
export function duplicateOf(
  data: Partial<Customer>,
  rows: Customer[],
  ignoreId?: string,
) {
  for (const type of ["customId", "phone", "name"] as const) {
    const key =
      type === "phone"
        ? phoneDigits(data.phone)
        : normalizeText(
            type === "name" ? data.bizName || data.name : data[type],
          );
    if (
      !key ||
      (type === "phone" && key.length < 9) ||
      (type === "name" && key.length < 8)
    )
      continue;
    const found = rows.find(
      (k) =>
        k.id !== ignoreId &&
        key ===
          (type === "phone"
            ? phoneDigits(k.phone)
            : normalizeText(type === "name" ? k.bizName || k.name : k[type])),
    );
    if (found)
      return {
        customer: found,
        strength: type === "name" ? "soft" : "strong",
        field: {
          customId: "mã khách",
          phone: "điện thoại",
          name: "tên/công ty",
        }[type],
      };
  }
}
export function dataIssues(k: Customer) {
  const issues: string[] = [];
  if (!k.phone) issues.push("Thiếu liên hệ");
  if (!k.expireDate) issues.push("Thiếu ngày hết hạn");
  else if (!normalizeDate(k.expireDate)) issues.push("Ngày hết hạn sai");
  if (k.issueDate && !normalizeDate(k.issueDate)) issues.push("Ngày cấp sai");
  if (
    k.issueDate &&
    normalizeDate(k.issueDate) &&
    normalizeDate(k.expireDate) &&
    normalizeDate(k.expireDate) < normalizeDate(k.issueDate)
  )
    issues.push("Hết hạn trước ngày cấp");
  if (!k.pkg || !/^[123]$|[123]\s*năm/i.test(String(k.pkg)))
    issues.push("Gói chưa xác định");
  if (!Number(k.price)) issues.push("Thiếu giá");
  return issues;
}
export function transactions(k: Customer): HistoryEntry[] {
  const list = Array.isArray(k.history) ? [...k.history] : [];
  if (
    k.expireDate &&
    !list.some(
      (h) =>
        h._isCurrent ||
        (h.expire === k.expireDate &&
          Number(h.price || 0) === Number(k.price || 0) &&
          pkgLabel(h.pkg) === pkgLabel(k.pkg)),
    )
  )
    list.push({
      date: k.issueDate,
      expire: k.expireDate,
      price: k.price,
      pkg: k.pkg,
      note: k.note,
      _isCurrent: true,
    });
  return list;
}
export const lifetimeValue = (k: Customer) =>
  transactions(k).reduce((s, h) => s + Number(h.price || 0), 0);
export function todayTasks(rows: Customer[], today = todayVN()) {
  return rows
    .flatMap((k) => {
      if (
        k.status === "inactive" ||
        ["renewed", "declined"].includes(careOf(k))
      )
        return [];
      const tasks: {
        customer: Customer;
        type: string;
        title: string;
        detail: string;
        priority: number;
        days: number;
      }[] = [];
      const f = daysLeft(k.followUpDate, today),
        d = daysLeft(k.expireDate, today);
      if (f !== null && f <= 0)
        tasks.push({
          customer: k,
          type: "follow",
          title: f < 0 ? "Lịch hẹn quá hạn" : "Lịch hẹn hôm nay",
          detail: k.followUpNote || "Liên hệ theo lịch hẹn",
          priority: 1,
          days: f,
        });
      if (d !== null && d < 0)
        tasks.push({
          customer: k,
          type: "expired",
          title: "CKS đã hết hạn",
          detail: `Quá ${-d} ngày`,
          priority: 2,
          days: d,
        });
      else if (d !== null && d <= 7)
        tasks.push({
          customer: k,
          type: "urgent",
          title: d === 0 ? "Hết hạn hôm nay" : `Còn ${d} ngày`,
          detail: "Ưu tiên nhắc gia hạn",
          priority: 3,
          days: d,
        });
      if (["waiting", "zalo_sent"].includes(careOf(k)))
        tasks.push({
          customer: k,
          type: "waiting",
          title: careLabels[careOf(k)],
          detail: `Liên hệ gần nhất: ${fmtDate(k.lastCareAt)}`,
          priority: 4,
          days: 999,
        });
      return tasks;
    })
    .sort((a, b) => a.priority - b.priority || a.days - b.days);
}
export function reportData(rows: Customer[], today = todayVN()) {
  const total = rows.length,
    currentRevenue = rows.reduce((s, k) => s + Number(k.price || 0), 0),
    average = total ? Math.round(currentRevenue / total) : 0;
  const upcoming = expiring(rows, 30, today);
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today + "T00:00:00Z");
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - (5 - i));
    return {
      key: d.toISOString().slice(0, 7),
      zalo: new Set<string>(),
      called: new Set<string>(),
      touched: new Set<string>(),
      renewed: new Set<string>(),
      declined: new Set<string>(),
      revenue: 0,
      issuedValue: 0,
    };
  });
  const monthMap = new Map(months.map((m) => [m.key, m]));
  const packages = new Map<string, { count: number; revenue: number }>();
  for (const k of rows) {
    const issuedMonth = monthMap.get(String(k.issueDate || "").slice(0, 7));
    if (issuedMonth) issuedMonth.issuedValue += Number(k.price || 0);
    const p = pkgLabel(k.pkg),
      bucket = packages.get(p) || { count: 0, revenue: 0 };
    bucket.count++;
    bucket.revenue += Number(k.price || 0);
    packages.set(p, bucket);
    for (const log of k.careLogs || []) {
      const m = monthMap.get(String(log.createdAt || "").slice(0, 7));
      if (!m) continue;
      if (log.type === "zalo" || log.status === "zalo_sent") {
        m.zalo.add(k.id);
        m.touched.add(k.id);
      }
      if (log.status === "called") {
        m.called.add(k.id);
        m.touched.add(k.id);
      }
      if (["waiting", "renewed", "declined"].includes(log.status || ""))
        m.touched.add(k.id);
      if (log.status === "renewed") m.renewed.add(k.id);
      if (log.status === "declined") m.declined.add(k.id);
    }
    for (const h of k.history || []) {
      const m = monthMap.get(String(h.date || h.addedAt || "").slice(0, 7));
      if (m) {
        m.renewed.add(k.id);
        m.revenue += Number(h.price || 0);
      }
    }
  }
  return {
    total,
    currentRevenue,
    average,
    forecast: upcoming.reduce((s, k) => s + (Number(k.price) || average), 0),
    renewalRate: total
      ? Math.round((rows.filter((k) => k.history?.length).length / total) * 100)
      : 0,
    packages: [...packages],
    months,
    top: [...rows]
      .sort((a, b) => lifetimeValue(b) - lifetimeValue(a))
      .slice(0, 10),
  };
}
