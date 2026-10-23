# Actionable Dashboard Implementation Plan

**Goal:** Implement the approved Dashboard: four clickable KPIs, priority and appointment layout, six-month expiry chart, and care results.

**Architecture:** Add a dedicated Dashboard client component and pure dashboard calculations. Keep Reports as its own screen. Reuse the current reminders and work queue; expose an initial work filter so the overdue KPI opens the matching group. Calendar, month and care-result selections show the matching customer list inside Dashboard with pagination and profile access.

**Tech Stack:** Next.js 16.4, React 19, TypeScript, existing CSS/Lucide/Firebase data, node:test, Playwright.

## Data and interaction decisions

- Overdue = actionable work-queue customers with overdue appointments; closed/inactive exclusions match Today.
- Seven-day expiry and uncontacted-in-30-days reuse existing reminders rules. Forecast uses the existing report estimate, with a visible note that missing prices use the portfolio average and values are not money collected.
- Calendar shows today plus six days, counting unique eligible customers per appointment date. Each day exposes its customer list; all records remain reachable through pagination.
- Expiry chart covers today through the last day of the sixth calendar month, six buckets including the current remaining month. Inactive and invalid/past expiries are excluded; care status does not redefine service expiry.
- Care results use inclusive rolling 7/30/90-day periods in Vietnam. Count distinct existing customer IDs with genuine care events; exclude script-copy and appointment-only events. Renewed customers come from explicit renewed care events or non-current history transactions. Present both counts independently, without inventing collected revenue or a conversion rate.
- Empty states and zero chart values remain truthful. All chart/day controls support keyboard, labels and pressed states. Mobile shows KPIs and priority first.

## Implementation

1. Add `lib/dashboard.ts` and unit tests for calendar/month boundaries, exclusions, uniqueness, timezone boundaries, estimate and independent period outcomes.
2. Add `components/dashboard.tsx` using shared Stats, priority list, seven-day picker, month bar buttons, rolling-period controls and matching paginated lists.
3. Update `components/crm-app.tsx` to render Dashboard separately and route KPIs to correct reminders/work filters; add `initialFilter` to TodayWorkspace. Preserve existing Reports and tests.
4. Add responsive CSS; verify 360/768/1024/1440px, keyboard and print.
5. Add `tests/dashboard.spec.ts` covering all KPI destinations, day/month/result selection, period filtering, customer profiles and pagination where data permits.
6. Run unit tests, lint, typecheck, build and browser tests; inspect screenshots and update interface/verification docs.
