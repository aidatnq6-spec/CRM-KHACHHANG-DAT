import defaults from "./legacy-templates.json";
import meta from "./legacy-meta.json";
import { daysLeft, fmtDate, money, pkgLabel, serviceDeadlines } from "./domain";
import { hasSignature, serviceLabel, servicesText } from "./services";
import type { Customer, ZaloTemplate } from "./types";
export const defaultTemplates: ZaloTemplate[] = defaults;
export const templateKey = meta.templateKey;
export function loadTemplates(): ZaloTemplate[] {
  try {
    return mergeTemplates(
      JSON.parse(localStorage.getItem(templateKey) || "[]"),
    );
  } catch {
    return defaults.map((t) => ({ ...t }));
  }
}
export function mergeTemplates(raw: unknown): ZaloTemplate[] {
  if (!Array.isArray(raw)) throw new Error("File mẫu phải là một danh sách.");
  const result = defaults.map((t) => ({ ...t }));
  for (const entry of raw) {
    if (
      !entry ||
      typeof entry.key !== "string" ||
      typeof entry.name !== "string" ||
      typeof entry.body !== "string"
    )
      throw new Error("Mẫu Zalo không hợp lệ.");
    const item = {
      key: entry.key,
      name: entry.name,
      desc: String(entry.desc || ""),
      body: entry.body,
    };
    const at = result.findIndex((t) => t.key === item.key);
    if (at >= 0) result[at] = item;
    else result.push(item);
  }
  return result;
}
export function templateFor(k: Customer) {
  const d = daysLeft(k.expireDate);
  return d !== null && d < 0
    ? "expired"
    : d !== null && d <= 7
      ? "expire_7"
      : d !== null && d <= 30
        ? "expire_30"
        : k.bizName || k.mst
          ? "business"
          : "personal";
}
export function buildScript(
  k: Customer,
  templates: ZaloTemplate[],
  forcedKey = "auto",
) {
  const deadlines = serviceDeadlines(k);
  if (
    forcedKey === "auto" &&
    (!hasSignature(k) ||
      (deadlines[0] && deadlines[0].serviceId !== "digital_signature"))
  ) {
    const periods = deadlines.filter((period) => period.days <= 30);
    const included = periods.length ? periods : deadlines.slice(0, 1);
    const details = included
      .map(
        (period) =>
          `${serviceLabel(period.serviceId)}: hết hạn ${fmtDate(period.endDate)}${period.days < 0 ? ` (quá ${-period.days} ngày)` : period.days === 0 ? " (hôm nay)" : ` (còn ${period.days} ngày)`}`,
      )
      .join("\n");
    return `Chào ${k.contact || k.name || "anh/chị"},\n${details || `Em liên hệ về dịch vụ ${servicesText(k)}.`}\nAnh/chị cho em xin thời gian thuận tiện để trao đổi và hỗ trợ nhé.`;
  }
  const template =
    templates.find(
      (t) => t.key === (forcedKey === "auto" ? templateFor(k) : forcedKey),
    ) || templates[0];
  const d = daysLeft(k.expireDate);
  const vars: Record<string, string | number> = {
    ten_khach: k.name || "",
    ten_lien_he: k.contact || k.name || "anh/chị",
    ten_cong_ty: k.bizName || k.name || "mình",
    mst: k.mst || "",
    sdt: k.phone || "",
    goi_cuoc: pkgLabel(k.pkg),
    gia_tien: money(k.price),
    ngay_cap: fmtDate(k.issueDate),
    ngay_het_han: fmtDate(k.expireDate),
    so_ngay_con_lai: d === null ? "" : Math.max(0, d),
    so_ngay_qua_han: d === null ? 0 : Math.max(0, -d),
    tinh_trang_han:
      d === null
        ? "chưa rõ ngày hết hạn"
        : d < 0
          ? `đã quá hạn ${-d} ngày`
          : d === 0
            ? "hết hạn hôm nay"
            : `còn ${d} ngày`,
  };
  return (template?.body || "").replace(/\{([a-zA-Z0-9_]+)\}/g, (all, key) =>
    vars[key] === undefined ? all : String(vars[key]),
  );
}
