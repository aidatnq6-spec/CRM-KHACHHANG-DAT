"use client";
import { useState } from "react";
import {
  CalendarPlus,
  Check,
  FilePenLine,
  Phone,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  careLabels,
  careOf,
  fmtDate,
  lifetimeValue,
  money,
  phoneDigits,
  pkgLabel,
  transactions,
} from "@/lib/domain";
import type { CareStatus, Customer } from "@/lib/types";
import { readableError, useCRM } from "./crm-provider";
import CustomerForm, { RenewalForm } from "./customer-form";
import { CareBadge, ExpiryBadge, Modal } from "./ui";
import {
  additionalDatedServices,
  hasSignature,
  servicesOf,
} from "@/lib/services";
import CustomerServices from "./customer-services";
export default function CustomerDetail({
  customer,
  onClose,
  onZalo,
}: {
  customer: Customer;
  onClose: () => void;
  onZalo: (k: Customer) => void;
}) {
  const crm = useCRM(),
    [mode, setMode] = useState("view"),
    [error, setError] = useState(""),
    [note, setNote] = useState(""),
    [care, setCare] = useState<CareStatus>(careOf(customer)),
    [deleteText, setDeleteText] = useState("");
  async function logCare() {
    setError("");
    try {
      await crm.care(customer.id, care, note.trim() || undefined);
      setNote("");
    } catch (e) {
      setError(readableError(e));
    }
  }
  const history = transactions(customer),
    timeline = [
      ...history.map((h, i) => ({
        key: `h${i}`,
        date: h.date || h.addedAt || "",
        title: h._isCurrent ? "Dịch vụ hiện tại" : "Giao dịch gia hạn",
        body: `${pkgLabel(h.pkg)} · ${money(h.price)}`,
        note: h.note || "",
        expire: h.expire,
      })),
      ...(customer.careLogs || []).map((log, i) => ({
        key: `c${i}`,
        date: log.createdAt || "",
        title: log.title || careLabels[log.status as CareStatus] || "Chăm sóc",
        body: log.script || "",
        note: "",
        expire: undefined,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));
  const signature = hasSignature(customer);
  const savedSignature =
    signature ||
    !!(
      customer.pkg ||
      customer.issueDate ||
      customer.expireDate ||
      customer.price ||
      customer.history?.length
    );
  return (
    <Modal
      title={
        mode === "edit"
          ? "Sửa khách hàng"
          : mode === "renew"
            ? "Ghi nhận gia hạn"
            : "Hồ sơ khách hàng"
      }
      onClose={onClose}
      panel
    >
      {mode === "edit" ? (
        <CustomerForm
          customer={customer}
          onDone={() => setMode("view")}
          onCancel={() => setMode("view")}
        />
      ) : mode === "renew" ? (
        <RenewalForm
          customer={customer}
          onDone={() => setMode("view")}
          onCancel={() => setMode("view")}
        />
      ) : (
        <>
          <div className="profile-heading">
            <span className="avatar large">
              {customer.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <span className="section-note">
                {customer.customId || "Khách hàng"}
              </span>
              <h3>{customer.name}</h3>
              <p>{customer.bizName || customer.contact || "Chưa có công ty"}</p>
            </div>
          </div>
          <section className="profile-services">
            <h4>Dịch vụ của khách hàng</h4>
            <CustomerServices customer={customer} />
          </section>
          <div className="profile-badges">
            <ExpiryBadge customer={customer} />
            <CareBadge customer={customer} />
          </div>
          <div className="profile-actions">
            {phoneDigits(customer.phone) && (
              <a
                className="button secondary"
                href={`tel:${phoneDigits(customer.phone)}`}
              >
                <Phone size={16} />
                Gọi điện
              </a>
            )}
            <button className="button zalo" onClick={() => onZalo(customer)}>
              Soạn Zalo
            </button>
            {signature && (
              <button
                className="button primary"
                onClick={() => setMode("renew")}
              >
                <RefreshCw size={16} />
                Gia hạn
              </button>
            )}
            <button
              className="button secondary"
              onClick={() => setMode("edit")}
            >
              <FilePenLine size={16} />
              Sửa
            </button>
          </div>
          <section className="profile-section">
            <div className="section-heading">
              <h4>Chăm sóc & lịch hẹn</h4>
              <button className="text-button" onClick={() => setMode("edit")}>
                <CalendarPlus size={15} />
                Đặt lịch
              </button>
            </div>
            {customer.followUpDate && (
              <div className="appointment">
                <CalendarPlus size={19} />
                <div>
                  <strong>Hẹn {fmtDate(customer.followUpDate)}</strong>
                  <p>{customer.followUpNote}</p>
                </div>
              </div>
            )}
            <label>
              Trạng thái
              <select
                aria-label="Trạng thái"
                value={care}
                onChange={(e) => setCare(e.target.value as CareStatus)}
              >
                {Object.entries(careLabels).map(([key, value]) => (
                  <option value={key} key={key}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ghi nhận liên hệ
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nội dung cuộc gọi, phản hồi của khách…"
                rows={3}
              />
            </label>
            <button
              className="button secondary"
              disabled={crm.busy}
              onClick={() => void logCare()}
            >
              <Check size={16} />
              Lưu chăm sóc
            </button>
          </section>
          {savedSignature && (
            <section className="profile-section">
              <h4>
                {signature ? "Dịch vụ chữ ký số" : "Thông tin chữ ký số đã lưu"}
              </h4>
              <dl className="detail-grid">
                {[
                  ["Ngày cấp", fmtDate(customer.issueDate)],
                  ["Ngày hết hạn", fmtDate(customer.expireDate)],
                  ["Gói dịch vụ", pkgLabel(customer.pkg)],
                  ["Giá hiện tại", money(customer.price)],
                  ["Tổng giá trị giao dịch", money(lifetimeValue(customer))],
                  ["Số giao dịch", String(history.length)],
                ].map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          {additionalDatedServices
            .filter((service) => servicesOf(customer).includes(service.id))
            .map((service) => (
              <section
                className="profile-section service-period-detail"
                key={service.id}
              >
                <h4>{service.label}</h4>
                <dl className="detail-grid">
                  <div>
                    <dt>Ngày bắt đầu</dt>
                    <dd>
                      {fmtDate(
                        customer.servicePeriods?.[service.id]?.startDate,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Ngày hết hạn</dt>
                    <dd>
                      {fmtDate(customer.servicePeriods?.[service.id]?.endDate)}
                    </dd>
                  </div>
                </dl>
                <ExpiryBadge customer={customer} service={service.id} />
              </section>
            ))}
          <section className="profile-section">
            <h4>Thông tin liên hệ</h4>
            <dl className="detail-grid">
              {[
                ["Người liên hệ", customer.contact],
                ["Điện thoại / Email", customer.phone],
                ["Mã số thuế / CCCD", customer.mst],
                ["Công ty", customer.bizName],
                ["Địa chỉ", customer.address],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value || "—"}</dd>
                </div>
              ))}
            </dl>
            {customer.note && (
              <div className="note-block">
                <strong>Ghi chú</strong>
                <p>{customer.note}</p>
              </div>
            )}
            {customer.note2 && (
              <div className="note-block">
                <strong>Nhà cung cấp</strong>
                <p>{customer.note2}</p>
              </div>
            )}
          </section>
          <section className="profile-section">
            <h4>Lịch sử giao dịch & chăm sóc</h4>
            {!timeline.length && <p className="muted">Chưa có lịch sử.</p>}
            <ol className="timeline">
              {timeline.map((item) => (
                <li key={item.key}>
                  <small>{fmtDate(item.date)}</small>
                  <strong>{item.title}</strong>
                  {item.body && <p className="pre-wrap">{item.body}</p>}
                  {item.expire && <p>Hết hạn: {fmtDate(item.expire)}</p>}
                  {item.note && <p className="muted">{item.note}</p>}
                </li>
              ))}
            </ol>
          </section>
          <section className="profile-section">
            <button
              className="text-button danger-text"
              onClick={() => setMode("delete")}
            >
              <Trash2 size={16} />
              Xóa khách hàng
            </button>
          </section>
          {mode === "delete" && (
            <div className="alert error">
              <div>
                <strong>Xóa {customer.name}?</strong>
                <p>Thao tác xóa vĩnh viễn. Nhập XOA để xác nhận.</p>
                <input
                  aria-label="Nhập XOA để xóa khách"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                />
                <div className="inline-actions">
                  <button
                    className="button secondary"
                    onClick={() => setMode("view")}
                  >
                    Hủy
                  </button>
                  <button
                    className="button danger"
                    disabled={deleteText !== "XOA" || crm.busy}
                    onClick={async () => {
                      try {
                        await crm.batch([{ id: customer.id, remove: true }]);
                        onClose();
                      } catch (e) {
                        setError(readableError(e));
                      }
                    }}
                  >
                    Xóa vĩnh viễn
                  </button>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
