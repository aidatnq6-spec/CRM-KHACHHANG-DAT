import test from "node:test";
import assert from "node:assert/strict";
import {
  appointmentGroup,
  appointmentUpdate,
  lastContact,
  matchesWorkFilter,
  workQueue,
} from "./work-queue";
import { nextFollowUp, reportData } from "./domain";
import type { Customer } from "./types";
const today = "2026-10-23";
const customer = (id: string, patch: Partial<Customer> = {}): Customer => ({
  id,
  name: id,
  expireDate: "2026-10-24",
  ...patch,
});

test("work queue: merge reasons and count a customer once; overdue first", () => {
  const rows = [
    customer("due", { followUpDate: today, careStatus: "waiting" }),
    customer("late", { followUpDate: "2026-10-21" }),
  ];
  const queue = workQueue(rows, today);
  assert.deepEqual(
    queue.map((item) => item.customer.id),
    ["late", "due"],
  );
  assert.equal(queue[1].reasons.length, 3);
  assert.equal(
    queue.filter((item) => matchesWorkFilter(item, "all")).length,
    2,
  );
  assert.equal(
    queue.filter((item) => matchesWorkFilter(item, "today")).length,
    1,
  );
  assert.equal(
    queue.filter((item) => matchesWorkFilter(item, "waiting")).length,
    1,
  );
});

test("work queue: future appointments defer urgent/waiting work; 7-day boundary and closed customers", () => {
  const queue = workQueue(
    [
      customer("tomorrow", {
        followUpDate: "2026-10-24",
        careStatus: "waiting",
      }),
      customer("seven", { followUpDate: "2026-10-30" }),
      customer("eight", { followUpDate: "2026-10-31" }),
      customer("inactive", { status: "inactive" }),
      customer("renewed", { careStatus: "renewed" }),
      customer("declined", { careStatus: "declined" }),
    ],
    today,
  );
  assert.deepEqual(
    queue.map((item) => item.customer.id),
    ["tomorrow", "seven"],
  );
  assert.equal(
    queue.filter((item) => matchesWorkFilter(item, "all")).length,
    0,
  );
  assert.equal(
    queue.filter((item) => matchesWorkFilter(item, "urgent")).length,
    0,
  );
  assert.equal(
    queue.filter((item) => matchesWorkFilter(item, "upcoming")).length,
    2,
  );
  assert.equal(
    appointmentGroup(customer("bad", { followUpDate: "2026-02-30" }), today),
    "none",
  );
});

test("work queue: care completion defers all reasons until the scheduled day", () => {
  for (const careStatus of ["called", "waiting"] as const) {
    const row = customer("a", {
      expireDate: "2026-10-22",
      followUpDate: today,
    });
    assert.equal(
      workQueue([row], today).filter((item) => matchesWorkFilter(item, "all"))
        .length,
      1,
    );
    const updated = { ...row, ...nextFollowUp(careStatus, today), careStatus };
    assert.equal(
      workQueue([updated], today).filter((item) =>
        matchesWorkFilter(item, "all"),
      ).length,
      0,
    );
    assert.equal(
      workQueue([updated], updated.followUpDate).filter((item) =>
        matchesWorkFilter(item, "all"),
      ).length,
      1,
    );
  }
});

test("rescheduling validates date/note and does not invent a contact or change care status", () => {
  for (const date of [today, "2026-10-22", "2026-02-30", ""])
    assert.throws(() => appointmentUpdate(date, "Gọi lại", today));
  assert.throws(() => appointmentUpdate("2026-10-24", "   ", today));
  const update = appointmentUpdate("2026-10-24", "  Trao đổi gia hạn  ", today);
  assert.deepEqual(update.patch, {
    followUpDate: "2026-10-24",
    followUpNote: "Trao đổi gia hạn",
  });
  assert.equal(update.log.status, undefined);
  const row = customer("a", {
    careStatus: "waiting",
    lastCareAt: "2026-10-22T09:00:00Z",
    careLogs: [update.log],
  });
  assert.equal(lastContact(row)?.at, row.lastCareAt);
  assert.equal(reportData([row], today).months.at(-1)?.touched.size, 0);
});

test("last contact uses genuine history, ignoring copy and schedule events", () => {
  const row = customer("a", {
    lastCareAt: "2026-10-23T05:00:00Z",
    careLogs: [
      {
        type: "care",
        status: "called",
        title: "Khách muốn báo giá",
        createdAt: "2026-10-22T08:00:00Z",
      },
      {
        type: "zalo",
        status: "called",
        script: "Nội dung sao chép",
        createdAt: "2026-10-23T05:00:00Z",
      },
      {
        type: "appointment",
        title: "Hẹn lại",
        createdAt: "2026-10-23T06:00:00Z",
      },
    ],
  });
  assert.deepEqual(lastContact(row), {
    at: "2026-10-22T08:00:00Z",
    note: "Khách muốn báo giá",
  });
  assert.equal(
    lastContact(
      customer("a", {
        lastCareAt: row.lastCareAt,
        careLogs: [row.careLogs![1]],
      }),
    ),
    null,
  );
});
