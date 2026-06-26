"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voidSaleSchema = exports.saleQuerySchema = exports.createSaleSchema = void 0;
const zod_1 = require("zod");
exports.createSaleSchema = zod_1.z.object({
    pumpId: zod_1.z.string().uuid(),
    volumeLiters: zod_1.z.number().positive('Volume must be positive'),
    pricePerLiter: zod_1.z.number().positive('Price must be positive'),
    paymentMethod: zod_1.z.enum(['CASH', 'CARD', 'FLEET', 'MOBILE']).default('CASH'),
    customerName: zod_1.z.string().max(100).optional(),
    customerPhone: zod_1.z.string().max(20).optional(),
    vehicleNumber: zod_1.z.string().max(20).optional(),
    fleetAccountId: zod_1.z.string().uuid().optional(),
    notes: zod_1.z.string().max(500).optional(),
});
exports.saleQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    from: zod_1.z.string().optional(),
    to: zod_1.z.string().optional(),
    pumpId: zod_1.z.string().optional(),
    fuelType: zod_1.z.enum(['DIESEL', 'PETROL', 'PREMIUM', 'KEROSENE']).optional(),
    paymentMethod: zod_1.z.enum(['CASH', 'CARD', 'FLEET', 'MOBILE']).optional(),
    stationId: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
});
exports.voidSaleSchema = zod_1.z.object({
    voidReason: zod_1.z.string().min(5, 'Void reason is required'),
});
//# sourceMappingURL=sales.schemas.js.map