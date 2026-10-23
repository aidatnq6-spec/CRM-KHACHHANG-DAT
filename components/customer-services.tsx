import { isServiceId, serviceLabel, servicesOf } from "@/lib/services";
import type { Customer } from "@/lib/types";

export default function CustomerServices({
  customer,
  compact = false,
  selectedService,
  onShow,
}: {
  customer: Customer;
  compact?: boolean;
  selectedService?: string;
  onShow?: () => void;
}) {
  const services = servicesOf(customer);
  const ordered =
    selectedService &&
    isServiceId(selectedService) &&
    services.includes(selectedService)
      ? [selectedService, ...services.filter((id) => id !== selectedService)]
      : services;
  const shown = compact ? ordered.slice(0, 2) : ordered;
  return (
    <div
      className="customer-services"
      role="list"
      aria-label="Dịch vụ của khách hàng"
    >
      {shown.length ? (
        shown.map((id) => (
          <span className="service-chip" role="listitem" key={id}>
            {serviceLabel(id)}
          </span>
        ))
      ) : (
        <span className="service-chip muted" role="listitem">
          Chưa phân loại
        </span>
      )}
      {compact && services.length > shown.length && (
        <span role="listitem">
          <button
            className="service-more"
            onClick={onShow}
            aria-label={`Xem toàn bộ ${services.length} dịch vụ của ${customer.name}`}
          >
            +{services.length - shown.length} dịch vụ
          </button>
        </span>
      )}
    </div>
  );
}
