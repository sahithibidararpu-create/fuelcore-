"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSIONS = exports.ROLES = exports.HTTP_STATUS = exports.CONSTANTS = void 0;
exports.CONSTANTS = {
    // API
    API_VERSION: 'v1',
    API_PREFIX: '/api/v1',
    // Pagination
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    // Cache TTL (seconds)
    CACHE_TTL_SHORT: 60, // 1 min
    CACHE_TTL_MEDIUM: 300, // 5 min
    CACHE_TTL_LONG: 1800, // 30 min
    CACHE_TTL_DASHBOARD: 120, // 2 min
    // Token
    ACCESS_TOKEN_HEADER: 'Authorization',
    REFRESH_TOKEN_COOKIE: 'refreshToken',
    // Fuel types
    FUEL_TYPES: ['DIESEL', 'PETROL', 'PREMIUM', 'KEROSENE'],
    // Invoice
    INVOICE_PREFIX: 'INV',
    // Fleet account
    FLEET_ACCOUNT_PREFIX: 'FLT',
    EMPLOYEE_CODE_PREFIX: 'EMP',
    // Notifications SSE
    SSE_HEARTBEAT_INTERVAL_MS: 30000,
    // File upload
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_DOC_TYPES: ['application/pdf'],
};
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL: 500,
    SERVICE_UNAVAILABLE: 503,
};
exports.ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    STATION_MANAGER: 'STATION_MANAGER',
    EMPLOYEE: 'EMPLOYEE',
};
// ─── Role Permissions ─────────────────────────────────────────────────────────
// Each key is a resource, value is the set of roles that can access it
exports.PERMISSIONS = {
    'stations:manage': ['SUPER_ADMIN'],
    'users:manage': ['SUPER_ADMIN'],
    'settings:manage': ['SUPER_ADMIN', 'STATION_MANAGER'],
    'reports:export': ['SUPER_ADMIN', 'STATION_MANAGER'],
    'sales:void': ['SUPER_ADMIN', 'STATION_MANAGER'],
    'expenses:approve': ['SUPER_ADMIN', 'STATION_MANAGER'],
    'fleet:manage': ['SUPER_ADMIN', 'STATION_MANAGER'],
    'employees:manage': ['SUPER_ADMIN', 'STATION_MANAGER'],
    'analytics:view': ['SUPER_ADMIN', 'STATION_MANAGER'],
    'sales:create': ['SUPER_ADMIN', 'STATION_MANAGER', 'EMPLOYEE'],
    'attendance:self': ['SUPER_ADMIN', 'STATION_MANAGER', 'EMPLOYEE'],
};
//# sourceMappingURL=constants.js.map