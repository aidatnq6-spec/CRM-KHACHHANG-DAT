import type { AdditionalDatedServiceId, Customer, ServiceId } from "./types";

export const serviceCatalog: { id: ServiceId; label: string }[] = [
  { id: "digital_signature", label: "Chữ ký số" },
  { id: "social_insurance", label: "Bảo hiểm xã hội" },
  { id: "e_invoice", label: "Hóa đơn điện tử" },
  { id: "pit_withholding", label: "Phần mềm Khấu trừ thuế TNCN" },
  { id: "apartment_rental", label: "Căn hộ cho thuê" },
  { id: "ai_training", label: "Đào tạo AI" },
  { id: "financial_training", label: "Đào tạo đầu tư tài chính" },
  { id: "investment_brokerage", label: "Môi giới đầu tư" },
  { id: "other", label: "Khác" },
];
export const isServiceId = (value: unknown): value is ServiceId =>
  serviceCatalog.some((service) => service.id === value);
export const additionalDatedServices = serviceCatalog.filter(
  (service): service is { id: AdditionalDatedServiceId; label: string } =>
    [
      "social_insurance",
      "e_invoice",
      "pit_withholding",
      "apartment_rental",
    ].includes(service.id),
);
export function selectedServicePeriods(customer: Customer) {
  return servicesOf(customer).flatMap<{
    serviceId: ServiceId;
    startDate: string;
    endDate: string;
  }>((serviceId) => {
    if (serviceId === "digital_signature")
      return [
        {
          serviceId,
          startDate: customer.issueDate || "",
          endDate: customer.expireDate || "",
        },
      ];
    const dated = additionalDatedServices.find(
      (service) => service.id === serviceId,
    );
    if (!dated) return [];
    const period = customer.servicePeriods?.[dated.id];
    return [
      {
        serviceId,
        startDate: period?.startDate || "",
        endDate: period?.endDate || "",
      },
    ];
  });
}
export const serviceLabel = (id: ServiceId) =>
  serviceCatalog.find((service) => service.id === id)!.label;
export function servicesOf(customer: Pick<Customer, "services">): ServiceId[] {
  if (!Array.isArray(customer.services)) return ["digital_signature"];
  return serviceCatalog
    .filter((service) => customer.services!.includes(service.id))
    .map((service) => service.id);
}
export const hasSignature = (customer: Pick<Customer, "services">) =>
  servicesOf(customer).includes("digital_signature");
export const servicesText = (customer: Pick<Customer, "services">) =>
  servicesOf(customer).map(serviceLabel).join("; ") || "Chưa phân loại";
const normalized = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
export function parseServices(raw: unknown): ServiceId[] {
  if (typeof raw !== "string" && !Array.isArray(raw))
    throw new Error("Dịch vụ phải là danh sách tên hoặc mã dịch vụ.");
  const entries = Array.isArray(raw) ? raw : raw.split(/[;|,\n]+/);
  if (
    entries.length === 1 &&
    typeof entries[0] === "string" &&
    normalized(entries[0]) === normalized("Chưa phân loại")
  )
    return [];
  const ids = entries
    .filter((entry) => String(entry).trim())
    .map((entry) => {
      if (typeof entry !== "string")
        throw new Error("Tên dịch vụ không hợp lệ.");
      const service = serviceCatalog.find(
        (item) =>
          normalized(item.id) === normalized(entry) ||
          normalized(item.label) === normalized(entry),
      );
      if (!service) throw new Error(`Dịch vụ không nhận diện: ${entry}.`);
      return service.id;
    });
  return serviceCatalog
    .filter((service) => ids.includes(service.id))
    .map((service) => service.id);
}
