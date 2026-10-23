# Service packages and prices Implementation Plan

**Goal:** Give each of the four additional dated services its own package and VND price, alongside its existing start/end dates.

**Architecture:** Extend existing `servicePeriods` entries with optional `pkg` and `price`, preserving existing documents and signature fields. Store and display each service independently. Keep current signature financial reports and renewal transactions scoped to signature.

**Tech Stack:** Existing Next.js 16.4, React, TypeScript, Firebase, SheetJS and Playwright.

1. Extend the entry type. Add free-text package inputs (suggest existing values for that service) and non-negative integer VND price inputs. Validate inline, preserve zero prices and retain saved information when deselected.
2. Display package/price with each service's dates in customer profiles. Make package filtering respect the selected service; keep signature values independent.
3. Extend Excel headers/mapping/template/preview with eight package/price columns, retain the eight existing date columns, preserve omitted values in partial updates, and validate backup package/price types. Round-trip JSON unchanged.
4. Test all four independent packages/prices, zero/invalid values, deselect/reselect, package filtering and partial Excel/JSON round-trips. Verify mobile/desktop, existing dates, full browser/unit suite, lint/types/build/format. Update usage and verification docs. No production writes or deployment.
