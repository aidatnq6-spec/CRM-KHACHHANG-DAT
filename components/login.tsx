"use client";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarClock,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { readableError, useCRM } from "./crm-provider";
export default function Login() {
  const crm = useCRM(),
    [error, setError] = useState(""),
    [show, setShow] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError("");
    try {
      await crm.login(String(data.get("email")), String(data.get("password")));
    } catch (err) {
      setError(readableError(err));
    }
  }
  return (
    <main className="login-shell">
      <section className="login-story">
        <div className="brand">
          <span className="brand-mark">
            <ShieldCheck />
          </span>
          <div>
            CRM CKS<small>Chăm sóc & gia hạn</small>
          </div>
        </div>
        <div className="login-message">
          <CalendarClock size={46} strokeWidth={1.2} />
          <h1>
            Đúng thời điểm.
            <br />
            Trọn sự chăm sóc.
          </h1>
          <p>
            Theo dõi hạn chữ ký số, chủ động liên hệ và đồng hành cùng khách
            hàng.
          </p>
          <div className="login-note">
            <span className="pulse-dot" />
            Mọi lịch hẹn, trong một nơi.
          </div>
        </div>
        <small>Không bỏ lỡ một kỳ gia hạn.</small>
      </section>
      <section className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <span className="section-note">Không gian làm việc của bạn</span>
          <h2>Chào mừng trở lại</h2>
          <p>Đăng nhập để xem khách hàng cần chăm sóc hôm nay.</p>
          {(error || crm.error) && (
            <div className="alert error" role="alert">
              {error || crm.error}
            </div>
          )}
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="username"
              placeholder="Nhập email của bạn"
              required
            />
          </label>
          <label>
            Mật khẩu
            <div className="password-wrap">
              <input
                name="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                required
              />
              <button
                type="button"
                className="icon-button"
                aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <button className="button primary" disabled={crm.busy}>
            Đăng nhập <ArrowRight size={17} />
          </button>
          <div className="divider">
            <span>hoặc</span>
          </div>
          <button
            type="button"
            className="button secondary"
            disabled={crm.busy}
            onClick={async () => {
              setError("");
              try {
                await crm.login();
              } catch (err) {
                setError(readableError(err));
              }
            }}
          >
            Tiếp tục với Google
          </button>
          <small className="muted">
            Dành cho tài khoản được cấp quyền sử dụng CRM.
          </small>
        </form>
      </section>
    </main>
  );
}
