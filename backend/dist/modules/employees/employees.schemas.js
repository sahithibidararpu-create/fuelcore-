"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmployeeSchema = void 0;
const zod_1 = require("zod");
exports.createEmployeeSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required').max(50),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(50),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[!@#$%^&*]/, 'Password must contain at least one special character'),
    role: zod_1.z.enum(['SUPER_ADMIN', 'STATION_MANAGER', 'EMPLOYEE']),
    stationId: zod_1.z.string().uuid('Invalid station selection'),
    position: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    baseSalary: zod_1.z.preprocess((val) => (val === '' || val === undefined || val === null ? undefined : Number(val)), zod_1.z.number().nonnegative().optional()),
    hourlyRate: zod_1.z.preprocess((val) => (val === '' || val === undefined || val === null ? undefined : Number(val)), zod_1.z.number().nonnegative().optional()),
    hireDate: zod_1.z.string().optional(),
});
//# sourceMappingURL=employees.schemas.js.map