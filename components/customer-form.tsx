"use client";
import { useState, type FormEvent } from "react";
import { AlertTriangle, Save } from "lucide-react";
import {
  careLabels,
  careOf,
  duplicateOf,
  nextFollowUp,
  normalizeDate,
  pkgLabel,
  todayVN,
} from "@/lib/domain";
import type {
  CareStatus,
  Customer,
  CustomerPatch,
  ServiceId,
} from "@/lib/types";
import {
  additionalDatedServices,
  serviceCatalog,
  servicesOf,
} from "@/lib/services";
import { readableError, useCRM } from "./crm-provider";

export default function CustomerForm({
  customer,
  onDone,
  onCancel,
}: {
  customer?: Customer;
  onDone: () => void;
  onCancel: () => void;
}) {
  const crm = useCRM(),
    [error, setError] = useState(""),
    [dup, setDup] = useState<ReturnType<typeof duplicateOf>>(),
    [pending, setPending] = useState<CustomerPatch | null>(null);
  const [care, setCare] = useState<CareStatus>(
    customer ? careOf(customer) : "not_contacted",
  );
  const [followDate, setFollowDate] = useState(customer?.followUpDate || ""),
    [followNote, setFollowNote] = useState(customer?.followUpNote || "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [services, setServices] = useState<ServiceId[]>(() =>
    servicesOf(customer || {}),
  );
  const signatureSelected = services.includes("digital_signature");
  function fieldProps(name: string) {
    return {
      "aria-invalid": !!fieldErrors[name],
      "aria-describedby": fieldErrors[name]
        ? `customer-${name}-error`
        : undefined,
    };
  }
  function fieldError(name: string) {
    return fieldErrors[name] ? (
      <span className="field-error" id={`customer-${name}-error`}>
        {fieldErrors[name]}
      </span>
    ) : null;
  }
  async function commit(data: CustomerPatch, targetId = customer?.id) {
    setError("");
    try {
      await crm.save(data, targetId);
      onDone();
    } catch (e) {
      setError(readableError(e));
    }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setDup(undefined);
    const fields = new FormData(e.currentTarget),
      data: CustomerPatch = {};
    for (const [key, value] of fields.entries())
      if (!key.startsWith("service-") && !key.startsWith("period-"))
        data[key] = String(value).trim();
    data.services = serviceCatalog
      .filter((service) => services.includes(service.id))
      .map((service) => service.id);
    if (signatureSelected) data.price = Number(fields.get("price") || 0);
    data.careStatus = care;
    data.followUpDate = followDate;
    data.followUpNote = followNote;
    const invalid: Record<string, string> = {};
    if (!String(data.name || "").trim())
      invalid.name = "Vui lòng nhập tên khách hàng.";
    if (!services.length) invalid.services = "Chọn ít nhất một dịch vụ.";
    const periods = { ...customer?.servicePeriods };
    for (const service of additionalDatedServices) {
      if (!services.includes(service.id)) continue;
      const period = { ...periods[service.id] };
      for (const key of ["startDate", "endDate"] as const) {
        const field = `period-${service.id}-${key}`;
        const value = String(fields.get(field) || "").trim();
        const input = e.currentTarget.elements.namedItem(
          field,
        ) as HTMLInputElement;
        if ((value && !normalizeDate(value)) || !input.validity.valid)
          invalid[field] = "Vui lòng nhập ngày hợp lệ.";
        period[key] = value;
      }
      if (
        period.startDate &&
        period.endDate &&
        period.endDate < period.startDate
      )
        invalid[`period-${service.id}-endDate`] =
          "Ngày hết hạn phải từ ngày bắt đầu trở đi.";
      periods[service.id] = period;
    }
    if (Object.keys(periods).length) data.servicePeriods = periods;
    const priceInput = e.currentTarget.elements.namedItem(
      "price",
    ) as HTMLInputElement;
    if (
      signatureSelected &&
      (Number(data.price) < 0 ||
        !Number.isFinite(data.price) ||
        !priceInput.validity.valid)
    )
      invalid.price = "Nhập giá tiền là số nguyên không âm.";
    for (const key of ["issueDate", "expireDate", "followUpDate"] as const)
      if (
        (key === "followUpDate" || signatureSelected) &&
        ((data[key] && !normalizeDate(data[key])) ||
          !(e.currentTarget.elements.namedItem(key) as HTMLInputElement)
            .validity.valid)
      )
        invalid[key] = "Vui lòng nhập ngày hợp lệ.";
    if (data.issueDate && data.expireDate && data.expireDate < data.issueDate)
      invalid.expireDate = "Ngày hết hạn phải từ ngày cấp trở đi.";
    setFieldErrors(invalid);
    if (Object.keys(invalid).length) {
      (
        e.currentTarget.elements.namedItem(
          Object.keys(invalid)[0] === "services"
            ? "service-digital_signature"
            : Object.keys(invalid)[0],
        ) as HTMLElement
      )?.focus();
      return;
    }
    const duplicate = duplicateOf(data, crm.rows, customer?.id);
    if (duplicate) {
      setDup(duplicate);
      setPending(data);
      return;
    }
    void commit(data);
  }
  return (
    <form onSubmit={submit} className="customer-form" noValidate>
      <fieldset disabled={crm.busy}>
        <legend>Thông tin khách hàng</legend>
        <div className="form-grid">
          <label className="span-2">
            <span>
              Tên khách hàng <span className="required">*</span>
            </span>
            <input
              name="name"
              {...fieldProps("name")}
              defaultValue={customer?.name}
              required
              autoFocus
              maxLength={300}
            />
            {fieldError("name")}
          </label>
          <label>
            Mã khách hàng
            <input name="customId" defaultValue={customer?.customId} />
          </label>
          <label>
            Người liên hệ
            <input name="contact" defaultValue={customer?.contact} />
          </label>
          <label>
            Điện thoại / Email
            <input name="phone" defaultValue={customer?.phone} />
          </label>
          <label>
            Trạng thái hoạt động
            <select
              aria-label="Trạng thái hoạt động"
              name="status"
              defaultValue={
                customer?.status === "inactive" ? "inactive" : "active"
              }
            >
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </label>
        </div>
      </fieldset>
      <fieldset disabled={crm.busy} {...fieldProps("services")}>
        <legend>Dịch vụ của khách hàng</legend>
        <p className="service-help">
          Chọn một hoặc nhiều dịch vụ khách đang sử dụng. Mỗi dịch vụ có kỳ hạn
          được nhập ngày riêng bên dưới; giá và gói hiện tại dành cho chữ ký số.
        </p>
        <div className="service-options">
          {serviceCatalog.map((service) => (
            <label
              key={service.id}
              className={services.includes(service.id) ? "selected" : ""}
            >
              <input
                type="checkbox"
                name={`service-${service.id}`}
                checked={services.includes(service.id)}
                onChange={(event) =>
                  setServices((previous) =>
                    event.target.checked
                      ? [...previous, service.id]
                      : previous.filter((id) => id !== service.id),
                  )
                }
              />
              <span>{service.label}</span>
            </label>
          ))}
        </div>
        {fieldError("services")}
      </fieldset>
      <fieldset
        disabled={crm.busy || !signatureSelected}
        hidden={!signatureSelected}
      >
        <legend>Dịch vụ chữ ký số</legend>
        <div className="form-grid">
          <label>
            Gói dịch vụ
            <input
              aria-label="Gói dịch vụ"
              name="pkg"
              defaultValue={customer?.pkg ? pkgLabel(customer.pkg) : ""}
              list="packages"
              placeholder="Chọn hoặc nhập gói"
            />
            <datalist id="packages">
              <option>Gói 1 năm</option>
              <option>Gói 2 năm</option>
              <option>Gói 3 năm</option>
            </datalist>
          </label>
          <label>
            Giá tiền (VNĐ)
            <input
              name="price"
              {...fieldProps("price")}
              type="number"
              min="0"
              step="1"
              defaultValue={customer?.price || ""}
            />
            {fieldError("price")}
          </label>
          <label>
            Ngày cấp
            <input
              name="issueDate"
              {...fieldProps("issueDate")}
              type="date"
              defaultValue={normalizeDate(customer?.issueDate)}
            />
            {fieldError("issueDate")}
          </label>
          <label>
            Ngày hết hạn
            <input
              name="expireDate"
              {...fieldProps("expireDate")}
              type="date"
              defaultValue={normalizeDate(customer?.expireDate)}
            />
            {fieldError("expireDate")}
          </label>
        </div>
      </fieldset>
      {additionalDatedServices.map((service) => (
        <fieldset
          key={service.id}
          hidden={!services.includes(service.id)}
          disabled={crm.busy || !services.includes(service.id)}
          className="service-period-fields"
        >
          <legend>{service.label}</legend>
          <div className="form-grid">
            {(["startDate", "endDate"] as const).map((key) => {
              const field = `period-${service.id}-${key}`;
              const label =
                key === "startDate" ? "Ngày bắt đầu" : "Ngày hết hạn";
              return (
                <label key={key}>
                  {label}
                  <input
                    name={field}
                    aria-label={`${label} · ${service.label}`}
                    type="date"
                    defaultValue={normalizeDate(
                      customer?.servicePeriods?.[service.id]?.[key],
                    )}
                    {...fieldProps(field)}
                  />
                  {fieldError(field)}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      <fieldset disabled={crm.busy}>
        <legend>Chăm sóc & lịch hẹn</legend>
        <div className="form-grid">
          <label>
            Trạng thái chăm sóc
            <select
              aria-label="Trạng thái chăm sóc"
              name="careStatus"
              value={care}
              onChange={(e) => {
                const v = e.target.value as CareStatus;
                setCare(v);
                const next = nextFollowUp(v);
                if (next) {
                  setFollowDate(String(next.followUpDate || ""));
                  setFollowNote(String(next.followUpNote || ""));
                }
              }}
            >
              {Object.entries(careLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ngày hẹn liên hệ
            <input
              name="followUpDate"
              {...fieldProps("followUpDate")}
              type="date"
              value={followDate}
              onChange={(e) => setFollowDate(e.target.value)}
            />
            {fieldError("followUpDate")}
          </label>
          <label className="span-2">
            Nội dung lịch hẹn
            <input
              name="followUpNote"
              value={followNote}
              onChange={(e) => setFollowNote(e.target.value)}
            />
          </label>
        </div>
      </fieldset>
      <details className="form-supplement" open={!!customer}>
        <summary>
          Thông tin bổ sung <span>Công ty, mã số thuế, địa chỉ và ghi chú</span>
        </summary>
        <fieldset disabled={crm.busy}>
          <legend className="sr-only">Thông tin bổ sung</legend>
          <div className="form-grid">
            <label>
              Mã số thuế / CCCD
              <input name="mst" defaultValue={customer?.mst} />
            </label>
            <label>
              Tên công ty
              <input name="bizName" defaultValue={customer?.bizName} />
            </label>
            <label className="span-2">
              Địa chỉ
              <input name="address" defaultValue={customer?.address} />
            </label>
            <label className="span-2">
              Ghi chú
              <textarea name="note" rows={3} defaultValue={customer?.note} />
            </label>
            <label className="span-2">
              Ghi chú nhà cung cấp
              <textarea name="note2" rows={2} defaultValue={customer?.note2} />
            </label>
          </div>
        </fieldset>
      </details>
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      {dup && pending && (
        <div className="alert warning" role="alert">
          <AlertTriangle size={19} />
          <div>
            <strong>
              Có thể trùng {dup.field}: {dup.customer.name}
            </strong>
            <p>
              {!customer && dup.strength === "strong"
                ? "Cập nhật khách đã có bằng thông tin vừa nhập?"
                : "Kiểm tra thông tin trước khi tiếp tục lưu."}
            </p>
            <div className="inline-actions">
              <button
                type="button"
                className="button secondary"
                disabled={crm.busy}
                onClick={() => {
                  setDup(undefined);
                  setPending(null);
                }}
              >
                Kiểm tra lại
              </button>
              <button
                type="button"
                className="button primary"
                disabled={crm.busy}
                onClick={() =>
                  void commit(
                    pending,
                    !customer && dup.strength === "strong"
                      ? dup.customer.id
                      : customer?.id,
                  )
                }
              >
                {!customer && dup.strength === "strong"
                  ? "Cập nhật khách đã có"
                  : "Vẫn lưu thông tin"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="form-actions">
        <button
          type="button"
          className="button secondary"
          disabled={crm.busy}
          onClick={onCancel}
        >
          Hủy
        </button>
        <button className="button primary" disabled={crm.busy}>
          <Save size={17} />
          {crm.busy ? "Đang lưu…" : "Lưu khách hàng"}
        </button>
      </div>
    </form>
  );
}
export function RenewalForm({
  customer,
  onDone,
  onCancel,
}: {
  customer: Customer;
  onDone: () => void;
  onCancel: () => void;
}) {
  const crm = useCRM(),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      date = String(f.get("date")),
      expire = String(f.get("expire"));
    if (!normalizeDate(date) || !normalizeDate(expire) || expire < date) {
      setError("Ngày hết hạn mới phải từ ngày gia hạn trở đi.");
      return;
    }
    try {
      await crm.renew(customer.id, {
        date,
        expire,
        pkg: String(f.get("pkg")),
        price: Number(f.get("price")),
        note: String(f.get("note")),
      });
      onDone();
    } catch (e) {
      setError(readableError(e));
    }
  }
  return (
    <form className="customer-form" onSubmit={submit}>
      <p className="form-intro">
        Ghi nhận giao dịch mới và cập nhật ngày hết hạn cho{" "}
        <strong>{customer.name}</strong>.
      </p>
      <fieldset disabled={crm.busy}>
        <legend>Thông tin gia hạn</legend>
        <div className="form-grid">
          <label>
            Ngày gia hạn
            <input name="date" type="date" defaultValue={todayVN()} required />
          </label>
          <label>
            Ngày hết hạn mới
            <input name="expire" type="date" required />
          </label>
          <label>
            Gói dịch vụ
            <input
              aria-label="Gói dịch vụ"
              name="pkg"
              defaultValue={pkgLabel(customer.pkg)}
              required
            />
          </label>
          <label>
            Giá gia hạn (VNĐ)
            <input
              name="price"
              type="number"
              min="0"
              step="1"
              defaultValue={customer.price || 0}
              required
            />
          </label>
          <label className="span-2">
            Ghi chú
            <textarea name="note" rows={3} />
          </label>
        </div>
      </fieldset>
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      <div className="alert info">
        Sau khi lưu, trạng thái chuyển thành “Đã gia hạn” và lịch hẹn cũ được
        xóa.
      </div>
      <div className="form-actions">
        <button
          type="button"
          className="button secondary"
          disabled={crm.busy}
          onClick={onCancel}
        >
          Quay lại
        </button>
        <button className="button primary" disabled={crm.busy}>
          {crm.busy ? "Đang lưu…" : "Lưu gia hạn"}
        </button>
      </div>
    </form>
  );
}
