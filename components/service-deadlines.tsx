import { fmtDate, matchingDeadlines, type DeadlineRange } from "@/lib/domain";
import { additionalDatedServices, serviceLabel } from "@/lib/services";
import type { Customer } from "@/lib/types";
import { ExpiryBadge } from "./ui";

export default function ServiceDeadlines({
  customer,
  service,
  range,
}: {
  customer: Customer;
  service?: string;
  range?: DeadlineRange;
}) {
  const periods = matchingDeadlines(customer, undefined, range, service);
  if (!periods.length)
    return (
      <ExpiryBadge
        customer={customer}
        service={
          service === "digital_signature" ||
          additionalDatedServices.some((item) => item.id === service)
            ? service
            : undefined
        }
      />
    );
  return (
    <div className="service-deadlines">
      {periods.map((period) => (
        <div className="service-deadline" key={period.serviceId}>
          {(periods.length > 1 || period.serviceId !== "digital_signature") && (
            <small>{serviceLabel(period.serviceId)}</small>
          )}
          <span className="date-text">{fmtDate(period.endDate)}</span>
          <ExpiryBadge customer={customer} service={period.serviceId} />
        </div>
      ))}
    </div>
  );
}
