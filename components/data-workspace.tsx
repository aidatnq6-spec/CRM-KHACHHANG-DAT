"use client";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Database,
  Download,
  FileSpreadsheet,
  Upload,
  Trash2,
} from "lucide-react";
import type { WorkBook } from "xlsx";
import {
  dataIssues,
  duplicateOf,
  fmtDate,
  matchesSearch,
  money,
  pkgLabel,
  todayVN,
} from "@/lib/domain";
import {
  backupPayload,
  download,
  exportExcel,
  parseBackup,
  parseGrid,
  planExcelImport,
  type ImportRow,
} from "@/lib/transfer";
import type { WriteOperation } from "@/lib/repository";
import { readableError, useCRM } from "./crm-provider";
import { Empty, Modal } from "./ui";
import { additionalDatedServices, servicesText } from "@/lib/services";
export default function DataWorkspace({
  onOpen,
}: {
  onOpen: (id: string) => void;
}) {
  const crm = useCRM(),
    [error, setError] = useState(""),
    [working, setWorking] = useState(false);
  const [workbook, setWorkbook] = useState<WorkBook | null>(null),
    [sheet, setSheet] = useState(""),
    [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [jsonOps, setJsonOps] = useState<WriteOperation[] | null>(null),
    [sourceEmail, setSourceEmail] = useState(""),
    [mode, setMode] = useState<"skip" | "update">("skip");
  const [confirmText, setConfirmText] = useState(""),
    [deleting, setDeleting] = useState(false),
    [filter, setFilter] = useState(""),
    [query, setQuery] = useState("");
  const plan = useMemo(
    () => planExcelImport(importRows, crm.rows, mode),
    [importRows, crm.rows, mode],
  );
  const badRows = crm.rows
    .map((k) => ({
      k,
      issues: [
        ...dataIssues(k),
        ...(duplicateOf(k, crm.rows, k.id) ? ["Có thể trùng khách"] : []),
      ],
    }))
    .filter((x) => x.issues.length);
  const issues = [...new Set(badRows.flatMap((x) => x.issues))];
  async function run(work: () => Promise<void>) {
    setError("");
    setWorking(true);
    try {
      await work();
    } catch (e) {
      setError(readableError(e));
    } finally {
      setWorking(false);
    }
  }
  async function pickFile(file: File | undefined, json: boolean) {
    if (!file) return;
    await run(async () => {
      if (file.size > 30 * 1024 * 1024)
        throw new Error("File quá lớn. Giới hạn mỗi lần 30 MB.");
      setConfirmText("");
      if (json) {
        const payload = JSON.parse(await file.text());
        setJsonOps(parseBackup(payload));
        setSourceEmail(String(payload.sourceEmail || "Không có thông tin"));
      } else {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(await file.arrayBuffer(), {
          type: "array",
          // Keep spreadsheet serial dates and CSV text independent of browser timezone.
          cellDates: false,
          raw: true,
          codepage: 65001,
        });
        const parsed = parseGrid(
          XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
            header: 1,
            defval: "",
            blankrows: false,
          }),
          !!wb.Workbook?.WBProps?.date1904,
        );
        setWorkbook(wb);
        setSheet(wb.SheetNames[0]);
        setImportRows(parsed);
      }
    });
  }
  async function changeSheet(name: string) {
    setSheet(name);
    await run(async () => {
      if (workbook) {
        const XLSX = await import("xlsx");
        setImportRows([]);
        setImportRows(
          parseGrid(
            XLSX.utils.sheet_to_json(workbook.Sheets[name], {
              header: 1,
              defval: "",
              blankrows: false,
            }),
            !!workbook.Workbook?.WBProps?.date1904,
          ),
        );
      }
    });
  }
  return (
    <div className="workspace-stack">
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      <div className="tool-grid">
        <section className="tool-card">
          <span className="tool-icon">
            <FileSpreadsheet size={23} />
          </span>
          <h3>Nhập & xuất Excel</h3>
          <p>
            Đọc file hiện có, kiểm tra dữ liệu và khách trùng trước khi lưu. Cột
            “Dịch vụ” có thể chứa nhiều tên, ngăn cách bằng dấu chấm phẩy. Mỗi
            dịch vụ có cột gói, giá và ngày bắt đầu/hết hạn riêng trong file
            mẫu.
          </p>
          <div className="tool-actions">
            <label
              className={`button primary file-button ${working || crm.busy ? "disabled" : ""}`}
            >
              <Upload size={16} />
              Nhập Excel
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                disabled={working || crm.busy}
                onChange={(e) => {
                  void pickFile(e.target.files?.[0], false);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              className="button secondary"
              disabled={working}
              onClick={() => void run(() => exportExcel(crm.rows))}
            >
              <Download size={16} />
              Xuất Excel
            </button>
            <button
              className="text-button"
              disabled={working}
              onClick={() => void run(() => exportExcel([], true))}
            >
              Tải file mẫu
            </button>
          </div>
        </section>
        <section className="tool-card">
          <span className="tool-icon green">
            <Database size={23} />
          </span>
          <h3>Sao lưu & chuyển dữ liệu</h3>
          <p>
            Giữ thông tin khách, lịch sử gia hạn và chăm sóc trong file JSON.
          </p>
          <div className="tool-actions">
            <button
              className="button secondary"
              disabled={working}
              onClick={() => {
                download(
                  `crm-cks-backup-${todayVN()}.json`,
                  JSON.stringify(
                    backupPayload(
                      crm.rows,
                      crm.user?.email || "",
                      crm.user?.uid || "",
                    ),
                    null,
                    2,
                  ),
                );
                crm.notify("Đã xuất bản sao lưu JSON");
              }}
            >
              <Download size={16} />
              Sao lưu JSON
            </button>
            <label className="button secondary file-button">
              <Upload size={16} />
              Khôi phục JSON
              <input
                type="file"
                accept=".json"
                disabled={working || crm.busy}
                onChange={(e) => {
                  void pickFile(e.target.files?.[0], true);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <small>
            Chuyển tài khoản: xuất từ tài khoản cũ, đăng nhập tài khoản đích rồi
            nhập. Quyền truy cập vẫn theo cấu hình Firebase hiện có.
          </small>
        </section>
      </div>
      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h3>
              Dữ liệu cần kiểm tra{" "}
              <span className="count-pill">{badRows.length}</span>
            </h3>
            <p>Bổ sung thông tin để nhắc hạn và liên hệ chính xác hơn.</p>
          </div>
          <AlertTriangle size={23} className="amber" />
        </div>
        <div className="issue-filters">
          <input
            aria-label="Tìm dữ liệu cần sửa"
            placeholder="Tìm tên khách…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="Lọc lỗi dữ liệu"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">Tất cả vấn đề</option>
            {issues.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </div>
        {!badRows.length ? (
          <Empty
            title="Dữ liệu đã đầy đủ"
            detail="Không phát hiện vấn đề theo các tiêu chí hiện tại."
          />
        ) : (
          <div className="issue-list">
            {badRows
              .filter(
                ({ k, issues }) =>
                  matchesSearch(k, query) &&
                  (!filter || issues.includes(filter)),
              )
              .map(({ k, issues }) => (
                <button
                  key={k.id}
                  className="issue-row"
                  onClick={() => onOpen(k.id)}
                >
                  <div>
                    <strong>{k.name}</strong>
                    <small>{k.customId || k.phone || "Chưa có mã"}</small>
                  </div>
                  <div>
                    {issues.map((i) => (
                      <span key={i} className="badge warning-badge">
                        {i}
                      </span>
                    ))}
                  </div>
                  <span className="text-link">Kiểm tra</span>
                </button>
              ))}
          </div>
        )}
      </section>
      <section className="danger-zone">
        <div>
          <h3>Xóa toàn bộ khách hàng</h3>
          <p>
            Xóa vĩnh viễn dữ liệu của tài khoản hiện tại. Hãy tải bản sao lưu
            trước.
          </p>
        </div>
        <button
          className="button danger-outline"
          disabled={!crm.rows.length || crm.busy}
          onClick={() => {
            setDeleting(true);
            setConfirmText("");
          }}
        >
          <Trash2 size={16} />
          Xóa toàn bộ
        </button>
      </section>
      {workbook && (
        <Modal
          title="Kiểm tra dữ liệu Excel"
          onClose={() => {
            if (!crm.busy) {
              setWorkbook(null);
              setImportRows([]);
            }
          }}
          wide
        >
          <div className="import-intro">
            <label>
              Trang tính
              <select
                value={sheet}
                onChange={(e) => void changeSheet(e.target.value)}
              >
                {workbook.SheetNames.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Khi trùng mã hoặc điện thoại
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "skip" | "update")}
              >
                <option value="skip">Bỏ qua khách đã có</option>
                <option value="update">Cập nhật khách đã có</option>
              </select>
            </label>
          </div>
          <div className="import-summary">
            <strong>{plan.added} thêm mới</strong>
            <strong>{plan.updated} dòng cập nhật</strong>
            <span>{plan.skipped} bỏ qua/lỗi</span>
            <span>{plan.suspected} nghi trùng tên</span>
          </div>
          {plan.periodErrors.length > 0 && (
            <div className="alert error" role="alert">
              {plan.periodErrors.join(" ")}
            </div>
          )}
          <p className="muted">
            Chỉ nhập dòng hợp lệ. Khách nghi trùng tên được giữ riêng; kiểm tra
            kỹ trước khi xác nhận. Cập nhật chỉ thay các trường có trong file.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Dòng</th>
                  <th>Tên khách</th>
                  <th>Điện thoại</th>
                  <th>Dịch vụ</th>
                  <th>Gói</th>
                  <th>Hết hạn</th>
                  <th>Thông tin dịch vụ bổ sung</th>
                  <th>Kiểm tra</th>
                </tr>
              </thead>
              <tbody>
                {importRows.slice(0, 100).map((r) => (
                  <tr key={r.row}>
                    <td>{r.row}</td>
                    <td>{String(r.data.name)}</td>
                    <td>{String(r.data.phone || "")}</td>
                    <td>
                      {r.data.services === undefined
                        ? "Giữ nguyên / mặc định Chữ ký số"
                        : Array.isArray(r.data.services)
                          ? servicesText(r.data)
                          : String(r.data.services)}
                    </td>
                    <td>{pkgLabel(r.data.pkg)}</td>
                    <td>{fmtDate(r.data.expireDate)}</td>
                    <td>
                      {additionalDatedServices
                        .filter(
                          (service) => r.data.servicePeriods?.[service.id],
                        )
                        .map((service) => (
                          <div key={service.id}>
                            {service.label}:{" "}
                            {fmtDate(
                              r.data.servicePeriods?.[service.id]?.startDate,
                            )}{" "}
                            →{" "}
                            {fmtDate(
                              r.data.servicePeriods?.[service.id]?.endDate,
                            )}
                            {r.data.servicePeriods?.[service.id]?.pkg && (
                              <> · {r.data.servicePeriods[service.id]!.pkg}</>
                            )}
                            {r.data.servicePeriods?.[service.id]?.price !=
                              null && (
                              <>
                                {" "}
                                ·{" "}
                                {money(
                                  r.data.servicePeriods[service.id]!.price,
                                )}
                              </>
                            )}
                          </div>
                        ))}
                    </td>
                    <td className={r.errors.length ? "danger-text" : "muted"}>
                      {r.errors.join("; ") ||
                        (duplicateOf(r.data, crm.rows)
                          ? "Trùng/nghi trùng"
                          : "Hợp lệ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {importRows.length > 100 && (
            <p className="muted">
              Xem trước 100/{importRows.length} dòng. Kế hoạch nhập tính trên
              toàn bộ file.
            </p>
          )}
          {error && <div className="alert error">{error}</div>}
          <div className="form-actions">
            <button
              className="button secondary"
              disabled={crm.busy}
              onClick={() => {
                setWorkbook(null);
                setImportRows([]);
              }}
            >
              Hủy
            </button>
            <button
              className="button primary"
              disabled={crm.busy || working || !plan.operations.length}
              onClick={() =>
                void run(async () => {
                  await crm.batch(plan.operations);
                  setWorkbook(null);
                  setImportRows([]);
                })
              }
            >
              {crm.busy
                ? crm.progress || "Đang nhập…"
                : `Xác nhận nhập ${plan.operations.length} khách`}
            </button>
          </div>
        </Modal>
      )}
      {jsonOps && (
        <Modal
          title="Xác nhận khôi phục JSON"
          onClose={() => {
            if (!crm.busy) setJsonOps(null);
          }}
        >
          <div className="workspace-stack">
            <p>
              File chứa <strong>{jsonOps.length} khách hàng</strong> từ{" "}
              <strong>{sourceEmail}</strong>.
            </p>
            <p>
              Đích: <strong>{crm.user?.email}</strong>. Có{" "}
              {
                jsonOps.filter((op) => crm.rows.some((k) => k.id === op.id))
                  .length
              }{" "}
              ID đã tồn tại; các trường trong file sẽ ghi đè tương ứng. Bản ghi
              ngoài file được giữ.
            </p>
            <div className="alert warning">
              Kiểm tra đúng tài khoản đích và tải bản sao lưu trước khi khôi
              phục.
            </div>
            <label>
              Nhập KHOI PHUC để xác nhận
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </label>
            {error && <div className="alert error">{error}</div>}
            <div className="form-actions">
              <button
                className="button secondary"
                disabled={crm.busy}
                onClick={() => setJsonOps(null)}
              >
                Hủy
              </button>
              <button
                className="button primary"
                disabled={confirmText !== "KHOI PHUC" || crm.busy}
                onClick={() =>
                  void run(async () => {
                    await crm.batch(jsonOps);
                    setJsonOps(null);
                  })
                }
              >
                {crm.busy
                  ? crm.progress || "Đang khôi phục…"
                  : "Khôi phục dữ liệu"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Xóa toàn bộ khách hàng?"
          onClose={() => {
            if (!crm.busy) setDeleting(false);
          }}
        >
          <div className="alert error">
            Bạn sắp xóa vĩnh viễn {crm.rows.length} khách cùng lịch sử. Không
            thể hoàn tác từ ứng dụng.
          </div>
          <label>
            Nhập XOA TAT CA để xác nhận
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </label>
          {error && <div className="alert error">{error}</div>}
          <div className="form-actions">
            <button
              className="button secondary"
              disabled={crm.busy}
              onClick={() => setDeleting(false)}
            >
              Hủy
            </button>
            <button
              className="button danger"
              disabled={confirmText !== "XOA TAT CA" || crm.busy}
              onClick={() =>
                void run(async () => {
                  await crm.batch(
                    crm.rows.map((k) => ({ id: k.id, remove: true })),
                  );
                  setDeleting(false);
                })
              }
            >
              {crm.busy ? crm.progress || "Đang xóa…" : "Xóa toàn bộ"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
