export declare const CONSTANTS: {
    readonly API_VERSION: "v1";
    readonly API_PREFIX: "/api/v1";
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
    readonly CACHE_TTL_SHORT: 60;
    readonly CACHE_TTL_MEDIUM: 300;
    readonly CACHE_TTL_LONG: 1800;
    readonly CACHE_TTL_DASHBOARD: 120;
    readonly ACCESS_TOKEN_HEADER: "Authorization";
    readonly REFRESH_TOKEN_COOKIE: "refreshToken";
    readonly FUEL_TYPES: readonly ["DIESEL", "PETROL", "PREMIUM", "KEROSENE"];
    readonly INVOICE_PREFIX: "INV";
    readonly FLEET_ACCOUNT_PREFIX: "FLT";
    readonly EMPLOYEE_CODE_PREFIX: "EMP";
    readonly SSE_HEARTBEAT_INTERVAL_MS: 30000;
    readonly ALLOWED_IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/webp"];
    readonly ALLOWED_DOC_TYPES: readonly ["application/pdf"];
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL: 500;
    readonly SERVICE_UNAVAILABLE: 503;
};
export declare const ROLES: {
    readonly SUPER_ADMIN: "SUPER_ADMIN";
    readonly STATION_MANAGER: "STATION_MANAGER";
    readonly EMPLOYEE: "EMPLOYEE";
};
export type UserRole = (typeof ROLES)[keyof typeof ROLES];
export declare const PERMISSIONS: Record<string, string[]>;
//# sourceMappingURL=constants.d.ts.map