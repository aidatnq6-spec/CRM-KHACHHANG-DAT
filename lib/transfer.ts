import { Timestamp } from "firebase/firestore";
import { createCustomerId } from "./ids";
import columns from "./legacy-columns.json";
import {
  careLabels,
  careOf,
  duplicateOf,
  fmtDate,
  normalizeDate,
  normalizeText,
  pkgLabel,
  statusLabels,
  statusOf,
} from "./domain";
import type { Customer, CustomerPatch } from "./types";
import {
  additionalDatedServices,
  isServiceId,
  parseServices,
  servicesText,
} from "./services";
import type { WriteOperation } from "./repository";
export function download(
  name: string,
  content: string,
  type = "application/json",
) {
  const blob = new Blob([content], { type }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function backupPayload(rows: Customer[], email: string, uid: string) {
  return {
    app: "crm-cks",
    exportedAt: new Date().toISOString(),
    sourceEmail: email,
    sourceUid: uid,
    count: rows.length,
    customers: rows.map((k) => {
      const data = { ...k };
      delete (data as Partial<Customer>).id;
      return { id: k.id, data };
    }),
  };
}
function revive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    const seconds = o.seconds ?? o._seconds,
      nanos = o.nanoseconds ?? o._nanoseconds;
    if (
      typeof seconds === "number" &&
      typeof nanos === "number" &&
      (Object.keys(o).length === 2 ||
        (Object.keys(o).length === 3 && o.type === "firestore/timestamp/1.0"))
    )
      return new Timestamp(seconds, nanos);
    return Object.fromEntries(
      Object.entries(o)
        .filter(
          ([key]) => !["__proto__", "prototype", "constructor"].includes(key),
        )
        .map(([key, val]) => [key, revive(val)]),
    );
  }
  return value;
}
export function parseBackup(payload: unknown): WriteOperation[] {
  if (
    !payload ||
    typeof payload !== "object" ||
    !Array.isArray((payload as { customers?: unknown }).customers)
  )
    throw new Error(
      "JSON không đúng định dạng CRM: thiếu danh sách customers.",
    );
  const items = (payload as { customers: unknown[] }).customers,
    ids = new Set<string>();
  if (!items.length) throw new Error("File không có khách hàng.");
  if (items.length > 50000)
    throw new Error("File quá lớn, tối đa 50.000 khách mỗi lần.");
  return items.map((raw, i) => {
    if (!raw || typeof raw !== "object")
      throw new Error(`Bản ghi ${i + 1} không hợp lệ.`);
    const item = raw as Record<string, unknown>;
    const data = revive(item.data || item) as Record<string, unknown>;
    if (
      !data ||
      Array.isArray(data) ||
      typeof data !== "object" ||
      typeof data.name !== "string" ||
      !data.name.trim()
    )
      throw new Error(`Bản ghi ${i + 1} thiếu tên khách.`);
    const id = String(item.id || data.id || createCustomerId());
    if (
      !id ||
      id.includes("/") ||
      /^__.*__$/.test(id) ||
      id === "." ||
      id === ".." ||
      new TextEncoder().encode(id).length > 1500 ||
      ids.has(id)
    )
      throw new Error(
        `ID bản ghi ${i + 1} không hợp lệ hoặc bị trùng trong file.`,
      );
    ids.add(id);
    delete data.id;
    if (
      Object.hasOwn(data, "services") &&
      (!Array.isArray(data.services) ||
        data.services.some((service) => !isServiceId(service)))
    )
      throw new Error(`Dịch vụ ở bản ghi ${i + 1} không hợp lệ.`);
    if (Object.hasOwn(data, "servicePeriods")) {
      const raw = data.servicePeriods;
      if (!raw || typeof raw !== "object" || Array.isArray(raw))
        throw new Error(`Kỳ hạn dịch vụ ở bản ghi ${i + 1} không hợp lệ.`);
      for (const [key, period] of Object.entries(raw)) {
        if (
          !additionalDatedServices.some((service) => service.id === key) ||
          !period ||
          typeof period !== "object" ||
          Array.isArray(period)
        )
          throw new Error(`Kỳ hạn dịch vụ ở bản ghi ${i + 1} không hợp lệ.`);
        const value = period as Record<string, unknown>;
        if (value.pkg !== undefined && typeof value.pkg !== "string")
          throw new Error(`Gói dịch vụ ở bản ghi ${i + 1} không hợp lệ.`);
        if (
          value.price !== undefined &&
          (typeof value.price !== "number" ||
            !Number.isSafeInteger(value.price) ||
            value.price < 0)
        )
          throw new Error(
            `Giá dịch vụ ở bản ghi ${i + 1} phải là số nguyên không âm.`,
          );
        for (const field of ["startDate", "endDate"])
          if (
            value[field] !== undefined &&
            (typeof value[field] !== "string" ||
              (value[field] !== "" &&
                normalizeDate(value[field]) !== value[field]))
          )
            throw new Error(`Ngày dịch vụ ở bản ghi ${i + 1} không hợp lệ.`);
        if (
          value.startDate &&
          value.endDate &&
          String(value.startDate) > String(value.endDate)
        )
          throw new Error(
            `Ngày hết hạn trước ngày bắt đầu ở bản ghi ${i + 1}.`,
          );
      }
    }
    return { id, data: data as CustomerPatch, preserveTimestamps: true };
  });
}
export type ImportRow = { row: number; data: CustomerPatch; errors: string[] };
const serviceFieldLabels = {
  startDate: "Ngày bắt đầu",
  endDate: "Ngày hết hạn",
  pkg: "Gói dịch vụ",
  price: "Giá tiền (VNĐ)",
} as const;
const importPrice = (raw: unknown) =>
  typeof raw === "number"
    ? raw
    : Number(
        String(raw)
          .replace(/(?:vnd|đ|₫|\s)/gi, "")
          .replace(/[.,](?=\d{3}(?:[.,]|$))/g, "")
          .replace(",", "."),
      );
