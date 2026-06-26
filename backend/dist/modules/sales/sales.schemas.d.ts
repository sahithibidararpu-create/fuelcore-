import { z } from 'zod';
export declare const createSaleSchema: z.ZodObject<{
    pumpId: z.ZodString;
    volumeLiters: z.ZodNumber;
    pricePerLiter: z.ZodNumber;
    paymentMethod: z.ZodDefault<z.ZodEnum<["CASH", "CARD", "FLEET", "MOBILE"]>>;
    customerName: z.ZodOptional<z.ZodString>;
    customerPhone: z.ZodOptional<z.ZodString>;
    vehicleNumber: z.ZodOptional<z.ZodString>;
    fleetAccountId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    volumeLiters: number;
    pricePerLiter: number;
    paymentMethod: "CASH" | "CARD" | "FLEET" | "MOBILE";
    pumpId: string;
    customerName?: string | undefined;
    customerPhone?: string | undefined;
    vehicleNumber?: string | undefined;
    notes?: string | undefined;
    fleetAccountId?: string | undefined;
}, {
    volumeLiters: number;
    pricePerLiter: number;
    pumpId: string;
    paymentMethod?: "CASH" | "CARD" | "FLEET" | "MOBILE" | undefined;
    customerName?: string | undefined;
    customerPhone?: string | undefined;
    vehicleNumber?: string | undefined;
    notes?: string | undefined;
    fleetAccountId?: string | undefined;
}>;
export declare const saleQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodString>;
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
    pumpId: z.ZodOptional<z.ZodString>;
    fuelType: z.ZodOptional<z.ZodEnum<["DIESEL", "PETROL", "PREMIUM", "KEROSENE"]>>;
    paymentMethod: z.ZodOptional<z.ZodEnum<["CASH", "CARD", "FLEET", "MOBILE"]>>;
    stationId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    limit?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
    stationId?: string | undefined;
    paymentMethod?: "CASH" | "CARD" | "FLEET" | "MOBILE" | undefined;
    pumpId?: string | undefined;
    fuelType?: "DIESEL" | "PETROL" | "PREMIUM" | "KEROSENE" | undefined;
    page?: string | undefined;
}, {
    search?: string | undefined;
    limit?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
    stationId?: string | undefined;
    paymentMethod?: "CASH" | "CARD" | "FLEET" | "MOBILE" | undefined;
    pumpId?: string | undefined;
    fuelType?: "DIESEL" | "PETROL" | "PREMIUM" | "KEROSENE" | undefined;
    page?: string | undefined;
}>;
export declare const voidSaleSchema: z.ZodObject<{
    voidReason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    voidReason: string;
}, {
    voidReason: string;
}>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type SaleQueryInput = z.infer<typeof saleQuerySchema>;
export type VoidSaleInput = z.infer<typeof voidSaleSchema>;
//# sourceMappingURL=sales.schemas.d.ts.map