# Tinh chỉnh giao diện CRM CKS

Tiếp tục phạm vi đã thống nhất: CRM tiếng Việt, navy/nền sáng, ưu tiên khách hết hạn trong 30 ngày, dùng trên desktop và điện thoại. Lượt này tinh chỉnh trình bày; giữ nghiệp vụ, Firebase, dữ liệu và cách điều hướng hiện có.

## Hệ thống hình ảnh

- Navy #17324D: menu, tiêu đề và nhận diện.
- Teal #126D64: thao tác chính, focus và tín hiệu kết nối.
- Nền #F3F6F9, giấy #FFFFFF: tách nền và nội dung dữ liệu.
- Mực #24374B: nội dung, phụ #607286.
- Cảnh báo dùng amber và đỏ có nhãn chữ; không dựa riêng vào màu.
- Giữ Be Vietnam Pro cho tiếng Việt. Nội dung chính 14–16px, phụ 12–13px; số dùng tabular numerals. Form mobile 16px để tránh trình duyệt tự zoom.

## Bố cục

Desktop: rail navy 248px, header trắng gọn, vùng làm việc canh trái. Thống kê nằm trong một dải có vạch phân cách, không dùng bốn hộp nổi giống nhau. Danh sách là trọng tâm: tên nổi bật, liên hệ phụ, ngày và nhãn còn hạn cùng cột; thao tác 44px dễ dùng.

```
Menu navy | Đường dẫn                         Thêm khách
          | Nhắc gia hạn                     Ngày hiện tại
          | Chỉ số / Chỉ số / Chỉ số / Chỉ số
          | Khách sắp hết hạn             7 / 30 / 90 ngày
          | Tìm kiếm                 Chăm sóc / Gói
          | Khách hàng    Liên hệ    Hạn    Chăm sóc   Thao tác
```

Điện thoại: header thương hiệu và nút thêm, chỉ số thành dải 2×2 ngắn hơn desktop, bộ lọc bật khi cần, danh sách thẻ và bottom nav 4 mục. Hạn khẩn có vạch trạng thái nhỏ; nút gọi/Zalo/hồ sơ dễ chạm. Hồ sơ vẫn toàn màn hình.

Login: nền navy ở phần nhận diện, ba bước Theo dõi / Liên hệ / Gia hạn trình bày như chuỗi việc thực tế; form trắng tập trung, nhãn rõ. Không đưa số liệu hoặc khách hàng giả vào giao diện thật.

## Rà soát lựa chọn

Không thêm banner quảng bá hoặc biểu đồ trang trí vào trang nhắc hạn. Bỏ nhãn phụ lặp lại trên đầu trang và các shadow đồng loạt. Dồn điểm nhấn vào menu navy và thứ bậc bảng. Mỗi màu trạng thái đi kèm nhãn, các bề mặt lớn còn lại giữ trung tính để làm việc lâu.

## Kiểm chứng

Chạy các luồng hiện có với dữ liệu tổng hợp, kiểm tra ảnh 360/768/1440px, focus bàn phím, tràn ngang, dialog và báo cáo. Lint, TypeScript và build trước bàn giao. Không thay đổi hoặc ghi dữ liệu Firebase thật khi kiểm tra giao diện.
