# Customer services Implementation Plan

**Goal:** Allow each customer to select multiple services from the approved nine-item catalog and filter customers by any one service, preserving existing signature data.

**Architecture:** Add optional `services` IDs to customer documents. Read legacy customers without the field as Chữ ký số, without bulk migration. Reuse existing save, JSON backup and Firestore paths. Additional services are classifications only; signature pricing, dates and history remain in their existing fields.

**Tech Stack:** Next.js 16.4, React 19, TypeScript, CSS, Firebase, SheetJS, node:test and Playwright.

## Approved scope and implementation choices

- One customer can use many services. No separate pricing, expiry or history for additional services.
- Use a fixed catalog with all nine user-supplied Vietnamese names and stable IDs. Require at least one selection in the form; default new and legacy customers to signature.
- Show service selection in create/edit, readable labels in list/profile, and an exact service dropdown combinable with current filters. Keep compact list labels from overwhelming the existing table.
- For non-signature-only customers, do not require signature fields or count retained dates as active signature expiry. Deselecting signature does not delete saved signature information; reselecting exposes it again. Customer activity and care remain customer-wide.
- Excel adds a semicolon-separated Dịch vụ column and template example. Omitted/blank cells preserve existing values during updates. Recognize catalog names/IDs, report unknown values; JSON preserves selected services and validates the new field when supplied.
- Preserve the existing Zalo nowrap fix already in the working tree.

## Steps and verification

1. Add catalog, legacy normalization, import parsing and display helpers in `lib/services.ts`, add `ServiceId` and `services` to `lib/types.ts`; unit-test legacy defaults, multi-selection and parser behavior.
2. Update `components/customer-form.tsx`, `components/customer-detail.tsx`, `components/customer-list.tsx` and shared service labels. Keep signature values mounted/preserved when not selected; update CSS for keyboard/touch/readability and responsive filtering.
3. Reuse the signature-membership helper in relevant expiry, data-issue and dashboard calculations so AI-only customers are not treated as signature subscribers. Keep legacy behavior identical.
4. Extend Excel/JSON in `lib/transfer.ts` with focused tests and visible import-preview services.
5. Add browser tests for create/edit multiple services, legacy records, combined filters/reset, signature preservation, service-only customers, import/export and mobile layout.
6. Run unit tests, lint/typecheck/build and the full browser suite; inspect desktop/mobile screenshots, then update documentation. No production writes or deployment.
