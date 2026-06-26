"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pumpQuerySchema = exports.updatePumpSchema = exports.createPumpSchema = void 0;
const zod_1 = require("zod");
exports.createPumpSchema = zod_1.z.object({
    pumpNumber: zod_1.z.string().min(1).max(10),
    label: zod_1.z.string().min(1).max(50),
    tankId: zod_1.z.string().uuid(),
    stationId: zod_1.z.string().uuid().optional(),
    openingMeter: zod_1.z.number().nonnegative().default(0),
});
exports.updatePumpSchema = zod_1.z.object({
    label: zod_1.z.string().min(1).max(50).optional(),
    tankId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
    lastServiced: zod_1.z.string().datetime().optional(),
});
exports.pumpQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    stationId: zod_1.z.string().optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
    search: zod_1.z.string().optional(),
});
//# sourceMappingURL=pumps.schemas.js.map