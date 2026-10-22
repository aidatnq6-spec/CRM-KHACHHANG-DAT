"use client";
import { useState } from "react";
import { ArrowUpRight, Download, Printer } from "lucide-react";
import {
  careLabels,
  careOf,
  expiring,
  lifetimeValue,
  money,
  pkgLabel,
  reportData,
  statusOf,
  todayVN,
  fmtDate,
} from "@/lib/domain";
import { exportReportExcel } from "@/lib/transfer";
import type { Customer, Page } from "@/lib/types";
import { readableError, useCRM } from "./crm-provider";
import { Empty } from "./ui";
export function Stats({
  items,
}: {
  items: {
    label: string;
    value: string | number;
    detail?: string;
    accent?: string;
    onClick?: () => void;
  }[];
}) {
  return (
    <div className="stats-grid">
      {items.map((item) => (
        <button
          disabled={!item.onClick}
          onClick={item.onClick}
          className={`stat ${item.accent || ""}`}
          key={item.label}
        >
          <span>
            {item.label}
            {item.onClick && <ArrowUpRight size={16} />}
          </span>
          <strong>{item.value}</strong>
          <small>{item.detail}</small>
        </button>
      ))}
    </div>
  );
}
export function Funnel({ rows }: { rows: Customer[] }) {
  const stages = Object.entries(careLabels).map(([key, label]) => ({
    label,
    count: rows.filter((k) => careOf(k) === key).length,
  }));
  const contacted = rows.filter((k) => careOf(k) !== "not_contacted").length,
    won = rows.filter((k) => careOf(k) === "renewed").length;
  return (
    <section className="content-panel">
      <div className="panel-heading">
        <div>
          <h3>Phễu gia hạn</h3>
          <p>
            {contacted} đã chăm sóc · {won} đã gia hạn ·{" "}
            {contacted ? Math.round((won / contacted) * 100) : 0}% trên đã chăm
            sóc
          </p>
        </div>
      </div>
      <div className="funnel">
        {stages.map((s, i) => (
          <div key={s.label} className="funnel-row">
            <div>
              <span>{s.label}</span>
              <strong>{s.count}</strong>
            </div>
            <div className="bar-track">
              <div
                className={`bar-fill bar-${i % 4}`}
                style={{
                  width: `${rows.length ? (s.count / rows.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="muted footnote">
        Phân bổ theo trạng thái hiện tại của toàn bộ khách, không phải các bước
        nối tiếp.
      </p>
    </section>
  );
}
export default function Reports({
  dashboard = false,
  onNavigate,
  onOpen,
}: {
  dashboard?: boolean;
  onNavigate: (p: Page, range?: string) => void;
  onOpen: (id: string) => void;
}) {
  const crm = useCRM(),
    data = reportData(crm.rows),
    [working, setWorking] = useState(false),
    [error, setError] = useState("");
  const active = crm.rows.filter((k) => statusOf(k) === "active").length,
    overdue = crm.rows.filter((k) => statusOf(k) === "expired").length;
  const upcoming = expiring(crm.rows);
  return (
    <div className="workspace-stack report-area">
      <div className="report-title">
        <div className="report-print-heading">
          <h2>{dashboard ? "Tổng quan hoạt động" : "Báo cáo & phân tích"}</h2>
          <p>Cập nhật theo dữ liệu hiện tại · {fmtDate(todayVN())}</p>
        </div>
        <div className="inline-actions no-print">
          <button className="button secondary" onClick={() => window.print()}>
            <Printer size={17} />
            In / Lưu PDF
          </button>
          <button
            className="button secondary"
            disabled={working}
            onClick={async () => {
              setWorking(true);
              try {
                await exportReportExcel(crm.rows);
              } catch (e) {
                setError(readableError(e));
              } finally {
                setWorking(false);
              }
            }}
          >
            <Download size={17} />
            Xuất báo cáo
          </button>
        </div>
      </div>
      {error && <div className="alert error">{error}</div>}
      <Stats
        items={[
          {
            label: "Tổng khách hàng",
            value: data.total,
            detail: "Đang quản lý",
            onClick: () => onNavigate("customers"),
          },
          {
            label: "Sắp hết hạn 30 ngày",
            value: upcoming.length,
            detail: "Cần chủ động liên hệ",
            accent: "amber-stat",
            onClick: () => onNavigate("reminders", "30"),
          },
          {
            label: "Đã hết hạn",
            value: overdue,
            detail: "Cần kiểm tra gia hạn",
            accent: "red-stat",
            onClick: () => onNavigate("reminders", "expired"),
          },
          {
            label: "Khách còn hạn >30 ngày",
            value: active,
            detail: `${data.total ? Math.round((active / data.total) * 100) : 0}% trên tổng khách`,
          },
        ]}
      />
      {!crm.rows.length ? (
        <Empty
          title="Chưa có dữ liệu để báo cáo"
          detail="Thêm khách hàng hoặc nhập dữ liệu để bắt đầu theo dõi."
        />
      ) : (
        <>
          <div className="two-columns">
            <Funnel rows={crm.rows} />
            <section className="content-panel">
              <div className="panel-heading">
                <div>
                  <h3>Phân bổ gói dịch vụ</h3>
                  <p>Số khách và giá trị dịch vụ hiện tại.</p>
                </div>
              </div>
              <div className="package-bars">
                {data.packages.map(([pkg, value]) => (
                  <div key={pkg}>
                    <div className="bar-label">
                      <span>{pkg}</span>
                      <strong>{value.count} khách</strong>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${(value.count / data.total) * 100}%`,
                        }}
                      />
                    </div>
                    <small>{money(value.revenue)}</small>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <Stats
            items={[
              {
                label: "Giá trị dịch vụ hiện tại",
                value: money(data.currentRevenue),
                detail: "Tổng giá hiện tại, không phải doanh thu đã thu",
              },
              {
                label: "Giá trung bình / khách",
                value: money(data.average),
                detail: "Trên toàn bộ khách hàng",
              },
              {
                label: "Giá trị dự kiến 30 ngày",
                value: money(data.forecast),
                detail: "Tổng giá khách sắp hết hạn; thiếu giá dùng trung bình",
              },
              {
                label: "Khách từng gia hạn",
                value: `${data.renewalRate}%`,
                detail: "Khách có lịch sử giao dịch",
              },
            ]}
          />
          {!dashboard && (
            <section className="content-panel">
              <div className="panel-heading">
                <div>
                  <h3>Dự kiến gia hạn trong 90 ngày</h3>
                  <p>
                    {expiring(crm.rows, 90).length} khách · Giá trị tham khảo từ
                    gói hiện tại.
                  </p>
                </div>
                <button
                  className="text-button no-print"
                  onClick={() => onNavigate("reminders", "90")}
                >
                  Xem tất cả <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="forecast-list">
                {expiring(crm.rows, 90)
                  .slice(0, 8)
                  .map((k) => (
                    <button
                      className="forecast-row"
                      onClick={() => onOpen(k.id)}
                      key={k.id}
                    >
                      <div>
                        <strong>{k.name}</strong>
                        <small>{pkgLabel(k.pkg)}</small>
                      </div>
                      <div>
                        <span>{fmtDate(k.expireDate)}</span>
                        <strong>
                          {money(Number(k.price) || data.average)}
                        </strong>
                      </div>
                    </button>
                  ))}
              </div>
            </section>
          )}
          {!dashboard && (
            <section className="content-panel">
              <div className="panel-heading">
                <div>
                  <h3>Hiệu quả chăm sóc 6 tháng</h3>
                  <p>
                    Số khách duy nhất trong từng tháng; doanh thu lấy từ lịch sử
                    gia hạn.
                  </p>
                </div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Tháng</th>
                      <th>Zalo / sao chép</th>
                      <th>Đã gọi</th>
                      <th>Đã chăm sóc</th>
                      <th>Gia hạn</th>
                      <th>Từ chối</th>
                      <th>Giá trị gia hạn</th>
                      <th>Chuyển đổi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.months.map((m) => (
                      <tr key={m.key}>
                        <td>{m.key}</td>
                        <td>{m.zalo.size}</td>
                        <td>{m.called.size}</td>
                        <td>{m.touched.size}</td>
                        <td>{m.renewed.size}</td>
                        <td>{m.declined.size}</td>
                        <td>{money(m.revenue)}</td>
                        <td>
                          {m.touched.size
                            ? Math.round(
                                (m.renewed.size / m.touched.size) * 100,
                              )
                            : 0}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted footnote">
                Tỷ lệ chuyển đổi = số khách gia hạn / số khách đã chăm sóc trong
                tháng. Hai nhóm được thống kê độc lập theo nhật ký và giao dịch.
              </p>
            </section>
          )}
          <div className="two-columns">
            <section className="content-panel">
              <div className="panel-heading">
                <div>
                  <h3>Giá trị dịch vụ theo tháng cấp</h3>
                  <p>Tổng giá hiện tại, nhóm theo ngày cấp dịch vụ.</p>
                </div>
              </div>
              <div
                className="monthly-chart"
                role="img"
                aria-label="Biểu đồ giá trị dịch vụ theo ngày cấp 6 tháng"
              >
                {data.months.map((m) => (
                  <div key={m.key}>
                    <small>{money(m.issuedValue)}</small>
                    <div className="chart-column">
                      <div
                        style={{
                          height: `${Math.max(1, (m.issuedValue / Math.max(1, ...data.months.map((x) => x.issuedValue))) * 100)}%`,
                        }}
                      />
                    </div>
                    <span>
                      {m.key.slice(5)}/{m.key.slice(2, 4)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
            <section className="content-panel">
              <div className="panel-heading">
                <div>
                  <h3>Khách hàng giá trị cao</h3>
                  <p>Tổng giao dịch lịch sử và dịch vụ hiện tại.</p>
                </div>
              </div>
              <ol className="top-customers">
                {data.top.map((k, i) => (
                  <li key={k.id}>
                    <span className="rank">{i + 1}</span>
                    <button
                      className="customer-name"
                      onClick={() => onOpen(k.id)}
                    >
                      {k.name}
                      <small>{pkgLabel(k.pkg)}</small>
                    </button>
                    <strong>{money(lifetimeValue(k))}</strong>
                  </li>
                ))}
              </ol>
            </section>
          </div>
          <section className="content-panel print-only">
            <h3>Khách sắp hết hạn 30 ngày</h3>
            <table>
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Điện thoại</th>
                  <th>Ngày hết hạn</th>
                  <th>Gói</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((k) => (
                  <tr key={k.id}>
                    <td>{k.name}</td>
                    <td>{k.phone}</td>
                    <td>{fmtDate(k.expireDate)}</td>
                    <td>{pkgLabel(k.pkg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
