"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  Database,
  Download,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Users,
  X,
  ChartNoAxesCombined,
} from "lucide-react";
import {
  careOf,
  daysLeft,
  expiring,
  fmtDate,
  todayTasks,
  todayVN,
} from "@/lib/domain";
import { buildScript, defaultTemplates, loadTemplates } from "@/lib/templates";
import type { Customer, Page, ZaloTemplate } from "@/lib/types";
import { readableError, useCRM } from "./crm-provider";
import { CareBadge, Empty, ExpiryBadge, Modal, Spinner } from "./ui";
import Login from "./login";
import CustomerList from "./customer-list";
import CustomerDetail from "./customer-detail";
import CustomerForm from "./customer-form";
import { Stats } from "./reports";
const Reports = dynamic(() => import("./reports"), {
  loading: () => <Spinner />,
});
const DataWorkspace = dynamic(() => import("./data-workspace"), {
  loading: () => <Spinner />,
});
const ZaloWorkspace = dynamic(() => import("./zalo-workspace"), {
  loading: () => <Spinner />,
});
const navigation = [
  { id: "reminders", label: "Nhắc gia hạn", icon: CalendarClock },
  { id: "today", label: "Công việc hôm nay", icon: CalendarCheck2 },
  { id: "customers", label: "Khách hàng", icon: Users },
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "reports", label: "Báo cáo & phân tích", icon: ChartNoAxesCombined },
  { id: "zalo", label: "Mẫu & nội dung Zalo", icon: MessageSquare },
  { id: "data", label: "Quản lý dữ liệu", icon: Database },
] as const;
const subscribePage = (fn: () => void) => {
  window.addEventListener("hashchange", fn);
  return () => window.removeEventListener("hashchange", fn);
};
const getPage = (): Page => {
  const hash = window.location.hash.slice(1);
  return navigation.some((n) => n.id === hash) ? (hash as Page) : "reminders";
};
export default function CRMApp() {
  const crm = useCRM(),
    page = useSyncExternalStore(
      subscribePage,
      getPage,
      () => "reminders" as Page,
    );
  const [range, setRange] = useState("30"),
    [selected, setSelected] = useState<Set<string>>(new Set()),
    [openId, setOpenId] = useState<string | null>(null),
    [adding, setAdding] = useState(false),
    [more, setMore] = useState(false),
    [taskFilter, setTaskFilter] = useState("all");
  const [templates, setTemplates] = useState<ZaloTemplate[]>(defaultTemplates),
    [zaloId, setZaloId] = useState<string | null>(null),
    [zaloKey, setZaloKey] = useState("auto"),
    [returnId, setReturnId] = useState<string | null>(null),
    [zaloError, setZaloError] = useState("");
  const [deleteSelected, setDeleteSelected] = useState(false),
    [deleteText, setDeleteText] = useState(""),
    [operationError, setOperationError] = useState(""),
    [today, setToday] = useState(todayVN);
  useEffect(() => {
    const tick = setInterval(() => setToday(todayVN()), 60000);
    return () => clearInterval(tick);
  }, []);
  useEffect(() => {
    const list = loadTemplates();
    queueMicrotask(() => setTemplates(list));
  }, []);
  function navigate(next: Page) {
    window.location.hash = next;
    setSelected(new Set());
    setMore(false);
  }
  function select(ids: string[], checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  }
  const selectedRows = crm.rows.filter((k) => selected.has(k.id));
  const customer = crm.rows.find((k) => k.id === openId),
    zaloCustomer = crm.rows.find((k) => k.id === zaloId);
  const soon30 = useMemo(
      () => expiring(crm.rows, 30, today),
      [crm.rows, today],
    ),
    soon7 = expiring(crm.rows, 7, today),
    expired = crm.rows.filter(
      (k) =>
        k.status !== "inactive" && (daysLeft(k.expireDate, today) ?? 0) < 0,
    );
  const tasks = useMemo(() => todayTasks(crm.rows, today), [crm.rows, today]);
  const listed =
    page === "reminders"
      ? range === "expired"
        ? [...expired].sort(
            (a, b) =>
              (daysLeft(a.expireDate, today) || 0) -
              (daysLeft(b.expireDate, today) || 0),
          )
        : expiring(crm.rows, Number(range), today)
      : [...crm.rows].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  function openZalo(k: Customer) {
    setReturnId(openId);
    setOpenId(null);
    setZaloId(k.id);
    setZaloKey("auto");
    setZaloError("");
  }
  function closeZalo() {
    setZaloId(null);
    setOpenId(returnId);
    setReturnId(null);
  }
  async function copyScript(open = false) {
    if (!zaloCustomer) return;
    const script = buildScript(zaloCustomer, templates, zaloKey);
    setZaloError("");
    try {
      await navigator.clipboard.writeText(script);
      await crm.care(
        zaloCustomer.id,
        careOf(zaloCustomer),
        open
          ? "Đã sao chép nội dung và mở liên hệ Zalo; chưa xác nhận gửi"
          : "Đã sao chép nội dung Zalo; chưa xác nhận gửi",
        script,
      );
      if (open) {
        const phone = String(zaloCustomer.phone || "").replace(/\D/g, "");
        if (phone)
          window.open(
            `https://zalo.me/${phone}`,
            "_blank",
            "noopener,noreferrer",
          );
      }
      crm.notify(
        open
          ? "Đã sao chép. Hãy gửi nội dung trong Zalo."
          : "Đã sao chép nội dung; chưa gửi tin nhắn.",
      );
    } catch (e) {
      setZaloError(
        `Chưa hoàn tất thao tác. ${readableError(e)} Bạn có thể sao chép nội dung thủ công.`,
      );
    }
  }
  if (crm.authLoading)
    return (
      <main className="boot-screen">
        <ShieldCheck size={38} />
        <Spinner label="Đang mở không gian làm việc…" />
      </main>
    );
  if (!crm.user) return <Login />;
  const activeNav = navigation.find((n) => n.id === page)!;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <aside className="sidebar no-print">
        <button className="brand" onClick={() => navigate("reminders")}>
          <span className="brand-mark">
            <ShieldCheck size={24} />
          </span>
          <span>
            CRM CKS<small>Chăm sóc & gia hạn</small>
          </span>
        </button>
        <div className="workspace-label">
          <span className="pulse-dot" />
          Không gian làm việc
        </div>
        <nav aria-label="Điều hướng chính">
          {navigation.map((item, i) => (
            <button
              key={item.id}
              aria-current={page === item.id ? "page" : undefined}
              className={`nav-item ${page === item.id ? "active" : ""} ${i === 3 ? "nav-divider" : ""}`}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={19} strokeWidth={1.7} />
              <span>{item.label}</span>
              {item.id === "reminders" && soon30.length > 0 && (
                <b>{soon30.length}</b>
              )}
              {item.id === "today" && tasks.length > 0 && (
                <i className="nav-indicator" />
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-tip">
          <CalendarClock size={20} />
          <strong>Chủ động trước kỳ hạn</strong>
          <p>Một lời nhắc đúng lúc giúp giữ kết nối dài lâu.</p>
        </div>
        <div className="sidebar-account">
          <span className="avatar">
            {crm.user.email?.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>Tài khoản của bạn</strong>
            <small title={crm.user.email || ""}>{crm.user.email}</small>
          </div>
          <button
            className="icon-button"
            title="Đăng xuất"
            aria-label="Đăng xuất"
            disabled={crm.busy}
            onClick={() => {
              setSelected(new Set());
              void crm.logout().catch(() => {});
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar no-print">
          <div className="breadcrumb">
            <span>Không gian làm việc</span>
            <ChevronRight size={14} />
            <strong>{activeNav.label}</strong>
          </div>
          <button
            className="mobile-brand"
            onClick={() => navigate("reminders")}
          >
            <ShieldCheck size={23} />
            CRM CKS
          </button>
          <div className="header-actions">
            <span className="sync-label">
              <span className={`pulse-dot ${crm.error ? "red" : ""}`} />
              {crm.loading
                ? "Đang đồng bộ"
                : crm.error
                  ? "Lỗi kết nối"
                  : "Đã đồng bộ"}
            </span>
            <button className="button primary" onClick={() => setAdding(true)}>
              <Plus size={18} />
              <span>Thêm khách hàng</span>
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content">
          <div className="page-heading no-print">
            <div>
              <h1>{activeNav.label}</h1>
              <p>
                {page === "reminders"
                  ? "Chủ động liên hệ, giữ kết nối qua mỗi kỳ gia hạn."
                  : page === "today"
                    ? "Những việc cần ưu tiên để mỗi cuộc hẹn đều được tiếp nối."
                    : page === "customers"
                      ? "Thông tin dịch vụ và hành trình chăm sóc, trong một nơi."
                      : page === "data"
                        ? "Giữ dữ liệu đầy đủ, chính xác và dễ khôi phục."
                        : page === "zalo"
                          ? "Một mẫu phù hợp, một lời nhắn riêng cho từng khách."
                          : "Theo dõi hoạt động và hiệu quả chăm sóc khách hàng."}
              </p>
            </div>
            {page !== "customers" && (
              <span className="page-date">
                <CalendarClock size={16} />
                {fmtDate(today)}
              </span>
            )}
            {page === "customers" && (
              <button
                className="button secondary"
                onClick={() => navigate("data")}
              >
                <Download size={16} />
                Nhập / Xuất
              </button>
            )}
          </div>
          {crm.testMode && (
            <div className="alert warning no-print">
              Chế độ kiểm thử cục bộ · Dữ liệu tổng hợp · Không kết nối Firebase
              thật
            </div>
          )}
          {crm.error && (
            <div className="alert error" role="alert">
              <TriangleAlert size={19} />
              <div>
                {crm.error}
                <button className="text-button" onClick={crm.retry}>
                  Kết nối lại
                </button>
              </div>
            </div>
          )}
          {crm.loading ? (
            <Spinner />
          ) : crm.error ? (
            <Empty
              title="Chưa tải được dữ liệu"
              detail="Kiểm tra kết nối và quyền tài khoản rồi thử lại."
            />
          ) : (
            <>
              {page === "reminders" && (
                <>
                  <Stats
                    items={[
                      {
                        label: "Sắp hết hạn 30 ngày",
                        value: soon30.length,
                        detail: "Hôm nay đến ngày thứ 30",
                        accent: "navy-stat",
                        onClick: () => {
                          setRange("30");
                          setSelected(new Set());
                        },
                      },
                      {
                        label: "Cần ưu tiên trong 7 ngày",
                        value: soon7.length,
                        detail: "Liên hệ sớm để kịp gia hạn",
                        accent: "amber-stat",
                        onClick: () => {
                          setRange("7");
                          setSelected(new Set());
                        },
                      },
                      {
                        label: "Chưa liên hệ",
                        value: soon30.filter(
                          (k) => careOf(k) === "not_contacted",
                        ).length,
                        detail: "Trong nhóm sắp hết hạn 30 ngày",
                      },
                      {
                        label: "Đã hết hạn",
                        value: expired.length,
                        detail: "Khách đang hoạt động",
                        accent: "red-stat",
                        onClick: () => {
                          setRange("expired");
                          setSelected(new Set());
                        },
                      },
                    ]}
                  />
                  <section className="renewal-intro">
                    <div className="renewal-heading">
                      <span className="intro-icon">
                        <CalendarClock size={22} />
                      </span>
                      <div>
                        <h2>
                          {range === "expired"
                            ? "Khách hàng đã hết hạn"
                            : `Khách sắp hết hạn trong ${range} ngày`}
                        </h2>
                        <p>
                          {range === "expired"
                            ? "Kiểm tra và liên hệ để hỗ trợ khách gia hạn."
                            : `Từ ${fmtDate(today)} · Ưu tiên ngày hết hạn gần nhất`}
                        </p>
                      </div>
                    </div>
                    <div
                      className="range-tabs"
                      role="group"
                      aria-label="Khoảng nhắc hạn"
                    >
                      {["7", "30", "90", "expired"].map((r) => (
                        <button
                          key={r}
                          aria-pressed={range === r}
                          className={range === r ? "active" : ""}
                          onClick={() => {
                            setRange(r);
                            setSelected(new Set());
                          }}
                        >
                          {r === "expired" ? "Đã hết hạn" : `${r} ngày`}
                        </button>
                      ))}
                    </div>
                  </section>
                </>
              )}
              {(page === "reminders" || page === "customers") && (
                <>
                  <BulkBar
                    rows={selectedRows}
                    onClear={() => setSelected(new Set())}
                    onZalo={() => navigateKeepingSelection("zalo")}
                    onDelete={() => {
                      setDeleteSelected(true);
                      setDeleteText("");
                      setOperationError("");
                    }}
                  />
                  <CustomerList
                    key={page + range}
                    rows={listed}
                    onOpen={setOpenId}
                    selected={selected}
                    onSelect={select}
                    onZalo={openZalo}
                    showStatus={page === "customers"}
                  />
                </>
              )}
              {page === "today" && (
                <>
                  <Stats
                    items={[
                      {
                        label: "Công việc cần làm",
                        value: tasks.length,
                        detail: "Một khách có thể có nhiều việc",
                      },
                      {
                        label: "Lịch hẹn đến hạn",
                        value: tasks.filter((t) => t.type === "follow").length,
                        detail: "Hôm nay và các lịch quá hạn",
                        accent: "amber-stat",
                      },
                      {
                        label: "Chờ phản hồi",
                        value: tasks.filter((t) => t.type === "waiting").length,
                        detail: "Cần tiếp nối cuộc trao đổi",
                      },
                    ]}
                  />
                  <div className="filter-chips">
                    {[
                      ["all", "Tất cả"],
                      ["follow", "Lịch hẹn"],
                      ["expired", "Đã hết hạn"],
                      ["urgent", "Còn 7 ngày"],
                      ["waiting", "Chờ phản hồi"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        className={taskFilter === id ? "active" : ""}
                        onClick={() => setTaskFilter(id)}
                      >
                        {label}
                        <span>
                          {
                            tasks.filter((t) => id === "all" || t.type === id)
                              .length
                          }
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="task-list">
                    {!tasks.filter(
                      (t) => taskFilter === "all" || t.type === taskFilter,
                    ).length ? (
                      <Empty
                        title="Đã hoàn tất các việc trong nhóm này"
                        detail="Bạn có thể kiểm tra nhóm khác hoặc xem khách sắp hết hạn."
                      />
                    ) : (
                      tasks
                        .filter(
                          (t) => taskFilter === "all" || t.type === taskFilter,
                        )
                        .map((t) => (
                          <article
                            className={`task-row task-${t.type}`}
                            key={t.customer.id + t.type}
                          >
                            <span className="task-symbol">
                              <ClipboardList size={20} />
                            </span>
                            <div className="task-info">
                              <button
                                className="customer-name"
                                onClick={() => setOpenId(t.customer.id)}
                              >
                                {t.customer.name}
                              </button>
                              <strong>{t.title}</strong>
                              <small>{t.detail}</small>
                            </div>
                            <CareBadge customer={t.customer} />
                            <div className="task-actions">
                              <button
                                className="button secondary"
                                onClick={() => openZalo(t.customer)}
                              >
                                Soạn Zalo
                              </button>
                              <button
                                className="button secondary"
                                onClick={() => setOpenId(t.customer.id)}
                              >
                                Chăm sóc <ArrowRight size={15} />
                              </button>
                            </div>
                          </article>
                        ))
                    )}
                  </div>
                </>
              )}
              {(page === "dashboard" || page === "reports") && (
                <Reports
                  dashboard={page === "dashboard"}
                  onNavigate={(p, r) => {
                    if (r) setRange(r);
                    navigate(p);
                  }}
                  onOpen={setOpenId}
                />
              )}
              {page === "data" && <DataWorkspace onOpen={setOpenId} />}
              {page === "zalo" && (
                <ZaloWorkspace
                  templates={templates}
                  onTemplates={setTemplates}
                  selected={selected}
                  onSelect={select}
                  onOpen={setOpenId}
                />
              )}
            </>
          )}
          <footer className="main-footer no-print">
            <span>CRM CKS · Chăm sóc để kết nối dài lâu</span>
            <span>
              <ShieldCheck size={13} />
              Dữ liệu theo tài khoản
            </span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav no-print" aria-label="Điều hướng điện thoại">
        {navigation.slice(0, 3).map((item) => (
          <button
            className={page === item.id ? "active" : ""}
            aria-current={page === item.id ? "page" : undefined}
            key={item.id}
            onClick={() => navigate(item.id)}
          >
            <item.icon size={21} />
            <span>
              {item.id === "reminders"
                ? "Nhắc hạn"
                : item.id === "today"
                  ? "Hôm nay"
                  : "Khách hàng"}
            </span>
          </button>
        ))}
        <button
          className={
            more || !["reminders", "today", "customers"].includes(page)
              ? "active"
              : ""
          }
          onClick={() => setMore(true)}
        >
          <Menu size={21} />
          <span>Thêm mục</span>
        </button>
      </nav>
      {crm.notice && (
        <div className="toast no-print" role="status">
          <Check size={18} />
          <span>{crm.notice}</span>
        </div>
      )}
      {crm.progress && (
        <div className="progress-banner" role="status">
          <RefreshCw size={16} className="spin" />
          {crm.progress}
        </div>
      )}
      {adding && (
        <Modal
          title="Thêm khách hàng"
          onClose={() => {
            if (!crm.busy) setAdding(false);
          }}
          panel
        >
          <CustomerForm
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </Modal>
      )}
      {customer && (
        <CustomerDetail
          key={customer.id}
          customer={customer}
          onClose={() => {
            if (!crm.busy) setOpenId(null);
          }}
          onZalo={openZalo}
        />
      )}
      {more && (
        <Modal title="Thêm chức năng" onClose={() => setMore(false)}>
          <nav className="more-menu">
            {navigation.slice(3).map((item) => (
              <button key={item.id} onClick={() => navigate(item.id)}>
                <item.icon size={21} />
                {item.label}
                <ChevronRight size={17} />
              </button>
            ))}
          </nav>
          <div className="mobile-account">
            <small>{crm.user.email}</small>
            <button
              className="button secondary"
              disabled={crm.busy}
              onClick={() => {
                setMore(false);
                setSelected(new Set());
                void crm.logout().catch(() => {});
              }}
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </Modal>
      )}
      {zaloCustomer && (
        <Modal
          title="Soạn nội dung Zalo"
          onClose={() => {
            if (!crm.busy) closeZalo();
          }}
        >
          <div className="workspace-stack">
            <div className="section-heading">
              <h3>{zaloCustomer.name}</h3>
              <ExpiryBadge customer={zaloCustomer} />
            </div>
            <label>
              Mẫu tin nhắn
              <select
                value={zaloKey}
                onChange={(e) => setZaloKey(e.target.value)}
              >
                <option value="auto">Tự chọn theo hạn</option>
                {templates.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              aria-label="Nội dung Zalo"
              readOnly
              rows={11}
              value={buildScript(zaloCustomer, templates, zaloKey)}
            />
            <p className="muted">
              Sao chép và gửi thủ công trong Zalo. Chỉ chọn “Đã nhắn Zalo” trong
              hồ sơ sau khi bạn gửi.
            </p>
            {zaloError && (
              <div className="alert error" role="alert">
                {zaloError}
              </div>
            )}
            <div className="form-actions">
              <button
                className="button secondary"
                disabled={crm.busy}
                onClick={() => void copyScript()}
              >
                <Copy size={17} />
                Sao chép
              </button>
              <button
                className="button primary"
                disabled={crm.busy || !zaloCustomer.phone}
                onClick={() => void copyScript(true)}
              >
                Sao chép & mở Zalo
              </button>
            </div>
          </div>
        </Modal>
      )}
      {deleteSelected && (
        <Modal
          title="Xóa khách đã chọn?"
          onClose={() => {
            if (!crm.busy) setDeleteSelected(false);
          }}
        >
          <p>
            Bạn sắp xóa vĩnh viễn{" "}
            <strong>{selectedRows.length} khách hàng</strong> cùng lịch sử.
          </p>
          <ul className="delete-preview">
            {selectedRows.slice(0, 5).map((k) => (
              <li key={k.id}>{k.name}</li>
            ))}
          </ul>
          <label>
            Nhập XOA để xác nhận
            <input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
            />
          </label>
          {operationError && (
            <div className="alert error">{operationError}</div>
          )}
          <div className="form-actions">
            <button
              className="button secondary"
              disabled={crm.busy}
              onClick={() => setDeleteSelected(false)}
            >
              Hủy
            </button>
            <button
              className="button danger"
              disabled={
                deleteText !== "XOA" || crm.busy || !selectedRows.length
              }
              onClick={async () => {
                try {
                  await crm.batch(
                    selectedRows.map((k) => ({ id: k.id, remove: true })),
                  );
                  setSelected(new Set());
                  setDeleteSelected(false);
                } catch (e) {
                  setOperationError(readableError(e));
                }
              }}
            >
              Xóa khách đã chọn
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
  function navigateKeepingSelection(next: Page) {
    window.location.hash = next;
    setMore(false);
  }
}
function BulkBar({
  rows,
  onClear,
  onZalo,
  onDelete,
}: {
  rows: Customer[];
  onClear: () => void;
  onZalo: () => void;
  onDelete: () => void;
}) {
  const crm = useCRM();
  if (!rows.length) return null;
  return (
    <div className="bulk-bar">
      <strong>{rows.length} khách đã chọn</strong>
      <div>
        <button className="button secondary" onClick={onZalo}>
          <MessageSquare size={16} />
          Soạn Zalo
        </button>
        <button
          className="button secondary"
          onClick={async () => {
            try {
              const { exportExcel } = await import("@/lib/transfer");
              await exportExcel(rows);
            } catch (e) {
              crm.notify(readableError(e));
            }
          }}
        >
          <Download size={16} />
          Xuất
        </button>
        <button
          className="button danger-outline"
          disabled={crm.busy}
          onClick={onDelete}
        >
          <Trash2 size={16} />
          Xóa
        </button>
        <button
          className="icon-button"
          aria-label="Bỏ chọn tất cả"
          onClick={onClear}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
