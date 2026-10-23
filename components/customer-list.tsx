"use client";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Phone,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  careLabels,
  careOf,
  fmtDate,
  matchesSearch,
  pkgLabel,
  phoneDigits,
  todayVN,
  matchingDeadlines,
  deadlineStatus,
  type DeadlineRange,
} from "@/lib/domain";
import type { Customer } from "@/lib/types";
import { CareBadge, Empty } from "./ui";
import {
  hasSignature,
  isServiceId,
  serviceCatalog,
  serviceLabel,
  servicesOf,
} from "@/lib/services";
import CustomerServices from "./customer-services";
import ServiceDeadlines from "./service-deadlines";
export default function CustomerList({
  rows,
  onOpen,
  selected,
  onSelect,
  onZalo,
  showStatus = false,
  care,
  onCareChange,
  sortLabel,
  deadlineRange,
  initialService = "",
}: {
  rows: Customer[];
  onOpen: (id: string) => void;
  selected: Set<string>;
  onSelect: (ids: string[], select: boolean) => void;
  onZalo: (k: Customer) => void;
  showStatus?: boolean;
  care: string;
  onCareChange: (value: string) => void;
  sortLabel: string;
  deadlineRange?: DeadlineRange;
  initialService?: string;
}) {
  const [query, setQuery] = useState(""),
    [service, setService] = useState(initialService),
    [pkg, setPkg] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [filters, setFilters] = useState(false),
    [expiresToday, setExpiresToday] = useState(false),
    [appointments, setAppointments] = useState(false);
  const today = todayVN();
  function clearSelection() {
    onSelect([...selected], false);
    setPage(1);
  }
  function setCare(value: string) {
    onCareChange(value);
    clearSelection();
  }
  const packages = [...new Set(rows.map((k) => pkgLabel(k.pkg)))].sort();
  const filtered = rows.filter(
    (k) =>
      matchesSearch(k, query) &&
      (!care || careOf(k) === care) &&
      (!pkg || pkgLabel(k.pkg) === pkg) &&
      (!status ||
        deadlineStatus(
          k,
          today,
          isServiceId(service) ? service : undefined,
          deadlineRange,
        ) === status) &&
      (!service ||
        (service === "unclassified"
          ? servicesOf(k).length === 0
          : isServiceId(service) && servicesOf(k).includes(service))) &&
      (deadlineRange === undefined ||
        matchingDeadlines(k, today, deadlineRange, service || undefined)
          .length > 0) &&
      (!expiresToday ||
        matchingDeadlines(k, today, 0, service || undefined).length > 0) &&
      (!appointments || !!(k.followUpDate && k.followUpDate <= today)),
  );
  if (deadlineRange !== undefined)
    filtered.sort(
      (a, b) =>
        matchingDeadlines(a, today, deadlineRange, service || undefined)[0]
          .days -
          matchingDeadlines(b, today, deadlineRange, service || undefined)[0]
            .days || a.name.localeCompare(b.name, "vi"),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 15)),
    current = Math.min(page, pages),
    shown = filtered.slice((current - 1) * 15, current * 15);
  const all = shown.length > 0 && shown.every((k) => selected.has(k.id));
  const active = !!(
    care ||
    pkg ||
    status ||
    query ||
    service ||
    expiresToday ||
    appointments
  );
  function reset() {
    setQuery("");
    setCare("");
    setPkg("");
    setStatus("");
    setService("");
    setExpiresToday(false);
    setAppointments(false);
    clearSelection();
    setPage(1);
  }
  return (
    <section className="list-panel">
      <div className="list-toolbar">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Tìm khách hàng"
            placeholder="Tìm tên, công ty, số điện thoại, MST…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              clearSelection();
            }}
          />
          {query && (
            <button
              className="icon-button"
              aria-label="Xóa tìm kiếm"
              onClick={() => {
                setQuery("");
                clearSelection();
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          className={`button secondary filter-toggle ${filters ? "is-active" : ""}`}
          onClick={() => setFilters(!filters)}
          aria-expanded={filters}
        >
          <SlidersHorizontal size={17} />
          Bộ lọc
          {(care || pkg || status || service) && (
            <span className="filter-dot" />
          )}
        </button>
        <div className={`list-filters ${filters ? "open" : ""}`}>
          <label className="sr-only" htmlFor="filter-service">
            Dịch vụ
          </label>
          <select
            id="filter-service"
            value={service}
            onChange={(event) => {
              setService(event.target.value);
              clearSelection();
            }}
          >
            <option value="">Tất cả dịch vụ</option>
            {serviceCatalog.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
            <option value="unclassified">Chưa phân loại</option>
          </select>
          <label className="sr-only" htmlFor="filter-care">
            Trạng thái chăm sóc
          </label>
          <select
            id="filter-care"
            value={care}
            onChange={(e) => {
              setCare(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả chăm sóc</option>
            {Object.entries(careLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="filter-package">
            Gói dịch vụ
          </label>
          <select
            id="filter-package"
            value={pkg}
            onChange={(e) => {
              setPkg(e.target.value);
              clearSelection();
            }}
          >
            <option value="">Tất cả gói</option>
            {packages.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          {showStatus && (
            <select
              aria-label="Trạng thái hoạt động"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                clearSelection();
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Còn hạn</option>
              <option value="expiring">Sắp hết hạn</option>
              <option value="expired">Đã hết hạn</option>
              <option value="inactive">Ngừng hoạt động</option>
              <option value="unknown">Chưa rõ hạn</option>
            </select>
          )}
        </div>
      </div>
      <div
        className="quick-filters"
        role="group"
        aria-label="Lọc nhanh khách hàng"
      >
        <button
          aria-pressed={care === "not_contacted"}
          onClick={() =>
            setCare(care === "not_contacted" ? "" : "not_contacted")
          }
        >
          Chưa liên hệ
        </button>
        <button
          aria-pressed={expiresToday}
          onClick={() => {
            setExpiresToday(!expiresToday);
            clearSelection();
          }}
        >
          Hết hạn hôm nay
        </button>
        <button
          aria-pressed={appointments}
          onClick={() => {
            setAppointments(!appointments);
            clearSelection();
          }}
        >
          Lịch hẹn đến hạn
        </button>
      </div>
      {active && (
        <div className="active-filters" aria-label="Bộ lọc đang áp dụng">
          {[
            query && { label: `Tìm: ${query}`, clear: () => setQuery("") },
            care && {
              label: careLabels[care as keyof typeof careLabels],
              clear: () => setCare(""),
            },
            pkg && { label: pkg, clear: () => setPkg("") },
            service && {
              label: isServiceId(service)
                ? serviceLabel(service)
                : "Chưa phân loại",
              clear: () => setService(""),
            },
            status && {
              label: {
                active: "Còn hạn",
                expiring: "Sắp hết hạn",
                expired: "Đã hết hạn",
                inactive: "Ngừng hoạt động",
                unknown: "Chưa rõ hạn",
              }[status],
              clear: () => setStatus(""),
            },
            expiresToday && {
              label: "Hết hạn hôm nay",
              clear: () => setExpiresToday(false),
            },
            appointments && {
              label: "Lịch hẹn đến hạn",
              clear: () => setAppointments(false),
            },
          ]
            .filter(Boolean)
            .map(
              (item) =>
                item && (
                  <button
                    key={item.label}
                    aria-label={`Bỏ lọc ${item.label}`}
                    onClick={() => {
                      item.clear();
                      clearSelection();
                    }}
                  >
                    {item.label}
                    <X size={14} />
                  </button>
                ),
            )}
        </div>
      )}
      <div className="list-caption">
        <span role="status">
          <strong>{filtered.length}</strong> khách hàng
          {active ? " phù hợp" : ""}
        </span>
        <div className="caption-actions">
          {active && (
            <button className="text-button" onClick={reset}>
              Xóa bộ lọc
            </button>
          )}
          <span className="muted sort-label">
            <ArrowDown size={13} /> {sortLabel}
          </span>
        </div>
      </div>
      {!shown.length ? (
        <Empty>
          {active && (
            <button className="button secondary" onClick={reset}>
              Xóa bộ lọc
            </button>
          )}
        </Empty>
      ) : (
        <>
          <div className="desktop-table">
            <table>
              <thead>
                <tr>
                  <th className="check-cell">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả trang hiện tại"
                      checked={all}
                      onChange={(e) =>
                        onSelect(
                          shown.map((k) => k.id),
                          e.target.checked,
                        )
                      }
                    />
                  </th>
                  <th>Khách hàng</th>
                  <th>Liên hệ</th>
                  <th>Hạn dịch vụ</th>
                  <th>Chăm sóc</th>
                  <th className="right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((k) => (
                  <tr
                    key={k.id}
                    data-urgency={urgencyOf(
                      k,
                      deadlineRange,
                      service || undefined,
                    )}
                    className={selected.has(k.id) ? "selected" : ""}
                  >
                    <td className="check-cell">
                      <input
                        type="checkbox"
                        aria-label={`Chọn ${k.name}`}
                        checked={selected.has(k.id)}
                        onChange={(e) => onSelect([k.id], e.target.checked)}
                      />
                    </td>
                    <td className="identity-cell">
                      <div className="customer-identity">
                        <span className="customer-initial" aria-hidden="true">
                          {k.name.trim().charAt(0).toUpperCase() || "K"}
                        </span>
                        <div>
                          <button
                            className="customer-name"
                            onClick={() => onOpen(k.id)}
                          >
                            {k.name || "Chưa có tên"}
                          </button>
                          <small>
                            {k.customId || "Chưa có mã"}
                            {hasSignature(k) ? ` · ${pkgLabel(k.pkg)}` : ""}
                          </small>
                          <CustomerServices
                            customer={k}
                            compact
                            selectedService={service}
                            onShow={() => onOpen(k.id)}
                          />
                          {k.bizName && k.bizName !== k.name && (
                            <small>{k.bizName}</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span>{k.contact || "—"}</span>
                      <small>{k.phone || "Chưa có liên hệ"}</small>
                    </td>
                    <td>
                      <ServiceDeadlines
                        customer={k}
                        service={service || undefined}
                        range={deadlineRange}
                      />
                    </td>
                    <td>
                      <CareBadge customer={k} />
                      {k.followUpDate && (
                        <small>Hẹn {fmtDate(k.followUpDate)}</small>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        {phoneDigits(k.phone) && (
                          <a
                            className="icon-button"
                            href={`tel:${phoneDigits(k.phone)}`}
                            aria-label={`Gọi ${k.name}`}
                          >
                            <Phone size={17} />
                          </a>
                        )}
                        <button
                          className="zalo-button"
                          onClick={() => onZalo(k)}
                          aria-label={`Soạn Zalo cho ${k.name}`}
                        >
                          Zalo
                        </button>
                        <button
                          className="icon-button"
                          onClick={() => onOpen(k.id)}
                          aria-label={`Xem ${k.name}`}
                        >
                          <ArrowUpRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-cards">
            {shown.map((k) => (
              <article
                className={`customer-card ${selected.has(k.id) ? "selected" : ""}`}
                key={k.id}
                data-urgency={urgencyOf(k, deadlineRange, service || undefined)}
              >
                <div className="card-heading">
                  <input
                    type="checkbox"
                    aria-label={`Chọn ${k.name}`}
                    checked={selected.has(k.id)}
                    onChange={(e) => onSelect([k.id], e.target.checked)}
                  />
                  <button
                    className="customer-name"
                    onClick={() => onOpen(k.id)}
                  >
                    {k.name}
                  </button>
                  <ArrowUpRight size={17} />
                </div>
                <div className="card-subtitle">
                  {k.customId || "Chưa có mã"}
                  {hasSignature(k) ? ` · ${pkgLabel(k.pkg)}` : ""}
                </div>
                <CustomerServices
                  customer={k}
                  compact
                  selectedService={service}
                  onShow={() => onOpen(k.id)}
                />
                <div className="card-dates">
                  <ServiceDeadlines
                    customer={k}
                    service={service || undefined}
                    range={deadlineRange}
                  />
                </div>
                <CareBadge customer={k} />
                {k.followUpDate && <small>Hẹn {fmtDate(k.followUpDate)}</small>}
                <div className="card-actions">
                  {phoneDigits(k.phone) ? (
                    <a
                      className="button secondary"
                      href={`tel:${phoneDigits(k.phone)}`}
                    >
                      <Phone size={16} />
                      {phoneDigits(k.phone)}
                    </a>
                  ) : (
                    <span className="muted">Chưa có SĐT</span>
                  )}
                  <button className="button zalo" onClick={() => onZalo(k)}>
                    Soạn Zalo
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => onOpen(k.id)}
                  >
                    Hồ sơ
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <div className="pagination">
        <span>
          {filtered.length
            ? `${(current - 1) * 15 + 1}–${Math.min(current * 15, filtered.length)} trong ${filtered.length} khách`
            : "0 khách hàng"}
        </span>
        <div>
          <button
            className="icon-button"
            aria-label="Trang trước"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <span>
            {current} / {pages}
          </span>
          <button
            className="icon-button"
            aria-label="Trang sau"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

function urgencyOf(
  customer: Customer,
  range?: DeadlineRange,
  service?: string,
) {
  if (customer.status === "inactive") return "quiet";
  const days =
    matchingDeadlines(customer, undefined, range, service)[0]?.days ?? null;
  return days === null
    ? "unknown"
    : days < 0
      ? "expired"
      : days <= 7
        ? "urgent"
        : "normal";
}
