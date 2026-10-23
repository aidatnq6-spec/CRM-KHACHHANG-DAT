# Service periods Implementation Plan

**Goal:** Store separate start/end dates for social insurance, e-invoice, PIT withholding software and apartment rental, and include their deadlines in profiles, reminders and today's work.

**Architecture:** Preserve signature `issueDate`/`expireDate`. Add a typed `servicePeriods` map for the four additional dated services. Read only selected services for deadlines; retain deselected services' saved dates. Keep signature financial reports and charts scoped to signature.

**Tech Stack:** Existing Next.js 16.4, React, TypeScript, Firebase, SheetJS and Playwright.

1. Extend types/catalog helpers and add deadline normalization, sorting, range and status helpers. Test independent dates, legacy compatibility, boundaries and deduplicated customers.
2. Add date fieldsets to customer create/edit with inline date validation and error focus. Mount hidden fields to preserve drafts; retain saved dates when deselected. Display dates per service in the profile.
3. Make reminder membership, counts, range/service/status filters and visible deadline labels service-aware. Keep original customer IDs and signature fields. Show all matching deadlines on each customer; show specific reasons in today's grouped queue. Preserve signature-only Dashboard links using a preselected service filter.
4. Extend Excel with eight named date columns and JSON validation; merge partial period imports without dropping sibling services. Preview periods and preserve omitted fields. No separate pricing or renewal transaction model for these services.
5. Test form save/reopen, validation, multiple deadlines per customer, filters, expired/7/30/90-day boundaries, today reasons, deselect/reselect, Excel/JSON and mobile. Run full checks, inspect screenshots, update usage/verification docs. No production writes or deployment.
