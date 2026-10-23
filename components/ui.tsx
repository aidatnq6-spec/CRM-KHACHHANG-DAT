"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X, Inbox, LoaderCircle } from "lucide-react";
import {
  careLabels,
  careOf,
  daysLeft,
  statusLabels,
  statusOf,
  matchingDeadlines,
  deadlineStatus,
} from "@/lib/domain";
import type { Customer } from "@/lib/types";
import { hasSignature } from "@/lib/services";
export function Spinner({ label = "Đang tải dữ liệu…" }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={24} />
      <span>{label}</span>
    </div>
  );
}
export function Empty({
  title = "Không có khách hàng phù hợp",
  detail = "Thử đổi bộ lọc hoặc tìm kiếm bằng thông tin khác.",
  children,
}: {
  title?: string;
  detail?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Inbox size={30} />
      </span>
      <h3>{title}</h3>
      <p>{detail}</p>
      {children}
    </div>
  );
}
export function CareBadge({ customer }: { customer: Customer }) {
  const care = careOf(customer);
  return (
    <span className={`badge care-${care}`}>
      <i />
      {careLabels[care]}
    </span>
  );
}
export function ExpiryBadge({
  customer,
  service,
}: {
  customer: Customer;
  service?: string;
}) {
  if (service) {
    const period = matchingDeadlines(
      customer,
      undefined,
      undefined,
      service,
    )[0];
    const status = deadlineStatus(customer, undefined, service);
    return (
      <span
        className={`badge expiry-${status}${status === "expiring" && period && period.days <= 7 ? " is-urgent" : ""}`}
      >
        {status === "inactive"
          ? statusLabels.inactive
          : !period
            ? "Chưa có ngày hết hạn"
            : period.days < 0
              ? `Quá ${-period.days} ngày`
              : period.days === 0
                ? "Hết hạn hôm nay"
                : `Còn ${period.days} ngày`}
      </span>
    );
  }
  if (!hasSignature(customer))
    return <span className="badge expiry-unknown">Không dùng CKS</span>;
  const d = daysLeft(customer.expireDate),
    status = statusOf(customer);
  return (
    <span
      className={`badge expiry-${status}${status === "expiring" && d !== null && d <= 7 ? " is-urgent" : ""}`}
    >
      {status === "inactive" || d === null
        ? statusLabels[status]
        : d < 0
          ? `Quá ${-d} ngày`
          : d === 0
            ? "Hết hạn hôm nay"
            : `Còn ${d} ngày`}
    </span>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
  panel = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  panel?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current!,
      focused = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      focused?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`dialog ${wide ? "wide" : ""} ${panel ? "side-panel" : ""}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        if (
          e.target === e.currentTarget &&
          (e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom)
        )
          onClose();
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Đóng">
          <X size={21} />
        </button>
      </div>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
export function Confirm({
  title,
  children,
  onClose,
  onConfirm,
  busy,
  dangerous = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
  dangerous?: boolean;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="confirm-content">{children}</div>
      <div className="form-actions">
        <button className="button secondary" disabled={busy} onClick={onClose}>
          Hủy
        </button>
        <button
          className={`button ${dangerous ? "danger" : "primary"}`}
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? "Đang xử lý…" : "Xác nhận"}
        </button>
      </div>
    </Modal>
  );
}
