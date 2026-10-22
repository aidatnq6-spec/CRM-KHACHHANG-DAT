"use client";
import { useState } from "react";
import { Check, Copy, Download, RotateCcw, Save, Upload } from "lucide-react";
import {
  buildScript,
  defaultTemplates,
  mergeTemplates,
  templateKey,
} from "@/lib/templates";
import { download } from "@/lib/transfer";
import { matchesSearch } from "@/lib/domain";
import type { Customer, ZaloTemplate } from "@/lib/types";
import { readableError, useCRM } from "./crm-provider";
import { Empty } from "./ui";
const sample: Customer = {
  id: "sample",
  name: "Khách hàng mẫu",
  contact: "Anh/chị",
  bizName: "Công ty mẫu",
  phone: "0901234567",
  pkg: "Gói 1 năm",
  price: 1200000,
};
export default function ZaloWorkspace({
  templates,
  onTemplates,
  selected,
  onSelect,
  onOpen,
}: {
  templates: ZaloTemplate[];
  onTemplates: (list: ZaloTemplate[]) => void;
  selected: Set<string>;
  onSelect: (ids: string[], checked: boolean) => void;
  onOpen: (id: string) => void;
}) {
  const crm = useCRM(),
    [tab, setTab] = useState("bulk"),
    [key, setKey] = useState(templates[0]?.key || "expire_30"),
    [forced, setForced] = useState("auto"),
    [draft, setDraft] = useState<ZaloTemplate>(
      templates[0] || defaultTemplates[0],
    ),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [reset, setReset] = useState(false);
  const chosen = crm.rows.filter((k) => selected.has(k.id)),
    [previewId, setPreviewId] = useState("");
  const preview =
    crm.rows.find((k) => k.id === previewId) || chosen[0] || sample;
  function persist(list: ZaloTemplate[]) {
    try {
      localStorage.setItem(templateKey, JSON.stringify(list));
      onTemplates(list);
      crm.notify("Đã lưu mẫu Zalo trên trình duyệt này");
    } catch (e) {
      setError(readableError(e));
    }
  }
  async function copyAll() {
    setError("");
    try {
      await navigator.clipboard.writeText(
        chosen
          .map((k) => `${k.name}\n${buildScript(k, templates, forced)}`)
          .join("\n\n--------------------\n\n"),
      );
      crm.notify(
        `Đã sao chép nội dung cho ${chosen.length} khách. Chưa gửi tin nhắn.`,
      );
    } catch {
      setError(
        "Không sao chép được. Hãy chọn nội dung trong ô xem trước và sao chép thủ công.",
      );
    }
  }
  return (
    <div className="workspace-stack">
      <div className="segmented">
        <button
          className={tab === "bulk" ? "active" : ""}
          onClick={() => setTab("bulk")}
        >
          Soạn hàng loạt
        </button>
        <button
          className={tab === "templates" ? "active" : ""}
          onClick={() => setTab("templates")}
        >
          Quản lý mẫu
        </button>
      </div>
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      {tab === "bulk" ? (
        <div className="two-columns">
          <section className="content-panel">
            <div className="panel-heading">
              <div>
                <h3>Chọn khách hàng</h3>
                <p>{chosen.length} khách đã chọn</p>
              </div>
              {chosen.length > 0 && (
                <button
                  className="text-button"
                  onClick={() =>
                    onSelect(
                      chosen.map((k) => k.id),
                      false,
                    )
                  }
                >
                  Bỏ chọn
                </button>
              )}
            </div>
            <input
              aria-label="Tìm khách để soạn Zalo"
              placeholder="Tìm khách theo tên, SĐT…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="recipient-list">
              {crm.rows
                .filter((k) => matchesSearch(k, query))
                .map((k) => (
                  <label className="recipient" key={k.id}>
                    <input
                      type="checkbox"
                      checked={selected.has(k.id)}
                      onChange={(e) => onSelect([k.id], e.target.checked)}
                    />
                    <span>
                      <strong>{k.name}</strong>
                      <small>{k.phone || "Chưa có SĐT"}</small>
                    </span>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => onOpen(k.id)}
                    >
                      Hồ sơ
                    </button>
                  </label>
                ))}
            </div>
          </section>
          <section className="content-panel">
            <div className="panel-heading">
              <div>
                <h3>Nội dung cá nhân hóa</h3>
                <p>Chọn mẫu theo thời hạn hoặc dùng mẫu cụ thể.</p>
              </div>
            </div>
            <label>
              Mẫu nội dung
              <select
                value={forced}
                onChange={(e) => setForced(e.target.value)}
              >
                <option value="auto">Tự chọn theo hạn và loại khách</option>
                {templates.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            {!chosen.length ? (
              <Empty
                title="Chọn khách để soạn nội dung"
                detail="Nội dung sẽ tự điền tên, gói và ngày hết hạn của từng khách."
              />
            ) : (
              <>
                <div className="script-previews">
                  {chosen.map((k) => (
                    <div className="script-preview" key={k.id}>
                      <strong>{k.name}</strong>
                      <textarea
                        aria-label={`Nội dung Zalo ${k.name}`}
                        readOnly
                        value={buildScript(k, templates, forced)}
                        rows={7}
                      />
                    </div>
                  ))}
                </div>
                <button
                  className="button primary"
                  onClick={() => void copyAll()}
                >
                  <Copy size={17} />
                  Sao chép {chosen.length} nội dung
                </button>
                <p className="muted">
                  Ứng dụng tạo nội dung để bạn gửi thủ công qua Zalo.
                </p>
              </>
            )}
          </section>
        </div>
      ) : (
        <div className="two-columns">
          <section className="content-panel">
            <div className="panel-heading">
              <div>
                <h3>Mẫu tin nhắn</h3>
                <p>Lưu trên trình duyệt đang dùng.</p>
              </div>
            </div>
            <label>
              Chọn mẫu
              <select
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setDraft({
                    ...templates.find((t) => t.key === e.target.value)!,
                  });
                }}
              >
                {templates.map((t) => (
                  <option value={t.key} key={t.key}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tên mẫu
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label>
              Mô tả
              <input
                value={draft.desc}
                onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
              />
            </label>
            <label>
              Nội dung
              <textarea
                className="template-editor"
                rows={12}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
            </label>
            <div className="variable-list">
              {[
                "ten_lien_he",
                "ten_cong_ty",
                "mst",
                "sdt",
                "goi_cuoc",
                "gia_tien",
                "ngay_het_han",
                "so_ngay_con_lai",
                "so_ngay_qua_han",
                "tinh_trang_han",
              ].map((v) => (
                <button
                  key={v}
                  onClick={() =>
                    setDraft((d) => ({ ...d, body: d.body + `{${v}}` }))
                  }
                >{`{${v}}`}</button>
              ))}
            </div>
            <div className="tool-actions">
              <button
                className="button primary"
                disabled={!draft.name.trim() || !draft.body.trim()}
                onClick={() =>
                  persist(templates.map((t) => (t.key === key ? draft : t)))
                }
              >
                <Save size={16} />
                Lưu mẫu
              </button>
              <button
                className="button secondary"
                onClick={() => setReset(true)}
              >
                <RotateCcw size={16} />
                Mẫu mặc định
              </button>
            </div>
            {reset && (
              <div className="alert warning">
                <div>
                  Khôi phục sẽ thay toàn bộ mẫu đang lưu.
                  <div className="inline-actions">
                    <button
                      className="button secondary"
                      onClick={() => setReset(false)}
                    >
                      Hủy
                    </button>
                    <button
                      className="button primary"
                      onClick={() => {
                        persist(defaultTemplates);
                        setKey(defaultTemplates[0].key);
                        setDraft({ ...defaultTemplates[0] });
                        setReset(false);
                      }}
                    >
                      <Check size={16} />
                      Khôi phục
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
          <section className="content-panel">
            <div className="panel-heading">
              <div>
                <h3>Xem trước</h3>
                <p>Nội dung với thông tin khách hàng.</p>
              </div>
            </div>
            <label>
              Khách xem trước
              <select
                value={previewId}
                onChange={(e) => setPreviewId(e.target.value)}
              >
                <option value="">Khách mẫu / khách đã chọn</option>
                {crm.rows.map((k) => (
                  <option value={k.id} key={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="message-bubble">
              {buildScript(preview, [draft], draft.key)}
            </div>
            <div className="tool-actions">
              <button
                className="button secondary"
                onClick={() =>
                  download(
                    "mau-zalo-crm-cks.json",
                    JSON.stringify(templates, null, 2),
                  )
                }
              >
                <Download size={16} />
                Xuất mẫu
              </button>
              <label className="button secondary file-button">
                <Upload size={16} />
                Nhập mẫu
                <input
                  type="file"
                  accept=".json"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f)
                      try {
                        const list = mergeTemplates(JSON.parse(await f.text()));
                        persist(list);
                        setKey(list[0].key);
                        setDraft(list[0]);
                      } catch (err) {
                        setError(readableError(err));
                      }
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <p className="muted">
              Khi đổi trình duyệt hoặc địa chỉ ứng dụng, xuất mẫu ở nơi cũ rồi
              nhập tại đây.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
