"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireStationAccess = exports.requirePermission = exports.requireRole = void 0;
const errorHandler_1 = require("./errorHandler");
const constants_1 = require("../config/constants");
const requireRole = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new errorHandler_1.AppError('Authentication required', constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        if (!roles.includes(req.user.role)) {
            throw new errorHandler_1.AppError(`Access denied. Required role: ${roles.join(' or ')}`, constants_1.HTTP_STATUS.FORBIDDEN);
        }
        next();
    };
};
exports.requireRole = requireRole;
const requirePermission = (permission) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new errorHandler_1.AppError('Authentication required', constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        const allowedRoles = constants_1.PERMISSIONS[permission];
        if (!allowedRoles) {
            throw new errorHandler_1.AppError(`Unknown permission: ${permission}`, constants_1.HTTP_STATUS.INTERNAL);
        }
        if (!allowedRoles.includes(req.user.role)) {
            throw new errorHandler_1.AppError(`You don't have permission to perform this action`, constants_1.HTTP_STATUS.FORBIDDEN);
        }
        next();
    };
};
exports.requirePermission = requirePermission;
// Ensure station-level isolation: employee/manager can only access their station
const requireStationAccess = (req, _res, next) => {
    if (!req.user) {
        throw new errorHandler_1.AppError('Authentication required', constants_1.HTTP_STATUS.UNAUTHORIZED);
    }
    if (req.user.role === 'SUPER_ADMIN') {
        return next(); // SUPER_ADMIN can access all stations
    }
    // For station-scoped roles, inject stationId from user context
    const stationId = req.query.stationId || req.params.stationId || req.body?.stationId;
    if (stationId && stationId !== req.user.stationId) {
        throw new errorHandler_1.AppError('Access denied to this station', constants_1.HTTP_STATUS.FORBIDDEN);
    }
    // Auto-inject stationId for non-super-admins
    if (req.user.stationId) {
        req.query.stationId = req.user.stationId;
        if (req.method !== 'GET') {
            req.body = req.body || {};
            req.body.stationId = req.user.stationId;
        }
    }
    next();
};
exports.requireStationAccess = requireStationAccess;
//# sourceMappingURL=rbac.js.map