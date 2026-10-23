# Today workspace Implementation Plan

**Goal:** Deliver the four approved improvements to Công việc hôm nay: inline care actions, next-contact context, automatic advance, and clear appointment groups.

**Architecture:** Extract a TodayWorkspace client component. Derive one card per eligible customer from the existing task reasons, and respect future appointments so a completed contact leaves the actionable queue. Persist rescheduling and its history atomically through the existing CRM provider and Firestore document.

**Tech Stack:** Next.js 16.4, React 19, TypeScript, existing CSS, Firebase, node:test and Playwright.

## Decisions within the approved scope

- Keep existing care rules: called +3 days, waiting +1 day, Zalo sent +2 days. Closed/inactive customers are excluded.
- Cần làm excludes future appointments. Sắp đến hẹn shows the next seven calendar days in Vietnam. A future appointment beyond seven days remains stored in the customer profile.
- One customer card combines all actionable reasons. Filters and summary counts count customers, not duplicated reasons.
- Hẹn lại chooses tomorrow or later, requires a note, preserves care status and actual last-contact metadata, and adds an appointment history event without counting it as a contact in reports.
- Inline Đã gọi / Chờ phản hồi records an optional note. Failures keep the customer, input and filter in place. Successful writes focus the next matching customer at the previous card position; the final customer leads to an accessible empty state.
- Opening profiles/Zalo leaves the workspace mounted, preserving the filter and draft notes. Existing last-contact data is shown honestly; script-copy events and scheduling events are not presented as actual contact.

## Steps

1. Add `lib/work-queue.ts` and `lib/work-queue.test.ts`: date groups, aggregation, stable priority, schedule validation/history and actual contact extraction. Run unit tests.
2. Add a `reschedule` action to `components/crm-provider.tsx` and the matching atomic update helper in `lib/repository.ts`. Keep development adapter and Firestore behavior aligned.
3. Add `components/today-workspace.tsx`: four summary counts, task-group filters, contextual customer cards, inline actions and scheduling form, pending/error/result states, keyboard/scroll advance.
4. Replace the old today block in `components/crm-app.tsx`; use the actionable queue for the navigation indicator and Overview priority list in `components/reports.tsx`.
5. Add scoped responsive CSS to `app/globals.css`. Keep 44px actions, readable notes, visible focus and mobile bottom-nav clearance.
6. Add browser coverage in `tests/today-workspace.spec.ts` for quick actions, explicit scheduling, unchanged care status/last contact, queue advance/filter retention, error recovery, mobile and empty states. Keep all earlier tests intact.
7. Run unit tests, lint, typecheck, production build and the browser suite; inspect desktop/mobile screenshots and update interface/verification docs.