const oldPositions = [
  "name",
  "mst",
  "pkgRaw",
  "bizName",
  "mstHD",
  "address",
  "price",
  "note2",
  "priceKM",
  "sendHH",
  "expireDate",
  "paid",
  "phone",
  "loginDVC",
];
const columnMap: Record<string, string> = {
  ...columns,
  "trang thai cham soc": "careStatus",
  "ngay hen": "followUpDate",
  "ghi chu lich hen": "followUpNote",
  "dich vu": "services",
  ...Object.fromEntries(
    additionalDatedServices.flatMap((service) =>
      Object.entries(serviceFieldLabels).map(([field, label]) => [
        normalizeText(`${label} ${service.label}`),
        `period:${service.id}:${field}`,
      ]),
    ),
  ),
};
const mappedField = (header: string) =>
  Object.hasOwn(columnMap, header) ? columnMap[header] : "";
export function parseGrid(grid: unknown[][], date1904 = false): ImportRow[] {
  const importDate = (raw: unknown) => {
    const value =
      typeof raw === "string" && /^\d+(?:\.\d+)?$/.test(raw.trim())
        ? Number(raw)
        : raw;
    return normalizeDate(
      typeof value === "number" && date1904 ? value + 1462 : value,
    );
  };
  const scored = grid.slice(0, 25).map((row, index) => ({
    index,
    score: row.filter((h) => mappedField(normalizeText(h))).length,
  }));
  const header = scored.sort((a, b) => b.score - a.score)[0];
  if (!header || header.score < 2)
    throw new Error(
      "Không nhận ra tiêu đề. Hãy dùng file mẫu hoặc chọn đúng trang tính.",
    );
  const labels = grid[header.index].map(normalizeText);
  const old =
    labels.includes("thong tin chu ky so") && labels.includes("mst/cmnd/cccd");
  const fields = old ? oldPositions : labels.map(mappedField);
  const start = header.index + (old ? 2 : 1);
  return grid.slice(start).flatMap((row, i) => {
    if (!row.some((v) => v !== "" && v != null)) return [];
    const data: Record<string, unknown> = {},
      errors: string[] = [];
    fields.forEach((key, ci) => {
      if (key && row[ci] !== undefined && row[ci] !== "")
        data[key] = typeof row[ci] === "string" ? row[ci].trim() : row[ci];
    });
    if (!data.name) data.name = data.customId || "";
    const periods: NonNullable<Customer["servicePeriods"]> = {};
    for (const service of additionalDatedServices) {
      for (const field of ["startDate", "endDate"] as const) {
        const key = `period:${service.id}:${field}`;
        if (data[key] === undefined) continue;
        const date = importDate(data[key]);
        if (!date) errors.push(`Ngày không hợp lệ: ${service.label}`);
        else periods[service.id] = { ...periods[service.id], [field]: date };
        delete data[key];
      }
      const period = periods[service.id];
      const packageKey = `period:${service.id}:pkg`;
      const priceKey = `period:${service.id}:price`;
      if (data[packageKey] !== undefined)
        periods[service.id] = {
          ...periods[service.id],
          pkg: String(data[packageKey]).trim(),
        };
      if (data[priceKey] !== undefined) {
        const price = importPrice(data[priceKey]);
        if (!Number.isSafeInteger(price) || price < 0)
          errors.push(`${service.label}: Giá tiền phải là số nguyên không âm`);
        else periods[service.id] = { ...periods[service.id], price };
      }
      delete data[packageKey];
      delete data[priceKey];
      if (
        period?.startDate &&
        period.endDate &&
        period.endDate < period.startDate
      )
        errors.push(`${service.label}: Hết hạn trước ngày bắt đầu`);
    }
    if (Object.keys(periods).length) data.servicePeriods = periods;
    if (data.services !== undefined) {
      try {
        data.services = parseServices(data.services);
      } catch (error) {
        errors.push(
          error instanceof Error ? error.message : "Dịch vụ không hợp lệ",
        );
      }
    }
    if (!String(data.name).trim()) errors.push("Thiếu tên khách");
    if (!data.mst && data.mstHD) data.mst = data.mstHD;
    delete data.mstHD;
    if (data.pkgRaw !== undefined) {
      data.pkg = String(data.pkgRaw);
      delete data.pkgRaw;
    }
    if (data.statusRaw !== undefined) {
      data.status = /ngừng|dừng|inactive/i.test(String(data.statusRaw))
        ? "inactive"
        : "active";
      delete data.statusRaw;
    }
    for (const key of ["issueDate", "expireDate", "followUpDate"])
      if (data[key] != null) {
        const date = importDate(data[key]);
        if (!date) errors.push(`Ngày không hợp lệ: ${key}`);
        else data[key] = date;
      }
    if (
      data.issueDate &&
      data.expireDate &&
      String(data.issueDate) > String(data.expireDate)
    )
      errors.push("Hết hạn trước ngày cấp");
    if (data.price !== undefined) {
      const raw = data.price;
      const normalized = importPrice(raw);
      if (!Number.isFinite(normalized) || normalized < 0)
        errors.push("Giá tiền không hợp lệ");
      else data.price = normalized;
    }
    for (const key of [
      "phone",
      "mst",
      "customId",
      "name",
      "contact",
      "bizName",
    ])
      if (data[key] !== undefined) data[key] = String(data[key]);
    for (const key of ["paid", "sendHH"])
      if (key in data) data[key] = /^x$|^true$/i.test(String(data[key]));
    if (data.careStatus && !(String(data.careStatus) in careLabels))
      errors.push("Trạng thái chăm sóc không hợp lệ");
    return [{ row: start + i + 1, data: data as CustomerPatch, errors }];
  });
}
export function planExcelImport(
  entries: ImportRow[],
  existing: Customer[],
  mode: "skip" | "update",
) {
  const index = [...existing],
    map = new Map<string, WriteOperation>();
  const periodErrors: string[] = [];
  let skipped = 0,
    updated = 0,
    added = 0,
    suspected = 0;
  for (const row of entries) {
    if (row.errors.length) {
      skipped++;
      continue;
    }
    const duplicate = duplicateOf(row.data, index);
    if (duplicate?.strength === "strong" && mode === "skip") {
      skipped++;
      continue;
    }
    if (duplicate?.strength === "soft") suspected++;
    const id =
      duplicate?.strength === "strong"
        ? duplicate.customer.id
        : createCustomerId();
    const at = index.findIndex((k) => k.id === id);
    const previous = map.get(id)?.data || {};
    const data = { ...previous, ...row.data };
    let invalidPeriod = false;
    if (row.data.servicePeriods) {
      data.servicePeriods = { ...(at >= 0 ? index[at].servicePeriods : {}) };
      for (const service of additionalDatedServices) {
        const patch = row.data.servicePeriods[service.id];
        if (patch)
          data.servicePeriods[service.id] = {
            ...data.servicePeriods[service.id],
            ...patch,
          };
        const period = data.servicePeriods[service.id];
        if (
          period?.startDate &&
          period.endDate &&
          period.endDate < period.startDate
        ) {
          invalidPeriod = true;
          periodErrors.push(
            `Dòng ${row.row}: ${service.label} hết hạn trước ngày bắt đầu đã lưu.`,
          );
        }
      }
    }
    if (invalidPeriod) {
      skipped++;
      continue;
    }
    if (duplicate?.strength === "strong") updated++;
    else added++;
    map.set(id, { id, data });
    const next = { ...(at >= 0 ? index[at] : {}), ...data, id } as Customer;
    if (at >= 0) index[at] = next;
    else index.push(next);
  }
  return {
    operations: [...map.values()],
    skipped,
    updated,
    added,
    suspected,
    periodErrors,
  };
}
export const excelHeaders: Record<string, string> = {
  customId: "Mã ID",
  name: "Tên khách hàng",
  contact: "Tên liên hệ",
  mst: "Mã số thuế",
  bizName: "Tên công ty",
  address: "Địa chỉ",
  phone: "Số điện thoại",
  pkg: "Gói cước",
  price: "Giá tiền (VND)",
  issueDate: "Ngày cấp",
  expireDate: "Ngày hết hạn",
  status: "Trạng thái",
  note2: "Ghi chú NCC",
  note: "Ghi chú chi tiết",
  careStatus: "Trạng thái chăm sóc",
  followUpDate: "Ngày hẹn",
  followUpNote: "Ghi chú lịch hẹn",
  services: "Dịch vụ",
  ...Object.fromEntries(
    additionalDatedServices.flatMap((service) =>
      (["startDate", "endDate"] as const).map((field) => [
        `period:${service.id}:${field}`,
        `${field === "startDate" ? "Ngày bắt đầu" : "Ngày hết hạn"} ${service.label}`,
      ]),
    ),
  ),
  ...Object.fromEntries(
    additionalDatedServices.flatMap((service) =>
      (["pkg", "price"] as const).map((field) => [
        `period:${service.id}:${field}`,
        `${serviceFieldLabels[field]} ${service.label}`,
      ]),
    ),
  ),
};
export const excelSafe = (value: unknown) =>
  typeof value === "string" && /^[=+@\-\t\r]/.test(value)
    ? "'" + value
    : (value ?? "");
