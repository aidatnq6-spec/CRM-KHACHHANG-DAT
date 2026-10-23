"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { careResults, dashboardData } from "@/lib/dashboard";
import { fmtDate, money } from "@/lib/domain";
import type { Customer } from "@/lib/types";
import { useCRM } from "./crm-provider";
import { Stats } from "./reports";
import { Empty } from "./ui";

const weekday = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short",
  timeZone: "UTC",
});

export default function Dashboard({
  today,
  onOpen,
  onOverdue,
  onReminders,
  onToday,
  onReports,
}: {
  today: string;
  onOpen: (id: string) => void;
  onOverdue: () => void;
  onReminders: (range: "7" | "30", care?: "not_contacted") => void;
  onToday: () => void;
  onReports: () => void;
}) {
  const { rows } = useCRM();
  const data = useMemo(() => dashboardData(rows, today), [rows, today]);
  const [selectedDay, setSelectedDay] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [resultGroup, setResultGroup] = useState<"contacted" | "renewed">(
    "contacted",
  );
  const results = useMemo(
    () => careResults(rows, period, today),
    [rows, period, today],
  );
  const day =
    data.calendar.find((entry) => entry.date === selectedDay) ||
    data.calendar[0];
  const month =
    data.months.find((entry) => entry.key === selectedMonth) || data.months[0];
  const maximum = Math.max(
    1,
    ...data.months.map((entry) => entry.customers.length),
  );
  const resultLabel =
    resultGroup === "contacted" ? "Khách đã liên hệ" : "Khách đã gia hạn";

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-toolbar">
        <span>Cập nhật theo dữ liệu hiện tại · {fmtDate(today)}</span>
        <button className="button secondary no-print" onClick={onReports}>
          Báo cáo chi tiết <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="dashboard-kpis">
        <Stats
          items={[
            {
              label: "Khách quá hẹn",
              value: data.overdue.length,
              detail: "Mở công việc quá hẹn",
              accent: "red-stat",
              onClick: onOverdue,
            },
            {
              label: "CKS hết hạn trong 7 ngày",
              value: data.soon7.length,
              detail: "Từ hôm nay đến ngày thứ 7",
              accent: "amber-stat",
              onClick: () => onReminders("7"),
            },
            {
              label: "Chưa liên hệ · Nhóm 30 ngày",
              value: data.uncontacted.length,
              detail: "Trong nhóm CKS sắp hết hạn",
              onClick: () => onReminders("30", "not_contacted"),
            },
            {
              label: "Giá trị dự kiến 30 ngày",
              value: money(data.forecast),
              detail: `${data.soon30.length} khách sắp hết hạn · Xem danh sách`,
              onClick: () => onReminders("30"),
            },
          ]}
        />
      </div>
      <p className="dashboard-estimate">
        Giá trị dự kiến tính theo giá gói hiện tại, không phải tiền đã thu.
        {data.missingPrice > 0 &&
          ` Có ${data.missingPrice} khách thiếu giá; tạm tính bằng giá trung bình của khách dùng chữ ký số.`}
      </p>
      {!rows.length && (
        <Empty
          title="Chưa có dữ liệu tổng quan"
          detail="Thêm hoặc nhập khách hàng để theo dõi kỳ hạn, lịch hẹn và kết quả chăm sóc."
        />
      )}
      <div className="dashboard-top-grid">
        <section
          className="content-panel dashboard-priority"
          aria-label="Ưu tiên hôm nay"
        >
          <div className="panel-heading">
            <div>
              <h3>Ưu tiên hôm nay</h3>
              <p>
                {data.totalPriority} khách cần xử lý · Hiển thị tối đa 5 khách
              </p>
            </div>
            <span className="dashboard-panel-icon">
              <CalendarClock size={20} aria-hidden="true" />
            </span>
          </div>
          {data.priority.length ? (
            <div className="dashboard-priority-list">
              {data.priority.map((item) => (
                <button
                  className="dashboard-customer-row"
                  key={item.customer.id}
                  onClick={() => onOpen(item.customer.id)}
                >
                  <div>
                    <strong>{item.customer.name}</strong>
                    <small
                      className={
                        item.appointment === "overdue" ? "danger-text" : ""
                      }
                    >
                      {item.title}
                    </small>
                    <span>{item.detail}</span>
                  </div>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">
              Không có khách cần ưu tiên hôm nay.
            </p>
          )}
          <button
            className="button primary dashboard-open-today no-print"
            onClick={onToday}
          >
            Mở công việc hôm nay <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
        <section
          className="content-panel dashboard-calendar"
          aria-label="Lịch hẹn 7 ngày"
        >
          <div className="panel-heading">
            <div>
              <h3>Lịch hẹn 7 ngày</h3>
              <p>Hôm nay và 6 ngày tiếp theo · Bấm ngày để xem khách</p>
            </div>
          </div>
          <div
            className="dashboard-days"
            role="group"
            aria-label="Chọn ngày hẹn"
          >
            {data.calendar.map((entry, index) => (
              <button
                key={entry.date}
                aria-pressed={day.date === entry.date}
                aria-label={`${fmtDate(entry.date)}: ${entry.customers.length} khách hẹn`}
                onClick={() => setSelectedDay(entry.date)}
              >
                <span>
                  {index === 0
                    ? "Hôm nay"
                    : weekday.format(new Date(entry.date + "T00:00:00Z"))}
                </span>
                <strong>{entry.date.slice(8)}</strong>
                <small>{entry.customers.length} khách</small>
              </button>
            ))}
          </div>
          <CustomerSlice
            key={day.date}
            title={`Lịch hẹn ${fmtDate(day.date)}`}
            rows={day.customers}
            empty="Không có lịch hẹn trong ngày này."
            describe={(customer) =>
              customer.followUpNote || "Chưa có nội dung lịch hẹn"
            }
            onOpen={onOpen}
          />
        </section>
      </div>
      <section
        className="content-panel dashboard-expiry"
        aria-label="Kỳ hạn 6 tháng"
      >
        <div className="panel-heading">
          <div>
            <h3>Kỳ hạn 6 tháng tới</h3>
            <p>
              Từ {fmtDate(today)} đến {fmtDate(data.months[5].end)} · Số khách
              có CKS hết hạn theo tháng
            </p>
          </div>
        </div>
        <div className="dashboard-expiry-grid">
          <div>
            <div
              className="dashboard-months"
              role="group"
              aria-label="Chọn tháng hết hạn"
            >
              {data.months.map((entry) => (
                <button
                  key={entry.key}
                  aria-pressed={month.key === entry.key}
                  aria-label={`Tháng ${entry.label}: ${entry.customers.length} khách hết hạn`}
                  onClick={() => setSelectedMonth(entry.key)}
                >
                  <strong>{entry.customers.length}</strong>
                  <span className="dashboard-bar-track">
                    <span
                      style={{
                        height: `${(entry.customers.length / maximum) * 100}%`,
                      }}
                    />
                  </span>
                  <span className="dashboard-month-label">
                    <span>{entry.key.slice(5)}</span>
                    <span className="dashboard-month-separator">/</span>
                    <span>{entry.key.slice(0, 4)}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="dashboard-chart-note">
              Bấm một tháng để xem danh sách. Tháng hiện tại chỉ tính kỳ hạn từ
              hôm nay; không gồm khách ngừng hoạt động.
            </p>
          </div>
          <CustomerSlice
            key={month.key}
            title={`CKS hết hạn tháng ${month.label}`}
            rows={month.customers}
            empty="Không có CKS hết hạn trong khoảng này."
            describe={(customer) => `Hết hạn ${fmtDate(customer.expireDate)}`}
            onOpen={onOpen}
          />
        </div>
      </section>
      <section
        className="content-panel dashboard-results"
        aria-label="Kết quả chăm sóc"
      >
        <div className="panel-heading">
          <div>
            <h3>Kết quả chăm sóc</h3>
            <p>
              {fmtDate(results.from)} – {fmtDate(results.to)} · Đếm khách duy
              nhất trong kỳ
            </p>
          </div>
          <label className="dashboard-period no-print">
            Khoảng thời gian
            <select
              aria-label="Kỳ kết quả chăm sóc"
              value={period}
              onChange={(event) =>
                setPeriod(Number(event.target.value) as 7 | 30 | 90)
              }
            >
              <option value={7}>7 ngày gần nhất</option>
              <option value={30}>30 ngày gần nhất</option>
              <option value={90}>90 ngày gần nhất</option>
            </select>
          </label>
        </div>
        <div className="dashboard-results-grid">
          <div>
            <div
              className="dashboard-outcomes"
              role="group"
              aria-label="Chọn kết quả chăm sóc"
            >
              <button
                aria-pressed={resultGroup === "contacted"}
                onClick={() => setResultGroup("contacted")}
              >
                <span>Khách đã liên hệ</span>
                <strong>{results.contacted.length}</strong>
                <small>Có nhật ký chăm sóc thực tế trong kỳ</small>
              </button>
              <button
                aria-pressed={resultGroup === "renewed"}
                onClick={() => setResultGroup("renewed")}
              >
                <span>Khách đã gia hạn</span>
                <strong>{results.renewed.length}</strong>
                <small>
                  Có giao dịch lịch sử hoặc xác nhận gia hạn trong kỳ
                </small>
              </button>
            </div>
            <p className="dashboard-chart-note">
              Không tính sao chép Zalo hay chỉ đặt lịch là một lần liên hệ. Hai
              nhóm được thống kê độc lập; một khách có thể nằm trong cả hai
              nhóm. Số gia hạn không xác nhận đã thu tiền.
            </p>
          </div>
          <CustomerSlice
            key={`${period}-${resultGroup}`}
            title={resultLabel}
            rows={results[resultGroup]}
            empty="Chưa có khách được ghi nhận trong kỳ này."
            describe={(customer) => customer.customId || "Xem hồ sơ và lịch sử"}
            onOpen={onOpen}
          />
        </div>
      </section>
    </div>
  );
}

function CustomerSlice({
  title,
  rows,
  empty,
  describe,
  onOpen,
}: {
  title: string;
  rows: Customer[];
  empty: string;
  describe: (customer: Customer) => string;
  onOpen: (id: string) => void;
}) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / 5));
  const current = Math.min(page, pages);
  return (
    <section className="dashboard-selection" aria-label={title}>
      <h4>
        {title} <span>· {rows.length} khách</span>
      </h4>
      {!rows.length ? (
        <p className="dashboard-empty">{empty}</p>
      ) : (
        <>
          <div className="dashboard-customer-list">
            {rows.slice((current - 1) * 5, current * 5).map((customer) => (
              <button
                className="dashboard-customer-row"
                key={customer.id}
                onClick={() => onOpen(customer.id)}
              >
                <div>
                  <strong>{customer.name}</strong>
                  <small>{describe(customer)}</small>
                </div>
                <ArrowUpRight size={16} aria-hidden="true" />
              </button>
            ))}
          </div>
          {pages > 1 && (
            <div className="dashboard-pagination no-print">
              <span>
                {(current - 1) * 5 + 1}–{Math.min(current * 5, rows.length)} /{" "}
                {rows.length} khách
              </span>
              <button
                className="icon-button"
                aria-label={`Khách trước trong ${title}`}
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="icon-button"
                aria-label={`Khách tiếp theo trong ${title}`}
                disabled={current === pages}
                onClick={() => setPage(current + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
