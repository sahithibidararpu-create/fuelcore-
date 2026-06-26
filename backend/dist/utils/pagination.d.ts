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
export declare function parsePagination(query: PaginationQuery): {
    page: number;
    limit: number;
    skip: number;
};
export declare function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta;
export declare function paginatedResponse<T>(data: T[], total: number, page: number, limit: number): {
    success: true;
    data: T[];
    meta: PaginationMeta;
};
export declare function successResponse<T>(data: T, message?: string): {
    data: T;
    message?: string | undefined;
    success: boolean;
};
export declare function generateInvoiceNumber(): string;
export declare function generateAccountNumber(prefix: string): string;
export declare function generateEmployeeCode(): string;
//# sourceMappingURL=pagination.d.ts.map