import { z } from 'zod';
export declare const createEmployeeSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodEnum<["SUPER_ADMIN", "STATION_MANAGER", "EMPLOYEE"]>;
    stationId: z.ZodString;
    position: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    baseSalary: z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>;
    hourlyRate: z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>;
    hireDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "SUPER_ADMIN" | "STATION_MANAGER" | "EMPLOYEE";
    stationId: string;
    position?: string | undefined;
    department?: string | undefined;
    baseSalary?: number | undefined;
    hourlyRate?: number | undefined;
    hireDate?: string | undefined;
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "SUPER_ADMIN" | "STATION_MANAGER" | "EMPLOYEE";
    stationId: string;
    position?: string | undefined;
    department?: string | undefined;
    baseSalary?: unknown;
    hourlyRate?: unknown;
    hireDate?: string | undefined;
}>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
//# sourceMappingURL=employees.schemas.d.ts.map