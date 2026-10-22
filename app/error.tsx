"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="boot-screen">
      <h1>Chưa mở được trang này</h1>
      <p>
        Thử tải lại trang. Nếu lỗi vẫn còn, kiểm tra kết nối rồi mở lại ứng
        dụng.
      </p>
      <button className="button primary" onClick={reset}>
        Thử lại
      </button>
    </main>
  );
}
