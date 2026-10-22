"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { onSnapshot, updateDoc } from "firebase/firestore";
import { firebaseClient } from "@/lib/firebase";
import {
  carePatch,
  customerCollection,
  customerDoc,
  saveCustomer,
  saveRenewal,
  writeOperations,
  type WriteOperation,
} from "@/lib/repository";
import { careLabels, nextFollowUp, transactions } from "@/lib/domain";
import meta from "@/lib/legacy-meta.json";
import type {
  CareStatus,
  Customer,
  CustomerPatch,
  HistoryEntry,
} from "@/lib/types";

type Identity = { uid: string; email: string | null };
type State = {
  user: Identity | null;
  rows: Customer[];
  loading: boolean;
  authLoading: boolean;
  error: string;
  busy: boolean;
  notice: string;
  progress: string;
  testMode: boolean;
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  retry: () => void;
  save: (patch: CustomerPatch, id?: string) => Promise<void>;
  care: (
    id: string,
    status: CareStatus,
    title?: string,
    script?: string,
  ) => Promise<void>;
  renew: (id: string, entry: HistoryEntry) => Promise<void>;
  batch: (ops: WriteOperation[]) => Promise<void>;
  notify: (message: string) => void;
};
const Context = createContext<State | null>(null);
export function useCRM() {
  const value = useContext(Context);
  if (!value) throw new Error("CRM provider missing");
  return value;
}
export function readableError(error: unknown) {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    "auth/invalid-credential": "Email hoặc mật khẩu chưa đúng.",
    "auth/invalid-email": "Email không hợp lệ.",
    "auth/popup-closed-by-user": "Bạn đã đóng cửa sổ đăng nhập.",
    "auth/unauthorized-domain":
      "Tên miền này chưa được cho phép trong Firebase Authentication.",
    "auth/network-request-failed":
      "Không kết nối được. Kiểm tra mạng rồi thử lại.",
    "permission-denied":
      "Tài khoản chưa có quyền truy cập dữ liệu. Kiểm tra Firestore Rules.",
    "auth/too-many-requests":
      "Có quá nhiều lần thử. Vui lòng đợi rồi đăng nhập lại.",
  };
  return (
    (code && messages[code]) ||
    (error instanceof Error
      ? error.message
      : "Thao tác thất bại. Vui lòng thử lại.")
  );
}
const testMode =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_CRM_TEST_MODE === "1";
export default function CRMProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Identity | null>(null),
    [rows, setRows] = useState<Customer[]>([]);
  const [authLoading, setAuthLoading] = useState(true),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [progress, setProgress] = useState(""),
    [attempt, setAttempt] = useState(0);
  const lock = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((message: string) => {
    setNotice(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(""), 6000);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (testMode) {
      let active = true;
      import("@/lib/fixtures").then((m) => {
        if (active) {
          setRows(m.testCustomers());
          setUser({ uid: "fixture", email: "kiemthu@example.test" });
          setAuthLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }
    const { auth } = firebaseClient();
    return onAuthStateChanged(
      auth,
      (u) => {
        setRows([]);
        if (u && u.email?.toLowerCase() !== meta.allowedEmail.toLowerCase()) {
          setUser(null);
          setLoading(false);
          setAuthLoading(false);
          setError("Tài khoản này không được phép truy cập CRM.");
          void signOut(auth);
          return;
        }
        if (u) setError("");
        setUser(u ? { uid: u.uid, email: u.email } : null);
        setLoading(!!u);
        setAuthLoading(false);
      },
      (e) => {
        setError(readableError(e));
        setAuthLoading(false);
      },
    );
  }, []);
  useEffect(() => {
    if (!user || testMode) return;
    return onSnapshot(
      customerCollection(user.uid),
      (snap) => {
        setRows(
          snap.docs.map(
            (d) =>
              ({
                ...d.data(),
                id: d.id,
                name: String(d.data().name || ""),
              }) as Customer,
          ),
        );
        setLoading(false);
        setError("");
      },
      (e) => {
        setError(readableError(e));
        setLoading(false);
      },
    );
  }, [user, attempt]);
  async function action(work: () => Promise<void>, success: string) {
    if (lock.current) throw new Error("Một thao tác khác đang chạy.");
    lock.current = true;
    setBusy(true);
    try {
      await work();
      notify(success);
    } catch (e) {
      notify(readableError(e));
      throw e;
    } finally {
      lock.current = false;
      setBusy(false);
      setProgress("");
    }
  }
  function uid() {
    if (!user) throw new Error("Vui lòng đăng nhập lại.");
    return user.uid;
  }
  const state: State = {
    user,
    rows,
    loading,
    authLoading,
    error,
    busy,
    notice,
    progress,
    testMode,
    notify,
    retry: () => {
      setLoading(true);
      setAttempt((n) => n + 1);
    },
    login: async (email, password) => {
      setError("");
      await action(async () => {
        const { auth } = firebaseClient();
        const result =
          email && password
            ? await signInWithEmailAndPassword(auth, email, password)
            : await signInWithPopup(auth, new GoogleAuthProvider());
        if (
          result.user.email?.toLowerCase() !== meta.allowedEmail.toLowerCase()
        ) {
          await signOut(auth);
          throw new Error("Tài khoản này không được phép truy cập CRM.");
        }
      }, "Đăng nhập thành công");
    },
    logout: async () => {
      await action(async () => {
        if (!testMode) await signOut(firebaseClient().auth);
        setUser(null);
        setRows([]);
        setError("");
      }, "Đã đăng xuất");
    },
    save: async (patch, id) =>
      action(
        async () => {
          const owner = uid();
          if (testMode) {
            setRows((prev) =>
              id
                ? prev.map((k) =>
                    k.id === id ? ({ ...k, ...patch } as Customer) : k,
                  )
                : [
                    {
                      ...patch,
                      id: crypto.randomUUID(),
                      name: String(patch.name || ""),
                    } as Customer,
                    ...prev,
                  ],
            );
          } else
            await saveCustomer(
              owner,
              patch,
              id,
              rows.find((k) => k.id === id),
            );
        },
        id ? "Đã cập nhật khách hàng" : "Đã thêm khách hàng",
      ),
    care: async (id, status, title, script) =>
      action(async () => {
        const owner = uid();
        if (testMode)
          setRows((prev) =>
            prev.map((k) =>
              k.id === id
                ? ({
                    ...k,
                    ...(!script ? nextFollowUp(status) : {}),
                    careStatus: status,
                    lastCareAt: new Date().toISOString(),
                    careLogs: [
                      ...(k.careLogs || []),
                      {
                        type: script ? "zalo" : "care",
                        status,
                        title: title || careLabels[status],
                        script,
                        createdAt: new Date().toISOString(),
                      },
                    ],
                  } as Customer)
                : k,
            ),
          );
        else
          await updateDoc(
            customerDoc(owner, id),
            carePatch(status, title, script),
          );
      }, "Đã lưu chăm sóc và cập nhật lịch hẹn"),
    renew: async (id, entry) =>
      action(async () => {
        const owner = uid();
        if (testMode)
          setRows((prev) =>
            prev.map((k) =>
              k.id === id
                ? {
                    ...k,
                    expireDate: entry.expire || k.expireDate,
                    issueDate: entry.date,
                    price: entry.price,
                    pkg: entry.pkg,
                    careStatus: "renewed",
                    followUpDate: "",
                    followUpNote: "",
                    history: [
                      ...transactions(k).map((h) => ({
                        ...h,
                        _isCurrent: false,
                      })),
                      entry,
                    ],
                  }
                : k,
            ),
          );
        else await saveRenewal(owner, id, entry);
      }, "Đã ghi nhận gia hạn"),
    batch: async (ops) =>
      action(async () => {
        const owner = uid();
        let done = 0;
        try {
          if (testMode) {
            setRows((prev) => {
              const map = new Map(prev.map((k) => [k.id, k]));
              for (const op of ops) {
                if (op.remove) map.delete(op.id);
                else
                  map.set(op.id, {
                    ...map.get(op.id),
                    ...op.data,
                    id: op.id,
                  } as Customer);
              }
              return [...map.values()];
            });
          } else
            await writeOperations(owner, ops, (n) => {
              done = n;
              setProgress(`Đã xử lý ${n}/${ops.length}`);
            });
        } catch (e) {
          throw new Error(
            `Đã hoàn tất ${done}/${ops.length} bản ghi. ${readableError(e)} Hãy tải lại dữ liệu trước khi thử tiếp.`,
          );
        }
      }, `Đã xử lý ${ops.length} bản ghi`),
  };
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
