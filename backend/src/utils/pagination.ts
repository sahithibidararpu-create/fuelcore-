import { CONSTANTS } from '../config/constants';

export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function parsePagination(query: PaginationQuery): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(query.page ?? CONSTANTS.DEFAULT_PAGE)));
  const limit = Math.min(
    CONSTANTS.MAX_LIMIT,
    Math.max(1, parseInt(String(query.limit ?? CONSTANTS.DEFAULT_LIMIT)))
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): { success: true; data: T[]; meta: PaginationMeta } {
  return {
    success: true,
    data,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export function successResponse<T>(data: T, message?: string) {
  return {
    success: true,
    ...(message && { message }),
    data,
  };
}

export function generateInvoiceNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${CONSTANTS.INVOICE_PREFIX}-${ts}-${rand}`;
}

export function generateAccountNumber(prefix: string): string {
  const num = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}-${num}`;
}

export function generateEmployeeCode(): string {
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `${CONSTANTS.EMPLOYEE_CODE_PREFIX}-${num}`;
}
