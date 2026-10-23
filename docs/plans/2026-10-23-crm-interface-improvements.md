# CRM interface improvements Implementation Plan

> Implement the user-approved sequence in this session, checking each stage before proceeding.

**Goal:** Make CRM CKS easier to read and faster to use on desktop and mobile.

**Architecture:** Keep the existing client components, Firebase repository and Vietnamese calendar rules. Reuse the existing care action for explicit Zalo confirmation so the current two-day follow-up rule remains authoritative. Keep report data calculations intact; filter the displayed monthly history only.

**Tech Stack:** Next.js 16.4, React 19, TypeScript, CSS, Playwright.

---

### 1. Typography and forms

- Modify `app/globals.css`, `components/customer-form.tsx`.
- Raise small working text to 12–14px, retain 16px mobile form fields, fix required label layout.
- Group supplementary fields in a disclosure, open by default when editing; preserve submitted values while collapsed.
- Validate name, nonnegative price and date order beside their fields; focus the first error.
- Keep customer-form save/cancel actions visible while scrolling.

### 2. Compact mobile

- Modify `components/crm-app.tsx`, `components/reports.tsx`, `app/globals.css`.
- Add accessible mobile summary disclosure, reduce introductory spacing, retain visible test-mode identification.
- Preserve safe-area padding, bottom navigation and touch targets. Verify 360/390/768/1024/1440px.

### 3. Care and Zalo

- Move care section directly after profile actions in `components/customer-detail.tsx`.
- Add explicit “Tôi đã gửi” confirmation in `components/crm-app.tsx`, with pending/error/success states and duplicate protection.
- Copy/open actions never imply that a message was sent. Confirmation calls `crm.care(id, "zalo_sent")` without script to apply existing follow-up scheduling.

### 4. Filters and reports

- Modify `components/customer-list.tsx`, `components/crm-app.tsx`, `components/reports.tsx`.
- Add combinable quick filters for uncontacted customers, expiry today, and appointments due; show removable active filters and accurate sort description.
- Make the uncontacted summary open the corresponding 30-day list filter; reset list filters when navigating.
- Rename status distribution; give Overview an actionable priority queue, Reports a 3/6-month history selector and explicit reporting scope.
- Preserve whole-portfolio KPIs, exports and printed data; label the monthly selector scope clearly.

### 5. Verification

- Extend `tests/crm.spec.ts` with validation, combined filters, Zalo confirmation/follow-up, summary disclosure and report-period coverage.
- Run `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run test:browser`.
- Inspect actual screenshots of mobile, desktop, form and profile, including mobile keyboard focus and sticky actions.
- Update `docs/interface-direction.md` and `docs/verification.md` with final behavior and validation.
