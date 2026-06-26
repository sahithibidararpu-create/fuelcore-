export declare class EmployeesService {
    getAll(query: Record<string, string | undefined>, user: {
        role: string;
        stationId: string | null;
    }): Promise<{
        success: true;
        data: ({
            user: {
                email: string;
                firstName: string;
                lastName: string;
                phone: string | null;
                role: import(".prisma/client").$Enums.Role;
                id: string;
                avatarUrl: string | null;
                lastLoginAt: Date | null;
            };
            station: {
                name: string;
                id: string;
            };
        } & {
            stationId: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            employeeCode: string;
            position: string;
            department: string | null;
            baseSalary: number;
            hourlyRate: number | null;
            hireDate: Date;
            terminatedAt: Date | null;
            emergencyContact: string | null;
            emergencyPhone: string | null;
        })[];
        meta: import("../../utils/pagination").PaginationMeta;
    }>;
    getById(id: string, stationId?: string | null): Promise<{
        user: {
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.Role;
            id: string;
            avatarUrl: string | null;
        };
        station: {
            name: string;
            id: string;
        };
        shifts: {
            date: Date;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            employeeId: string;
            shiftType: import(".prisma/client").$Enums.ShiftType;
            startTime: string;
            endTime: string;
            isPrimary: boolean;
        }[];
    } & {
        stationId: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        employeeCode: string;
        position: string;
        department: string | null;
        baseSalary: number;
        hourlyRate: number | null;
        hireDate: Date;
        terminatedAt: Date | null;
        emergencyContact: string | null;
        emergencyPhone: string | null;
    }>;
    createEmployee(data: Record<string, unknown>, stationId: string): Promise<{
        user: {
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.Role;
            id: string;
        };
        station: {
            name: string;
            id: string;
        };
    } & {
        stationId: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        employeeCode: string;
        position: string;
        department: string | null;
        baseSalary: number;
        hourlyRate: number | null;
        hireDate: Date;
        terminatedAt: Date | null;
        emergencyContact: string | null;
        emergencyPhone: string | null;
    }>;
    updateEmployee(id: string, data: Record<string, unknown>, stationId?: string | null): Promise<{
        user: {
            email: string;
            firstName: string;
            lastName: string;
            id: string;
        };
    } & {
        stationId: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        employeeCode: string;
        position: string;
        department: string | null;
        baseSalary: number;
        hourlyRate: number | null;
        hireDate: Date;
        terminatedAt: Date | null;
        emergencyContact: string | null;
        emergencyPhone: string | null;
    }>;
    getAttendance(query: Record<string, string | undefined>, stationId?: string | null): Promise<{
        success: true;
        data: ({
            user: {
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            status: import(".prisma/client").$Enums.AttendanceStatus;
            date: Date;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            notes: string | null;
            checkIn: Date | null;
            checkOut: Date | null;
            hoursWorked: number | null;
        })[];
        meta: import("../../utils/pagination").PaginationMeta;
    }>;
    checkIn(userId: string): Promise<{
        status: import(".prisma/client").$Enums.AttendanceStatus;
        date: Date;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        notes: string | null;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
    }>;
    checkOut(userId: string): Promise<{
        status: import(".prisma/client").$Enums.AttendanceStatus;
        date: Date;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        notes: string | null;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
    }>;
    getPayrollSummary(employeeId: string, stationId?: string | null): Promise<{
        employee: {
            id: string;
            name: string;
            position: string;
            baseSalary: number;
            hourlyRate: number | null;
        };
        period: {
            from: Date;
            to: Date;
        };
        attendance: {
            daysWorked: number;
            totalHours: number;
            records: number;
        };
        estimatedPay: number;
    }>;
}
export declare const employeesService: EmployeesService;
//# sourceMappingURL=employees.service.d.ts.map