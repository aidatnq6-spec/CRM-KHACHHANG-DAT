"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Clock3,
  Phone,
  PhoneCall,
} from "lucide-react";
import {
  careLabels,
  careOf,
  dateAfter,
  daysLeft,
  fmtDate,
  nextFollowUp,
  phoneDigits,
  todayVN,
} from "@/lib/domain";
import {
  lastContact,
  matchesWorkFilter,
  workQueue,
  type WorkFilter,
  type WorkItem,
} from "@/lib/work-queue";
import type { Customer } from "@/lib/types";
import { readableError, useCRM } from "./crm-provider";
import { CareBadge, Empty } from "./ui";
import { Stats } from "./reports";

const filters: { id: WorkFilter; label: string }[] = [
  { id: "all", label: "Cần làm" },
  { id: "overdue", label: "Quá hẹn" },
  { id: "today", label: "Hẹn hôm nay" },
  { id: "upcoming", label: "Sắp đến hẹn" },
  { id: "expired", label: "CKS hết hạn" },
  { id: "urgent", label: "CKS còn ≤7 ngày" },
  { id: "waiting", label: "Chờ phản hồi" },
];
const contactDate = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
type Advance = {
  processed: string;
  candidates: string[];
  top: number;
  date: string;
};

export default function TodayWorkspace({
  today,
  onOpen,
  onZalo,
  overlayOpen,
  initialFilter = "all",
}: {
  today: string;
  onOpen: (id: string) => void;
  onZalo: (customer: Customer) => void;
  overlayOpen: boolean;
  initialFilter?: WorkFilter;
}) {
  const crm = useCRM();
  const [filter, setFilter] = useState<WorkFilter>(initialFilter);
  const [currentId, setCurrentId] = useState("");
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [failure, setFailure] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [result, setResult] = useState("");
  const [handled, setHandled] = useState(0);
  const [held, setHeld] = useState<{ item: WorkItem; index: number } | null>(
    null,
  );
  const lock = useRef(false);
  const rows = useRef(new Map<string, HTMLElement>());
  const listHeading = useRef<HTMLHeadingElement>(null);
  const advance = useRef<Advance | null>(null);
  const returnAnchor = useRef<Advance | null>(null);
  const liveQueue = useMemo(
    () => workQueue(crm.rows, today),
    [crm.rows, today],
  );
  const queue = useMemo(() => {
    if (!held) return liveQueue;
    // Firestore can emit a local snapshot before the write is acknowledged.
    // Keep the active card and its form mounted until success, or for retry.
    const next = liveQueue.filter(
      (item) => item.customer.id !== held.item.customer.id,
    );
    next.splice(Math.min(held.index, next.length), 0, held.item);
    return next;
  }, [liveQueue, held]);
  const visible = useMemo(
    () => queue.filter((item) => matchesWorkFilter(item, filter)),
    [queue, filter],
  );
  const current = visible.some((item) => item.customer.id === currentId)
    ? currentId
    : visible[0]?.customer.id;
  const count = (id: WorkFilter) =>
    queue.filter((item) => matchesWorkFilter(item, id)).length;

  useLayoutEffect(() => {
    if (overlayOpen) return;
    if (returnAnchor.current) {
      const returned = returnAnchor.current;
      returnAnchor.current = null;
      if (!visible.some((item) => item.customer.id === returned.processed)) {
        const saved = crm.rows.find(
          (customer) => customer.id === returned.processed,
        );
        advance.current = { ...returned, date: saved?.followUpDate || "" };
      }
    }
    const next = advance.current;
    if (!next) return;
    const saved = crm.rows.find((customer) => customer.id === next.processed);
    // Wait for the committed snapshot before moving focus or the scroll anchor.
    if (saved && saved.followUpDate !== next.date) return;
    advance.current = null;
    const remaining = new Set(visible.map((item) => item.customer.id));
    const id =
      next.candidates.find((candidate) => remaining.has(candidate)) ||
      visible.find((item) => item.customer.id !== next.processed)?.customer.id;
    const element = id ? rows.current.get(id) : null;
    if (element) {
      element
        .querySelector<HTMLButtonElement>(".customer-name")
        ?.focus({ preventScroll: true });
      const minimumTop = window.innerWidth <= 900 ? 80 : 16;
      window.scrollBy({
        top:
          element.getBoundingClientRect().top - Math.max(minimumTop, next.top),
        behavior: "instant",
      });
    } else {
      listHeading.current?.focus({ preventScroll: true });
      listHeading.current?.scrollIntoView({
        block: "nearest",
        behavior: "instant",
      });
    }
  }, [crm.rows, result, visible, overlayOpen]);

  function chooseFilter(next: WorkFilter) {
    if (lock.current || crm.busy) return;
    setFilter(next);
    setScheduleId(null);
    setFailure(null);
    setCurrentId("");
    setHeld(null);
  }
  function anchorFor(customer: Customer, date = ""): Advance {
    const index = visible.findIndex(
      (entry) => entry.customer.id === customer.id,
    );
    return {
      processed: customer.id,
      candidates: [
        ...visible.slice(index + 1),
        ...visible.slice(0, index).reverse(),
      ].map((entry) => entry.customer.id),
      top: rows.current.get(customer.id)?.getBoundingClientRect().top ?? 80,
      date,
    };
  }
  function openCustomer(customer: Customer, zalo = false) {
    setHeld(null);
    setFailure(null);
    returnAnchor.current = anchorFor(customer);
    if (zalo) onZalo(customer);
    else onOpen(customer.id);
  }

  async function complete(
    item: WorkItem,
    action: "called" | "waiting" | "schedule",
    date?: string,
    note?: string,
  ) {
    if (lock.current || crm.busy) return false;
    lock.current = true;
    const customer = item.customer;
    const anchor = anchorFor(
      customer,
      date ||
        String(
          nextFollowUp(action as "called" | "waiting", todayVN())
            ?.followUpDate || "",
        ),
    );
    setPendingId(customer.id);
    setHeld({
      item,
      index: queue.findIndex((entry) => entry.customer.id === customer.id),
    });
    setFailure(null);
    setResult("");
    try {
      if (action === "schedule")
        await crm.reschedule(customer.id, date!, note!);
      else
        await crm.care(
          customer.id,
          action,
          notes[customer.id]?.trim() || undefined,
        );
      advance.current = anchor;
      setHeld(null);
      setScheduleId(null);
      setNotes((previous) => {
        const next = { ...previous };
        delete next[customer.id];
        return next;
      });
      setHandled((value) => value + 1);
      setResult(
        `${action === "schedule" ? "Đã hẹn lại" : action === "called" ? "Đã ghi nhận cuộc gọi" : "Đã ghi nhận chờ phản hồi"} cho ${customer.name}. Hẹn tiếp ${fmtDate(anchor.date)}.`,
      );
      return true;
    } catch (error) {
      setFailure({ id: customer.id, message: readableError(error) });
      return false;
    } finally {
      lock.current = false;
      setPendingId(null);
    }
  }

  return (
    <div className="today-workspace">
      <Stats
        items={[
          {
            label: "Khách cần xử lý",
            value: count("all"),
            detail: "Mỗi khách xuất hiện một lần",
            onClick: () => chooseFilter("all"),
          },
          {
            label: "Quá hẹn",
            value: count("overdue"),
            detail: "Ưu tiên liên hệ lại",
            accent: "red-stat",
            onClick: () => chooseFilter("overdue"),
          },
          {
            label: "Hẹn hôm nay",
            value: count("today"),
            detail: "Theo lịch Việt Nam",
            accent: "amber-stat",
            onClick: () => chooseFilter("today"),
          },
          {
            label: "Sắp đến hẹn",
            value: count("upcoming"),
            detail: "Từ ngày mai đến 7 ngày tới",
            onClick: () => chooseFilter("upcoming"),
          },
        ]}
      />
      <div
        className="filter-chips today-filters"
        role="group"
        aria-label="Lọc công việc"
      >
        {filters.map((item) => (
          <button
            key={item.id}
            aria-pressed={filter === item.id}
            className={filter === item.id ? "active" : ""}
            disabled={crm.busy}
            onClick={() => chooseFilter(item.id)}
          >
            {item.label}
            <span>{count(item.id)}</span>
          </button>
        ))}
      </div>
      <div className="today-list-heading">
        <h2 ref={listHeading} tabIndex={-1}>
          {filters.find((item) => item.id === filter)!.label}{" "}
          <span>· {visible.length} khách</span>
        </h2>
        <span>
          {handled
            ? `Đã xử lý ${handled} lượt trong phiên này`
            : "Ghi nhận xong sẽ chuyển đến khách tiếp theo"}
        </span>
      </div>
      {filter === "upcoming" && (
        <p className="today-scope">
          Lịch hẹn trong 7 ngày tới. Khách sẽ trở lại “Cần làm” khi đến ngày
          hẹn.
        </p>
      )}
      <div className="today-result" role="status" aria-atomic="true">
        {result && (
          <>
            <Check size={17} aria-hidden="true" />
            {result}
          </>
        )}
      </div>
      <div className="today-list">
        {!visible.length ? (
          <Empty
            title={
              filter === "upcoming"
                ? "Chưa có lịch hẹn trong 7 ngày tới"
                : "Không còn khách cần xử lý trong nhóm này"
            }
            detail="Bộ lọc hiện tại được giữ nguyên. Bạn có thể chọn nhóm khác để tiếp tục."
          >
            {filter !== "all" && (
              <button
                className="button secondary"
                onClick={() => chooseFilter("all")}
              >
                Xem khách cần làm
              </button>
            )}
          </Empty>
        ) : (
          visible.map((item) => {
            const customer = item.customer;
            const contact = lastContact(customer);
            const appointmentDays = daysLeft(customer.followUpDate, today);
            const pending = pendingId === customer.id;
            return (
              <article
                key={customer.id}
                className={`work-card ${current === customer.id ? "is-current" : ""}`}
                data-customer-id={customer.id}
                ref={(element) => {
                  if (element) rows.current.set(customer.id, element);
                  else rows.current.delete(customer.id);
                }}
                onFocus={() => setCurrentId(customer.id)}
                aria-label={`Công việc của ${customer.name}`}
                aria-busy={pending}
              >
                <div className="work-card-heading">
                  <div className="work-identity">
                    <span className="work-symbol">
                      <CalendarClock size={21} aria-hidden="true" />
                    </span>
                    <div>
                      <button
                        className="customer-name"
                        onClick={() => openCustomer(customer)}
                      >
                        {customer.name}
                      </button>
                      <small>
                        {customer.customId || "Chưa có mã"}
                        {customer.contact ? ` · ${customer.contact}` : ""}
                      </small>
                    </div>
                  </div>
                  <CareBadge customer={customer} />
                </div>
                <div className="work-priority">
                  {item.appointment !== "none" && (
                    <span className={`badge appointment-${item.appointment}`}>
                      <Clock3 size={14} aria-hidden="true" />
                      {item.appointment === "overdue"
                        ? `Quá hẹn ${-(appointmentDays || 0)} ngày`
                        : item.appointment === "today"
                          ? "Hẹn hôm nay"
                          : `Sắp đến hẹn · ${appointmentDays} ngày`}
                    </span>
                  )}
                  {current === customer.id && (
                    <span className="work-current">
                      <ArrowRight size={14} aria-hidden="true" /> Đang xử lý
                    </span>
                  )}
                </div>
                {item.reasons.length > 0 && (
                  <ul className="work-reasons" aria-label="Lý do ưu tiên">
                    {item.reasons.map((reason) => (
                      <li key={reason.type}>
                        {reason.title}
                        {reason.type === "expired" ? ` · ${reason.detail}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
                <dl className="work-context">
                  <div>
                    <dt>Liên hệ gần nhất</dt>
                    <dd>
                      {contact ? (
                        <>
                          <time dateTime={contact.at}>
                            {contactDate.format(new Date(contact.at))}
                          </time>
                          {contact.note && <span>{contact.note}</span>}
                        </>
                      ) : (
                        "Chưa ghi nhận liên hệ"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      {item.appointment === "overdue" ||
                      item.appointment === "today"
                        ? "Lịch hẹn cần xử lý"
                        : "Lần liên hệ tiếp theo"}
                    </dt>
                    <dd>
                      {customer.followUpDate ? (
                        <>
                          <strong>{fmtDate(customer.followUpDate)}</strong>
                          <span>
                            {customer.followUpNote ||
                              "Chưa có nội dung lịch hẹn"}
                          </span>
                        </>
                      ) : (
                        <>
                          <strong>Chưa đặt lịch</strong>
                          <span>
                            {item.reasons.some(
                              (reason) => reason.type === "expired",
                            )
                              ? "Liên hệ để hỗ trợ gia hạn CKS đã hết hạn."
                              : "Liên hệ và ghi nhận kết quả để đặt lịch tiếp theo."}
                          </span>
                        </>
                      )}
                    </dd>
                  </div>
                </dl>
                <details className="work-note">
                  <summary>
                    Ghi chú nhanh <span>(không bắt buộc)</span>
                  </summary>
                  <label>
                    Phản hồi của khách
                    <textarea
                      aria-label="Phản hồi của khách"
                      rows={2}
                      maxLength={2000}
                      value={notes[customer.id] || ""}
                      disabled={crm.busy}
                      onChange={(event) =>
                        setNotes((previous) => ({
                          ...previous,
                          [customer.id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                </details>
                {failure?.id === customer.id && (
                  <div className="alert error" role="alert">
                    Chưa lưu được. {failure.message} Thông tin nhập được giữ lại
                    để bạn thử lại.
                  </div>
                )}
                <p className="work-action-hint">
                  Đã gọi: hẹn sau 3 ngày · Chờ phản hồi: hẹn sau 1 ngày.
                </p>
                <div className="work-actions">
                  <div className="work-quick-actions">
                    <button
                      className="button primary"
                      disabled={crm.busy}
                      onClick={() => void complete(item, "called")}
                      title="Ghi nhận đã gọi và hẹn lại sau 3 ngày"
                    >
                      <PhoneCall size={16} aria-hidden="true" />
                      Đã gọi
                    </button>
                    <button
                      className="button secondary"
                      disabled={crm.busy}
                      onClick={() => void complete(item, "waiting")}
                      title="Ghi nhận chờ phản hồi và hẹn lại sau 1 ngày"
                    >
                      Chờ phản hồi
                    </button>
                    <button
                      className="button secondary"
                      aria-expanded={scheduleId === customer.id}
                      disabled={crm.busy}
                      onClick={() =>
                        setScheduleId(
                          scheduleId === customer.id ? null : customer.id,
                        )
                      }
                    >
                      <CalendarClock size={16} aria-hidden="true" />
                      Hẹn lại
                    </button>
                  </div>
                  <div className="work-contact-actions">
                    {phoneDigits(customer.phone) && (
                      <a
                        className="button secondary"
                        href={`tel:${phoneDigits(customer.phone)}`}
                        aria-label={`Gọi điện cho ${customer.name}`}
                      >
                        <Phone size={16} aria-hidden="true" />
                        Gọi điện
                      </a>
                    )}
                    <button
                      className="button zalo"
                      disabled={crm.busy}
                      onClick={() => openCustomer(customer, true)}
                    >
                      Soạn Zalo
                    </button>
                    <button
                      className="text-button"
                      onClick={() => openCustomer(customer)}
                    >
                      Hồ sơ <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {pending && (
                  <p className="work-saving" role="status">
                    Đang lưu và cập nhật lịch hẹn…
                  </p>
                )}
                {scheduleId === customer.id && (
                  <ScheduleForm
                    key={customer.id}
                    customer={customer}
                    today={today}
                    busy={crm.busy}
                    onCancel={() => setScheduleId(null)}
                    onSave={(date, note) =>
                      complete(item, "schedule", date, note)
                    }
                  />
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

function ScheduleForm({
  customer,
  today,
  busy,
  onCancel,
  onSave,
}: {
  customer: Customer;
  today: string;
  busy: boolean;
  onCancel: () => void;
  onSave: (date: string, note: string) => Promise<boolean>;
}) {
  const [date, setDate] = useState(dateAfter(1, today));
  const [note, setNote] = useState(customer.followUpNote || "");
  const [error, setError] = useState("");
  const dateInput = useRef<HTMLInputElement>(null);
  const noteInput = useRef<HTMLTextAreaElement>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if ((daysLeft(date, todayVN()) ?? 0) < 1) {
      setError("Chọn ngày hẹn từ ngày mai trở đi.");
      dateInput.current?.focus();
      return;
    }
    if (!note.trim()) {
      setError("Nhập nội dung cần trao đổi trong lần hẹn tiếp theo.");
      noteInput.current?.focus();
      return;
    }
    setError("");
    await onSave(date, note);
  }
  return (
    <form
      className="work-schedule"
      aria-label={`Hẹn lại ${customer.name}`}
      onSubmit={(event) => void submit(event)}
      noValidate
    >
      <h3>Hẹn lần liên hệ tiếp theo</h3>
      <p>
        Giữ trạng thái “{careLabels[careOf(customer)]}”. Khách tạm rời “Cần làm”
        đến ngày hẹn.
      </p>
      <div className="work-schedule-fields">
        <label>
          Ngày hẹn
          <input
            aria-label="Ngày hẹn"
            ref={dateInput}
            autoFocus
            type="date"
            min={dateAfter(1, today)}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            disabled={busy}
            required
          />
        </label>
        <label>
          Nội dung hẹn
          <textarea
            aria-label="Nội dung hẹn"
            ref={noteInput}
            rows={2}
            maxLength={2000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={busy}
            required
          />
        </label>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="inline-actions">
        <button className="button primary" disabled={busy}>
          Lưu lịch hẹn
        </button>
        <button
          className="button secondary"
          type="button"
          disabled={busy}
          onClick={onCancel}
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
