import { z } from 'zod';
export declare const createPumpSchema: z.ZodObject<{
    pumpNumber: z.ZodString;
    label: z.ZodString;
    tankId: z.ZodString;
    stationId: z.ZodOptional<z.ZodString>;
    openingMeter: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    tankId: string;
    pumpNumber: string;
    label: string;
    openingMeter: number;
    stationId?: string | undefined;
}, {
    tankId: string;
    pumpNumber: string;
    label: string;
    stationId?: string | undefined;
    openingMeter?: number | undefined;
}>;
export declare const updatePumpSchema: z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
    tankId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "MAINTENANCE"]>>;
    lastServiced: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | undefined;
    tankId?: string | undefined;
    label?: string | undefined;
    lastServiced?: string | undefined;
}, {
    status?: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | undefined;
    tankId?: string | undefined;
    label?: string | undefined;
    lastServiced?: string | undefined;
}>;
export declare const pumpQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodString>;
    stationId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "MAINTENANCE"]>>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | undefined;
    search?: string | undefined;
    limit?: string | undefined;
    stationId?: string | undefined;
    page?: string | undefined;
}, {
    status?: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | undefined;
    search?: string | undefined;
    limit?: string | undefined;
    stationId?: string | undefined;
    page?: string | undefined;
}>;
export type CreatePumpInput = z.infer<typeof createPumpSchema>;
export type UpdatePumpInput = z.infer<typeof updatePumpSchema>;
//# sourceMappingURL=pumps.schemas.d.ts.map