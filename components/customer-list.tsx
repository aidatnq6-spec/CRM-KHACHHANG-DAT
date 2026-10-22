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
  daysLeft,
  fmtDate,
  matchesSearch,
  pkgLabel,
  phoneDigits,
  statusOf,
} from "@/lib/domain";
import type { Customer } from "@/lib/types";
import { CareBadge, Empty, ExpiryBadge } from "./ui";
export default function CustomerList({
  rows,
  onOpen,
  selected,
  onSelect,
  onZalo,
  showStatus = false,
}: {
  rows: Customer[];
  onOpen: (id: string) => void;
  selected: Set<string>;
  onSelect: (ids: string[], select: boolean) => void;
  onZalo: (k: Customer) => void;
  showStatus?: boolean;
}) {
  const [query, setQuery] = useState(""),
    [care, setCare] = useState(""),
    [pkg, setPkg] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [filters, setFilters] = useState(false);
  const packages = [...new Set(rows.map((k) => pkgLabel(k.pkg)))].sort();
  const filtered = rows.filter(
    (k) =>
      matchesSearch(k, query) &&
      (!care || careOf(k) === care) &&
      (!pkg || pkgLabel(k.pkg) === pkg) &&
      (!status || statusOf(k) === status),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 15)),
    current = Math.min(page, pages),
    shown = filtered.slice((current - 1) * 15, current * 15);
  const all = shown.length > 0 && shown.every((k) => selected.has(k.id));
  const active = !!(care || pkg || status || query);
  function reset() {
    setQuery("");
    setCare("");
    setPkg("");
    setStatus("");
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
              setPage(1);
            }}
          />
          {query && (
            <button
              className="icon-button"
              aria-label="Xóa tìm kiếm"
              onClick={() => {
                setQuery("");
                setPage(1);
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
          Bộ lọc{(care || pkg || status) && <span className="filter-dot" />}
        </button>
        <div className={`list-filters ${filters ? "open" : ""}`}>
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
              setPage(1);
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
                setPage(1);
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
      <div className="list-caption">
        <span>
          <strong>{filtered.length}</strong> khách hàng
          {active ? " phù hợp" : ""}
        </span>
        {active ? (
          <button className="text-button" onClick={reset}>
            Xóa bộ lọc
          </button>
        ) : (
          <span className="muted sort-label">
            <ArrowDown size={13} /> Theo thứ tự ưu tiên
          </span>
        )}
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
                  <th>Ngày hết hạn</th>
                  <th>Chăm sóc</th>
                  <th className="right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((k) => (
                  <tr
                    key={k.id}
                    data-urgency={urgencyOf(k)}
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
                            {k.customId || "Chưa có mã"} · {pkgLabel(k.pkg)}
                          </small>
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
                      <span className="date-text">{fmtDate(k.expireDate)}</span>
                      <div>
                        <ExpiryBadge customer={k} />
                      </div>
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
                data-urgency={urgencyOf(k)}
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
                  {k.customId || "Chưa có mã"} · {pkgLabel(k.pkg)}
                </div>
                <div className="card-dates">
                  <span>
                    Hết hạn <strong>{fmtDate(k.expireDate)}</strong>
                  </span>
                  <ExpiryBadge customer={k} />
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

function urgencyOf(customer: Customer) {
  if (customer.status === "inactive") return "quiet";
  const days = daysLeft(customer.expireDate);
  return days === null
    ? "unknown"
    : days < 0
      ? "expired"
      : days <= 7
        ? "urgent"
        : "normal";
}