export const customerExcelRow = (customer: Customer) =>
  Object.keys(excelHeaders).map((key) =>
    excelSafe(
      key.startsWith("period:")
        ? (() => {
            const [, serviceId, field] = key.split(":");
            const service = additionalDatedServices.find(
              (item) => item.id === serviceId,
            )!;
            return (
              customer.servicePeriods?.[service.id]?.[
                field as keyof typeof serviceFieldLabels
              ] ?? ""
            );
          })()
        : key === "services"
          ? servicesText(customer)
          : key === "pkg"
            ? pkgLabel(customer.pkg)
            : customer[key],
    ),
  );
export async function exportExcel(rows: Customer[], template = false) {
  const XLSX = await import("xlsx");
  const grid: unknown[][] = [
    Object.values(excelHeaders),
    ...rows.map(customerExcelRow),
  ];
  if (template)
    grid.push([
      "KH0001",
      "Khách hàng mẫu",
      "",
      "",
      "",
      "",
      "0901234567",
      "Gói 1 năm",
      1200000,
      "2026-10-22",
      "2027-10-22",
      "active",
      "",
      "",
      "not_contacted",
      "",
      "",
      "Chữ ký số; Hóa đơn điện tử",
      ...additionalDatedServices.flatMap((service) =>
        service.id === "e_invoice" ? ["2026-10-22", "2027-10-22"] : ["", ""],
      ),
      ...additionalDatedServices.flatMap((service) =>
        service.id === "e_invoice" ? ["Gói 500 số", 500000] : ["", ""],
      ),
    ]);
  const sheet = XLSX.utils.aoa_to_sheet(grid);
  sheet["!cols"] = Object.keys(excelHeaders).map(() => ({ wch: 23 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Khách hàng");
  XLSX.writeFile(wb, template ? "Mau_Import_CRM_CKS.xlsx" : "CRM_CKS.xlsx");
}
export async function exportReportExcel(rows: Customer[]) {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.json_to_sheet(
    rows.map((k) => ({
      "Khách hàng": excelSafe(k.name),
      "Ngày hết hạn": fmtDate(k.expireDate),
      "Trạng thái": statusLabels[statusOf(k)],
      "Chăm sóc": careLabels[careOf(k)],
      Giá: Number(k.price) || 0,
    })),
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Báo cáo");
  XLSX.writeFile(wb, "Bao_cao_CRM_CKS.xlsx");
}
