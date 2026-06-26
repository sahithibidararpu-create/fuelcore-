"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeesService = exports.EmployeesService = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
const constants_1 = require("../../config/constants");
const pagination_1 = require("../../utils/pagination");
const bcrypt_1 = require("../../utils/bcrypt");
const dateHelpers_1 = require("../../utils/dateHelpers");
class EmployeesService {
    async getAll(query, user) {
        const { page, limit, skip } = (0, pagination_1.parsePagination)(query);
        const stationId = user.role === 'SUPER_ADMIN' ? query.stationId : (user.stationId ?? undefined);
        const where = {
            isActive: true,
            ...(stationId && { stationId }),
            ...(query.search && {
                user: {
                    OR: [
                        { firstName: { contains: query.search, mode: 'insensitive' } },
                        { lastName: { contains: query.search, mode: 'insensitive' } },
                        { email: { contains: query.search, mode: 'insensitive' } },
                    ],
                },
            }),
        };
        const [total, data] = await Promise.all([
            database_1.prisma.employee.count({ where }),
            database_1.prisma.employee.findMany({
                where,
                skip,
                take: limit,
                orderBy: { user: { firstName: 'asc' } },
                include: {
                    user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, avatarUrl: true, lastLoginAt: true } },
                    station: { select: { id: true, name: true } },
                },
            }),
        ]);
        return (0, pagination_1.paginatedResponse)(data, total, page, limit);
    }
    async getById(id, stationId) {
        const employee = await database_1.prisma.employee.findFirst({
            where: { id, ...(stationId && { stationId }) },
            include: {
                user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, avatarUrl: true } },
                station: { select: { id: true, name: true } },
                shifts: { orderBy: { date: 'desc' }, take: 30 },
            },
        });
        if (!employee)
            throw new errorHandler_1.AppError('Employee not found', constants_1.HTTP_STATUS.NOT_FOUND);
        return employee;
    }
    async createEmployee(data, stationId) {
        const actualStationId = data.stationId || stationId;
        const email = data.email.toLowerCase();
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new errorHandler_1.AppError('Email already exists', constants_1.HTTP_STATUS.CONFLICT);
        }
        const passwordHash = await (0, bcrypt_1.hashPassword)(data.password || 'Temp@1234');
        const role = data.role || 'EMPLOYEE';
        const position = data.position || (role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'STATION_MANAGER' ? 'Station Manager' : 'Staff');
        const hireDate = data.hireDate ? new Date(data.hireDate) : new Date();
        return database_1.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    role,
                    stationId: actualStationId,
                },
            });
            const employee = await tx.employee.create({
                data: {
                    employeeCode: (0, pagination_1.generateEmployeeCode)(),
                    position,
                    department: data.department,
                    baseSalary: data.baseSalary || 0,
                    hourlyRate: data.hourlyRate,
                    hireDate,
                    emergencyContact: data.emergencyContact,
                    emergencyPhone: data.emergencyPhone,
                    userId: user.id,
                    stationId: actualStationId,
                },
                include: {
                    user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
                    station: { select: { id: true, name: true } },
                },
            });
            return employee;
        });
    }
    async updateEmployee(id, data, stationId) {
        const employee = await database_1.prisma.employee.findFirst({
            where: { id, ...(stationId && { stationId }) },
        });
        if (!employee)
            throw new errorHandler_1.AppError('Employee not found', constants_1.HTTP_STATUS.NOT_FOUND);
        return database_1.prisma.employee.update({
            where: { id },
            data: {
                position: data.position,
                department: data.department,
                baseSalary: data.baseSalary,
                hourlyRate: data.hourlyRate,
                emergencyContact: data.emergencyContact,
                emergencyPhone: data.emergencyPhone,
            },
            include: {
                user: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
        });
    }
    // ─── Attendance ──────────────────────────────────────────────────────────────
    async getAttendance(query, stationId) {
        const { from, to } = (0, dateHelpers_1.parseDateRange)(query.from, query.to);
        const { page, limit, skip } = (0, pagination_1.parsePagination)(query);
        const where = {
            date: { gte: from, lte: to },
            ...(query.userId && { userId: query.userId }),
            ...(stationId && { user: { stationId } }),
        };
        const [total, data] = await Promise.all([
            database_1.prisma.attendance.count({ where }),
            database_1.prisma.attendance.findMany({
                where,
                skip,
                take: limit,
                orderBy: { date: 'desc' },
                include: {
                    user: { select: { firstName: true, lastName: true, email: true } },
                },
            }),
        ]);
        return (0, pagination_1.paginatedResponse)(data, total, page, limit);
    }
    async checkIn(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await database_1.prisma.attendance.findFirst({
            where: { userId, date: today },
        });
        if (existing?.checkIn) {
            throw new errorHandler_1.AppError('Already checked in today', constants_1.HTTP_STATUS.CONFLICT);
        }
        return database_1.prisma.attendance.upsert({
            where: { userId_date: { userId, date: today } },
            create: { userId, date: today, checkIn: new Date(), status: 'PRESENT' },
            update: { checkIn: new Date(), status: 'PRESENT' },
        });
    }
    async checkOut(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const record = await database_1.prisma.attendance.findFirst({
            where: { userId, date: today },
        });
        if (!record || !record.checkIn) {
            throw new errorHandler_1.AppError('No check-in found for today', constants_1.HTTP_STATUS.BAD_REQUEST);
        }
        if (record.checkOut) {
            throw new errorHandler_1.AppError('Already checked out today', constants_1.HTTP_STATUS.CONFLICT);
        }
        const checkOut = new Date();
        const hoursWorked = (checkOut.getTime() - record.checkIn.getTime()) / (1000 * 60 * 60);
        return database_1.prisma.attendance.update({
            where: { id: record.id },
            data: { checkOut, hoursWorked: Math.round(hoursWorked * 100) / 100 },
        });
    }
    async getPayrollSummary(employeeId, stationId) {
        const employee = await database_1.prisma.employee.findFirst({
            where: { id: employeeId, ...(stationId && { stationId }) },
            include: { user: { select: { firstName: true, lastName: true } } },
        });
        if (!employee)
            throw new errorHandler_1.AppError('Employee not found', constants_1.HTTP_STATUS.NOT_FOUND);
        const thisMonth = new Date();
        const from = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
        const to = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0, 23, 59, 59);
        const attendance = await database_1.prisma.attendance.findMany({
            where: { userId: employee.userId, date: { gte: from, lte: to } },
        });
        const daysWorked = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
        const totalHours = attendance.reduce((sum, a) => sum + (a.hoursWorked ?? 0), 0);
        return {
            employee: {
                id: employee.id,
                name: `${employee.user.firstName} ${employee.user.lastName}`,
                position: employee.position,
                baseSalary: employee.baseSalary,
                hourlyRate: employee.hourlyRate,
            },
            period: { from, to },
            attendance: { daysWorked, totalHours, records: attendance.length },
            estimatedPay: employee.hourlyRate
                ? totalHours * employee.hourlyRate
                : (daysWorked / 22) * employee.baseSalary,
        };
    }
}
exports.EmployeesService = EmployeesService;
exports.employeesService = new EmployeesService();
//# sourceMappingURL=employees.service.js.map