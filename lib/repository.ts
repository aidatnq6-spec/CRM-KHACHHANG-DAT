import {
  arrayUnion,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  writeBatch,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { firebaseClient } from "./firebase";
import {
  careLabels,
  careOf,
  nextFollowUp,
  todayVN,
  transactions,
} from "./domain";
import type {
  CareStatus,
  Customer,
  CustomerPatch,
  HistoryEntry,
} from "./types";
import { appointmentUpdate } from "./work-queue";

export function customerCollection(uid: string) {
  return collection(firebaseClient().db, "users", uid, "cksCustomers");
}
export function customerDoc(uid: string, id: string) {
  return doc(customerCollection(uid), id);
}
export function carePatch(status: CareStatus, title?: string, script = "") {
  const log = {
    type: script ? "zalo" : "care",
    title: title || `Cập nhật trạng thái: ${careLabels[status]}`,
    status,
    script,
    createdAt: new Date().toISOString(),
  };
  return {
    ...(!script ? nextFollowUp(status) : {}),
    careStatus: status,
    lastCareAt: log.createdAt,
    lastCareNote: log.title,
    careLogs: arrayUnion(log),
    updatedAt: serverTimestamp(),
  };
}
export function appointmentPatch(date: string, note: string) {
  const { patch, log } = appointmentUpdate(date, note);
  return { ...patch, careLogs: arrayUnion(log), updatedAt: serverTimestamp() };
}
export function withoutUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withoutUndefined) as T;
  if (
    value &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  )
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, withoutUndefined(v)]),
    ) as T;
  return value;
}
export async function saveCustomer(
  uid: string,
  patch: CustomerPatch,
  id?: string,
  previous?: Customer,
) {
  const changedCare =
    patch.careStatus &&
    patch.careStatus !== (previous ? careOf(previous) : "not_contacted");
  const data = withoutUndefined({
    ...(changedCare ? carePatch(patch.careStatus!) : {}),
    ...patch,
    updatedAt: serverTimestamp(),
  });
  if (id) await updateDoc(customerDoc(uid, id), data);
  else
    await addDoc(customerCollection(uid), {
      ...data,
      createdAt: serverTimestamp(),
    });
}
export async function saveRenewal(
  uid: string,
  id: string,
  entry: HistoryEntry,
) {
  const ref = customerDoc(uid, id);
  await runTransaction(firebaseClient().db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists())
      throw new Error("Khách hàng không còn tồn tại. Hãy tải lại dữ liệu.");
    const previous = { ...snap.data(), id: snap.id } as Customer;
    const history = transactions(previous).map((h) => ({
      ...h,
      _isCurrent: false,
    }));
    history.push({
      ...entry,
      addedAt: new Date().toISOString(),
      _isCurrent: false,
    });
    tx.update(
      ref,
      withoutUndefined({
        history,
        ...(entry.expire ? { expireDate: entry.expire } : {}),
        ...(entry.price != null ? { price: entry.price } : {}),
        ...(entry.pkg ? { pkg: entry.pkg } : {}),
        ...carePatch("renewed"),
        issueDate: entry.date || todayVN(),
      }),
    );
  });
}
export type WriteOperation = {
  id: string;
  data?: Partial<Customer>;
  remove?: boolean;
  preserveTimestamps?: boolean;
};
export async function writeOperations(
  uid: string,
  operations: WriteOperation[],
  progress: (n: number) => void,
) {
  const { db } = firebaseClient();
  let completed = 0;
  for (let i = 0; i < operations.length; i += 400) {
    const part = operations.slice(i, i + 400),
      batch = writeBatch(db);
    for (const item of part) {
      const ref = customerDoc(uid, item.id);
      if (item.remove) batch.delete(ref);
      else {
        const data = { ...item.data };
        delete data.id;
        batch.set(
          ref,
          withoutUndefined(
            item.preserveTimestamps
              ? data
              : { ...data, updatedAt: serverTimestamp() },
          ),
          { merge: true },
        );
      }
    }
    await batch.commit();
    completed += part.length;
    progress(completed);
  }
}
