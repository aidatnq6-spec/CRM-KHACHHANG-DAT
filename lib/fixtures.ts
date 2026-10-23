import { dateAfter, todayVN } from "./domain";
import type { Customer } from "./types";

// Synthetic data only. Imported solely by the explicit development test mode.
export function testCustomers(): Customer[] {
  const names = [
    "Công ty Minh Anh",
    "Nguyễn Hoàng Nam",
    "Công ty Phương Đông",
    "Trần Thị Lan",
    "Công ty An Phát",
    "Lê Minh Đức",
    "Hộ kinh doanh Thanh Hà",
    "Công ty Bình Minh",
  ];
  return Array.from({ length: 36 }, (_, i) => ({
    id: `fixture-${i}`,
    name: `${names[i % names.length]}${i > 7 ? ` ${i + 1}` : ""}`,
    customId: `KH${String(i + 1).padStart(4, "0")}`,
    bizName: i % 3 ? names[i % names.length] : "",
    contact: "Anh/chị phụ trách",
    phone: `0901234${String(i).padStart(3, "0")}`,
    mst: `0301234${String(i).padStart(3, "0")}`,
    pkg: `Gói ${(i % 3) + 1} năm`,
    price: 1200000 + i * 50000,
    issueDate: dateAfter(-300),
    expireDate: dateAfter(
      i === 0
        ? 0
        : i === 1
          ? 30
          : i === 2
            ? 31
            : i === 3
              ? -2
              : i < 24
                ? i
                : 100,
    ),
    status: i === 30 ? "inactive" : "active",
    careStatus: (
      [
        "not_contacted",
        "called",
        "waiting",
        "renewed",
        "zalo_sent",
        "declined",
      ] as const
    )[i % 6],
    followUpDate:
      i === 8
        ? dateAfter(-2)
        : i === 16
          ? dateAfter(1)
          : i === 20
            ? dateAfter(7)
            : i === 24
              ? dateAfter(8)
              : i === 28
                ? dateAfter(3)
                : i % 4 === 0
                  ? todayVN()
                  : "",
    followUpNote:
      i === 8
        ? "Trao đổi báo giá gia hạn, khách hẹn gọi buổi sáng"
        : i % 4 === 0
          ? "Kiểm tra nhu cầu và tư vấn gói gia hạn"
          : "",
    lastCareAt: i === 4 || i === 8 ? `${dateAfter(-1)}T02:30:00Z` : undefined,
    history:
      i % 5 === 0
        ? [
            {
              date: dateAfter(-20),
              expire: dateAfter(345),
              pkg: "Gói 1 năm",
              price: 1200000,
            },
          ]
        : [],
    careLogs:
      i === 4 || i === 8
        ? [
            {
              type: "care",
              status: i === 4 ? "zalo_sent" : "waiting",
              title: "Khách muốn trao đổi báo giá gia hạn",
              createdAt: `${dateAfter(-1)}T02:30:00Z`,
            },
          ]
        : [],
    note: "Dữ liệu kiểm thử tổng hợp",
  }));
}
