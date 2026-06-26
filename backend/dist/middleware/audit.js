"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const auditLog = (action, entity) => {
    return async (req, _res, next) => {
        next();
        // Post-response audit
        if (req.user) {
            setImmediate(async () => {
                try {
                    await database_1.prisma.auditLog.create({
                        data: {
                            userId: req.user.id,
                            action,
                            entity,
                            entityId: req.params.id,
                            newValues: req.body ? JSON.parse(JSON.stringify(req.body)) : undefined,
                            ipAddress: req.ip ?? req.socket.remoteAddress,
                            userAgent: req.get('user-agent'),
                        },
                    });
                }
                catch (err) {
                    logger_1.logger.error('Failed to write audit log', { err });
                }
            });
        }
    };
};
exports.auditLog = auditLog;
//# sourceMappingURL=audit.js.map