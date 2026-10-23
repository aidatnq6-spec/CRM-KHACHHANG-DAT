export type CareStatus =
  "not_contacted" | "zalo_sent" | "called" | "waiting" | "renewed" | "declined";
export type ServiceId =
  | "digital_signature"
  | "social_insurance"
  | "e_invoice"
  | "pit_withholding"
  | "apartment_rental"
  | "ai_training"
  | "financial_training"
  | "investment_brokerage"
  | "other";
export type AdditionalDatedServiceId =
  "social_insurance" | "e_invoice" | "pit_withholding" | "apartment_rental";
export interface ServicePeriod {
  pkg?: string;
  price?: number;
  startDate?: string;
  endDate?: string;
}
export interface HistoryEntry {
  date?: string;
  pkg?: string | number;
  price?: number;
  expire?: string;
  note?: string;
  addedAt?: string;
  _isCurrent?: boolean;
}
export interface CareLog {
  type?: string;
  title?: string;
  status?: string;
  script?: string;
  createdAt?: string;
}
export interface Customer {
  id: string;
  name: string;
  customId?: string;
  contact?: string;
  mst?: string;
  bizName?: string;
  address?: string;
  phone?: string;
  services?: ServiceId[];
  servicePeriods?: Partial<Record<AdditionalDatedServiceId, ServicePeriod>>;
  pkg?: string | number;
  price?: number;
  issueDate?: string;
  expireDate?: string;
  note?: string;
  note2?: string;
  status?: string;
  careStatus?: CareStatus;
  followUpDate?: string;
  followUpNote?: string;
  lastCareAt?: string;
  lastCareNote?: string;
  history?: HistoryEntry[];
  careLogs?: CareLog[];
  createdAt?: unknown;
  updatedAt?: unknown;
  [key: string]: unknown;
}
export type CustomerPatch = Partial<Customer> & { id?: never };
export type Page =
  | "reminders"
  | "today"
  | "customers"
  | "dashboard"
  | "reports"
  | "zalo"
  | "data";
export interface ZaloTemplate {
  key: string;
  name: string;
  desc: string;
  body: string;
}
