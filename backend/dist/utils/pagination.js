"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.buildPaginationMeta = buildPaginationMeta;
exports.paginatedResponse = paginatedResponse;
exports.successResponse = successResponse;
exports.generateInvoiceNumber = generateInvoiceNumber;
exports.generateAccountNumber = generateAccountNumber;
exports.generateEmployeeCode = generateEmployeeCode;
const constants_1 = require("../config/constants");
function parsePagination(query) {
    const page = Math.max(1, parseInt(String(query.page ?? constants_1.CONSTANTS.DEFAULT_PAGE)));
    const limit = Math.min(constants_1.CONSTANTS.MAX_LIMIT, Math.max(1, parseInt(String(query.limit ?? constants_1.CONSTANTS.DEFAULT_LIMIT))));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
function buildPaginationMeta(total, page, limit) {
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
function paginatedResponse(data, total, page, limit) {
    return {
        success: true,
        data,
        meta: buildPaginationMeta(total, page, limit),
    };
}
function successResponse(data, message) {
    return {
        success: true,
        ...(message && { message }),
        data,
    };
}
function generateInvoiceNumber() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${constants_1.CONSTANTS.INVOICE_PREFIX}-${ts}-${rand}`;
}
function generateAccountNumber(prefix) {
    const num = Math.floor(Math.random() * 900000) + 100000;
    return `${prefix}-${num}`;
}
function generateEmployeeCode() {
    const num = Math.floor(Math.random() * 90000) + 10000;
    return `${constants_1.CONSTANTS.EMPLOYEE_CODE_PREFIX}-${num}`;
}
//# sourceMappingURL=pagination.js.map